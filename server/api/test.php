<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once '../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Update the status enum to include 'Unassigned'
    $db->exec("ALTER TABLE tasks MODIFY COLUMN status ENUM('Unassigned', 'To-Do', 'In Progress', 'In Review', 'Completed', 'Rejected') NOT NULL DEFAULT 'To-Do'");
    
    // Fix any blank statuses
    $db->exec("UPDATE tasks SET status = 'Unassigned' WHERE assigned_to IS NULL AND (status = '' OR status IS NULL)");
    
    echo json_encode(["status" => "success", "message" => "Database successfully updated!"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
