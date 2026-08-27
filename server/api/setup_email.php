<?php
require_once '../config/cors.php';
require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Create table
    $query = "CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(50) NOT NULL UNIQUE,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $db->exec($query);
    
    // Insert task_assigned template
    $body = "<p>Hello {{staff_name}},</p>
<p>You have been assigned a new task: <strong>{{task_title}}</strong>.</p>
<p><strong>Category:</strong> {{task_category}}</p>
<p>Please log in to your dashboard to view the details and start working on it.</p>";

    $stmt = $db->prepare("INSERT INTO email_templates (event_name, subject, body) VALUES ('task_assigned', 'New Task Assigned: {{task_title}}', :body) ON DUPLICATE KEY UPDATE body = :body, subject = 'New Task Assigned: {{task_title}}'");
    $stmt->execute([':body' => $body]);
    
    // Insert task_approved template
    $approved_body = "<p>Hello {{staff_name}},</p>
<p>Great news! Your task <strong>{{task_title}}</strong> has been reviewed and <strong>Approved</strong>.</p>
<p>Keep up the good work!</p>";
    $stmt_approved = $db->prepare("INSERT INTO email_templates (event_name, subject, body) VALUES ('task_approved', 'Task Approved: {{task_title}}', :body) ON DUPLICATE KEY UPDATE body = :body, subject = 'Task Approved: {{task_title}}'");
    $stmt_approved->execute([':body' => $approved_body]);

    // Insert task_rejected template
    $rejected_body = "<p>Hello {{staff_name}},</p>
<p>Your task <strong>{{task_title}}</strong> has been reviewed and requires <strong>Revision (Rejected)</strong>.</p>
<p><strong>Reason for rejection:</strong><br/>
{{rejection_reason}}</p>
{{rejection_image_html}}
<p>Please log in to your dashboard, make the necessary corrections, and resubmit.</p>";
    $stmt_rejected = $db->prepare("INSERT INTO email_templates (event_name, subject, body) VALUES ('task_rejected', 'Revision Required: {{task_title}}', :body) ON DUPLICATE KEY UPDATE body = :body, subject = 'Revision Required: {{task_title}}'");
    $stmt_rejected->execute([':body' => $rejected_body]);

    echo json_encode(["status" => "success", "message" => "Email templates created/updated successfully!"]);
} catch(Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
