<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->title) || !isset($data->category)) {
    echo json_encode(["status" => "error", "message" => "Title and Category are required."]);
    exit;
}

try {
    // Dynamically get a valid user ID for 'created_by' since we bypassed auth
    $stmt_user = $db->query("SELECT id FROM users LIMIT 1");
    $created_by = $stmt_user->fetchColumn();

    if (!$created_by) {
        // If no user exists, create a dummy admin
        $db->exec("INSERT INTO users (name, email, password, status) VALUES ('System Admin', 'admin@admin.com', '123456', 'active')");
        $created_by = $db->lastInsertId();
    }

    // assigned_to is optional for Unassigned Task Pool
    $employee_id = null;
    $is_unassigned = true;
    
    if (isset($data->assigned_to) && $data->assigned_to !== '' && $data->assigned_to !== 'unassigned' && $data->assigned_to !== null) {
        $stmt_emp = $db->prepare("SELECT id FROM employees WHERE user_id = :user_id LIMIT 1");
        $stmt_emp->execute([':user_id' => $data->assigned_to]);
        $employee_id = $stmt_emp->fetchColumn();

        if (!$employee_id) {
            echo json_encode(["status" => "error", "message" => "The selected staff member does not have an employee profile."]);
            exit;
        }
        $is_unassigned = false;
    }

    // Decode JWT to get admin name for history
    $created_by_name = 'Admin';
    if(isset($headers['Authorization'])){
        $authHeader = $headers['Authorization'];
        $token = str_replace('Bearer ', '', $authHeader);
        try {
            $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
            $created_by_name = $decoded->data->name ?? 'Admin';
        } catch(Exception $e) {}
    }

    $initial_status = $is_unassigned ? 'Unassigned' : 'To-Do';

    // Auto-ensure columns exist in tasks table
    try {
        $db->exec("ALTER TABLE tasks ADD COLUMN `creation_mode` ENUM('manual', 'agentic') DEFAULT 'manual'");
    } catch (Exception $e) {}
    try {
        $db->exec("ALTER TABLE tasks ADD COLUMN `blueprint_data` LONGTEXT DEFAULT NULL");
    } catch (Exception $e) {}

    $creation_mode = !empty($data->creation_mode) ? $data->creation_mode : (!empty($data->blueprint_data) ? 'agentic' : 'manual');
    $blueprint_data_val = isset($data->blueprint_data) ? (is_string($data->blueprint_data) ? $data->blueprint_data : json_encode($data->blueprint_data)) : null;

    $query = "INSERT INTO tasks (title, description, priority, checklists, ref_links, ref_image, visual_image, blueprint_data, creation_mode, created_by, assigned_to, category, department_id, status, assign_date, deadline, deadline_time, submission_link) 
              VALUES (:title, :description, :priority, :checklists, :ref_links, :ref_image, :visual_image, :blueprint_data, :creation_mode, :created_by, :assigned_to, :category, :department_id, :status, :assign_date, :deadline, :deadline_time, :submission_link)";
              
    $stmt = $db->prepare($query);

    // Form data fields
    $priority = $data->priority ?? 'Medium';
    
    // Checklists: ensure it's saved as JSON string
    $checklists_val = null;
    if (isset($data->checklists)) {
        $checklists_val = is_string($data->checklists) ? $data->checklists : json_encode($data->checklists);
    }

    // ref_links may arrive as a JSON array or a plain string.
    // Always store as a JSON string in the DB.
    $raw_links = $data->ref_links ?? null;
    if (is_array($raw_links)) {
        $ref_links_val = json_encode(array_values(array_filter($raw_links)));
    } else {
        $ref_links_val = $raw_links; // already a JSON string or null
    }

    // ref_image processing: ensure valid string paths only
    $raw_images = $data->ref_image ?? null;
    if (is_string($raw_images)) {
        $decoded = json_decode($raw_images, true);
        $raw_images = is_array($decoded) ? $decoded : ($raw_images ? [$raw_images] : []);
    }
    if (is_array($raw_images)) {
        $cleaned_images = array_values(array_filter($raw_images, function($item) {
            return is_string($item) && trim($item) !== '' && $item !== '{}' && $item !== '[object Object]';
        }));
        $ref_image_val = json_encode($cleaned_images);
    } else {
        $ref_image_val = json_encode([]);
    }

    // visual_image processing: ensure valid string paths only
    $raw_visual = $data->visual_image ?? null;
    if (is_string($raw_visual)) {
        $decoded = json_decode($raw_visual, true);
        $raw_visual = is_array($decoded) ? $decoded : ($raw_visual ? [$raw_visual] : []);
    }
    if (is_array($raw_visual)) {
        $cleaned_visual = array_values(array_filter($raw_visual, function($item) {
            return is_string($item) && trim($item) !== '' && $item !== '{}' && $item !== '[object Object]';
        }));
        $visual_image_val = json_encode($cleaned_visual);
    } else {
        $visual_image_val = json_encode([]);
    }

    $stmt->execute([
        ':title'           => $data->title,
        ':description'     => $data->description ?? null,
        ':priority'        => $priority,
        ':checklists'      => $checklists_val,
        ':ref_links'       => $ref_links_val,
        ':ref_image'       => $ref_image_val,
        ':visual_image'    => $visual_image_val,
        ':blueprint_data'  => $blueprint_data_val,
        ':creation_mode'   => $creation_mode,
        ':created_by'      => $created_by,
        ':assigned_to'     => $employee_id,
        ':category'        => $data->category,
        ':department_id'   => $data->department_id ?? null,
        ':status'          => $initial_status,
        ':assign_date'     => !empty($data->assign_date) ? $data->assign_date : date('Y-m-d'),
        ':deadline'        => (isset($data->deadline) && $data->deadline !== '') ? $data->deadline : null,
        ':deadline_time'   => (isset($data->deadline_time) && $data->deadline_time !== '') ? $data->deadline_time : null,
        ':submission_link' => !empty($data->submission_link) ? trim($data->submission_link) : null
    ]);

    $task_id = $db->lastInsertId();

    // Log history
    require_once '../../tasks/task_history_helper.php';
    $logger = new TaskHistoryLogger($db);
    $log_msg = $is_unassigned ? ($creation_mode === 'agentic' ? "Agentic AI Task Created (Unassigned)" : "Task Created as Unassigned") : ($creation_mode === 'agentic' ? "Agentic AI Blueprint Task Created & Assigned" : "Task Created & Assigned");
    $logger->logHistory($task_id, $log_msg, $created_by_name);

    if (!$is_unassigned) {
        // Send Notification to assigned Staff
        require_once '../../notifications/notification_helper.php';
        $priority = $data->priority ?? 'Normal';
        NotificationHelper::sendToUser(
            $db,
            $data->assigned_to,
            $created_by,
            "New Task Assigned: " . $data->title,
            "You have been assigned a new task: {$data->title}. Category: {$data->category}",
            "task_assigned",
            "staff",
            "/tasks",
            $priority === 'High' || $priority === 'Critical' ? 'high' : 'normal',
            ["task_id" => $task_id, "category" => $data->category]
        );

        // Send email notification
        require_once '../../emails/EmailHelper.php';
        $stmt_user = $db->prepare("SELECT name, email FROM users WHERE id = :id LIMIT 1");
        $stmt_user->execute([':id' => $data->assigned_to]);
        $user_data = $stmt_user->fetch(PDO::FETCH_ASSOC);

        if ($user_data && !empty($user_data['email'])) {
            $stmt_tpl = $db->prepare("SELECT subject, body FROM email_templates WHERE event_name = 'task_assigned'");
            $stmt_tpl->execute();
            if ($tpl = $stmt_tpl->fetch(PDO::FETCH_ASSOC)) {
                $subject = str_replace('{{task_title}}', $data->title ?? 'Task', $tpl['subject']);
                $body = $tpl['body'];
                $body = str_replace('{{staff_name}}', $user_data['name'], $body);
                $body = str_replace('{{task_title}}', $data->title ?? 'Task', $body);
                $body = str_replace('{{task_category}}', $data->category ?? 'N/A', $body);
                
                $actionUrl = 'https://staff.creativecomputeracademy.com/tasks?taskId=' . $task_id;
                $htmlBody = EmailHelper::getHtmlTemplate($subject, $body, $actionUrl, 'View Task');
                
                EmailHelper::sendEmail($user_data['email'], $user_data['name'], $subject, $htmlBody);
            }
        }
    }

    echo json_encode(["status" => "success", "message" => "Task assigned successfully."]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>