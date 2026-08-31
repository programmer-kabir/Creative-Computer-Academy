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

    $creation_mode = !empty($data->creation_mode) ? $data->creation_mode : (!empty($data->blueprint_variants) || !empty($data->blueprint_data) ? 'agentic' : 'manual');

    $query = "INSERT INTO tasks (title, description, priority, checklists, ref_links, ref_image, visual_image, creation_mode, created_by, assigned_to, category, department_id, status, assign_date, deadline, deadline_time, submission_link) 
              VALUES (:title, :description, :priority, :checklists, :ref_links, :ref_image, :visual_image, :creation_mode, :created_by, :assigned_to, :category, :department_id, :status, :assign_date, :deadline, :deadline_time, :submission_link)";
              
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
    if (is_array($raw_images)) {
        $clean_images = array_values(array_filter($raw_images, function($img) {
            return is_string($img) && !empty(trim($img));
        }));
        $ref_image_val = json_encode($clean_images);
    } elseif (is_string($raw_images) && !empty(trim($raw_images))) {
        $ref_image_val = $raw_images;
    } else {
        $ref_image_val = json_encode([]);
    }

    // visual_image processing: ensure valid string paths only
    $raw_visual = $data->visual_image ?? null;
    if (is_array($raw_visual)) {
        $clean_visual = array_values(array_filter($raw_visual, function($img) {
            return is_string($img) && !empty(trim($img));
        }));
        $visual_image_val = json_encode($clean_visual);
    } elseif (is_string($raw_visual) && !empty(trim($raw_visual))) {
        $visual_image_val = $raw_visual;
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

    // Insert blueprint variants if provided
    try {
        $raw_variants = isset($data->blueprint_variants) ? $data->blueprint_variants : [];
        $variants = json_decode(json_encode($raw_variants), true);
        if (!is_array($variants)) $variants = [];

        $blueprint_data_val = isset($data->blueprint_data) ? (is_string($data->blueprint_data) ? $data->blueprint_data : json_encode($data->blueprint_data)) : null;

        // Check if any variant already has a valid blueprint
        $hasAnyValidBlueprint = false;
        foreach ($variants as $v) {
            if (is_array($v) && (!empty($v['blueprint_data']) || !empty($v['blueprint_json']))) {
                $hasAnyValidBlueprint = true;
                break;
            }
        }

        // If no variants have valid blueprint but blueprint_data is sent, create initial Variant 1
        if (!$hasAnyValidBlueprint && !empty($blueprint_data_val)) {
            $parsed_b = json_decode($blueprint_data_val, true);
            $model_used = $parsed_b['model_used'] ?? 'meta-llama/llama-3.3-70b-instruct:free';
            $variants = [
                [
                    'variant_name' => 'Variant 1',
                    'ai_model_used' => $model_used,
                    'is_active' => 1,
                    'blueprint_json' => $blueprint_data_val
                ]
            ];
        }

        if (!empty($variants)) {
            $ins_var = $db->prepare("INSERT INTO task_blueprint_variants (task_id, variant_name, ai_model_used, is_active, blueprint_json) 
                VALUES (:task_id, :variant_name, :ai_model_used, :is_active, :blueprint_json)");
            
            $hasActive = false;
            foreach ($variants as $v) {
                if (is_array($v) && !empty($v['is_active'])) { $hasActive = true; break; }
            }

            foreach ($variants as $idx => $v) {
                if (!is_array($v)) continue;
                $v_name = !empty($v['variant_name']) ? trim($v['variant_name']) : ('Variant ' . ($idx + 1));
                $v_model = !empty($v['ai_model_used']) ? trim($v['ai_model_used']) : null;
                $v_active = (!empty($v['is_active']) || (!$hasActive && $idx === 0)) ? 1 : 0;
                $raw_b = $v['blueprint_data'] ?? $v['blueprint_json'] ?? null;
                $v_json = is_array($raw_b) ? json_encode($raw_b) : (is_string($raw_b) ? $raw_b : null);

                if (!empty($v_json) && $v_json !== 'null' && $v_json !== '""') {
                    $ins_var->execute([
                        ':task_id' => $task_id,
                        ':variant_name' => $v_name,
                        ':ai_model_used' => $v_model,
                        ':is_active' => $v_active,
                        ':blueprint_json' => $v_json
                    ]);
                }
            }
        }
    } catch (Exception $e) {}

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