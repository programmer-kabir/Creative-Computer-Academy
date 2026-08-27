<?php
require_once '../../../config/cors.php';

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->task_id) || !isset($data->title) || !isset($data->category)) {
    echo json_encode(["status" => "error", "message" => "Task ID, Title, and Category are required."]);
    exit;
}

try {
    $stmt_old = $db->prepare("SELECT assigned_to FROM tasks WHERE id = :id");
    $stmt_old->execute([':id' => $data->task_id]);
    $old_employee_id = $stmt_old->fetchColumn();

    // If assigned_to (user_id) is provided, look up the employee id
    $employee_id = null;
    if (isset($data->assigned_to) && !empty($data->assigned_to)) {
        $stmt_emp = $db->prepare("SELECT id FROM employees WHERE user_id = :user_id LIMIT 1");
        $stmt_emp->execute([':user_id' => $data->assigned_to]);
        $employee_id = $stmt_emp->fetchColumn();

        if (!$employee_id) {
            echo json_encode(["status" => "error", "message" => "The selected staff member does not have an employee profile."]);
            exit;
        }
    }

    $title       = $data->title;
    $description = isset($data->description) ? $data->description : null;
    $category    = $data->category;
    $department_id = isset($data->department_id) ? $data->department_id : null;
    $task_id     = $data->task_id;
    $assign_date = isset($data->assign_date) ? $data->assign_date : null;

    // ref_links may arrive as a PHP array or a JSON string — always store as JSON string.
    $raw_links = isset($data->ref_links) ? $data->ref_links : null;
    if (is_array($raw_links)) {
        $ref_links = json_encode(array_values(array_filter($raw_links)));
    } else {
        $ref_links = $raw_links;
    }

    // ref_image may arrive as a PHP array or a JSON string — always store as JSON string.
    $raw_images = isset($data->ref_image) ? $data->ref_image : null;
    if (is_array($raw_images)) {
        $ref_image = json_encode(array_values(array_filter($raw_images)));
    } else {
        $ref_image = $raw_images;
    }

    // visual_image processing
    $raw_visual = isset($data->visual_image) ? $data->visual_image : null;
    if (is_array($raw_visual)) {
        $visual_image = json_encode(array_values(array_filter($raw_visual)));
    } else {
        $visual_image = $raw_visual;
    }

    $deadline      = isset($data->deadline) && $data->deadline !== '' ? $data->deadline : null;
    $deadline_time = isset($data->deadline_time) && $data->deadline_time !== '' ? $data->deadline_time : null;

    // Decode JWT to get admin name for history
    $updated_by_name = 'Admin';
    if(isset($headers['Authorization'])){
        $authHeader = $headers['Authorization'];
        $token = str_replace('Bearer ', '', $authHeader);
        try {
            $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
            $updated_by_name = $decoded->data->name ?? 'Admin';
        } catch(Exception $e) {}
    }

    $priority = $data->priority ?? 'Medium';
    $checklists_val = isset($data->checklists) ? (is_string($data->checklists) ? $data->checklists : json_encode($data->checklists)) : null;

    $submission_link = isset($data->submission_link) ? trim($data->submission_link) : null;

    if ($employee_id) {
        $query = "UPDATE tasks 
                  SET title = :title, description = :description, priority = :priority, checklists = :checklists, ref_links = :ref_links, ref_image = :ref_image, visual_image = :visual_image,
                      category = :category, department_id = :department_id, assigned_to = :assigned_to,
                      status = IF(status = 'Unassigned', 'To-Do', status),
                      assign_date = COALESCE(:assign_date, assign_date),
                      deadline = :deadline, deadline_time = :deadline_time,
                      submission_link = :submission_link
                  WHERE id = :task_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':assigned_to', $employee_id);
    } else {
        // Keep existing assigned_to if not provided
        $query = "UPDATE tasks 
                  SET title = :title, description = :description, priority = :priority, checklists = :checklists, ref_links = :ref_links, ref_image = :ref_image, visual_image = :visual_image,
                      category = :category, department_id = :department_id,
                      assign_date = COALESCE(:assign_date, assign_date),
                      deadline = :deadline, deadline_time = :deadline_time,
                      submission_link = :submission_link
                  WHERE id = :task_id";
        $stmt = $db->prepare($query);
    }

    $stmt->bindParam(':title',           $title);
    $stmt->bindParam(':description',     $description);
    $stmt->bindParam(':priority',        $priority);
    $stmt->bindParam(':checklists',      $checklists_val);
    $stmt->bindParam(':ref_links',       $ref_links);
    $stmt->bindParam(':ref_image',       $ref_image);
    $stmt->bindParam(':visual_image',    $visual_image);
    $stmt->bindParam(':category',        $category);
    $stmt->bindParam(':department_id',   $department_id);
    $stmt->bindParam(':assign_date',     $assign_date);
    $stmt->bindParam(':deadline',        $deadline);
    $stmt->bindParam(':deadline_time',   $deadline_time);
    $stmt->bindParam(':submission_link', $submission_link);
    $stmt->bindParam(':task_id',         $task_id);

    if ($stmt->execute()) {
        require_once '../../tasks/task_history_helper.php';
        $logger = new TaskHistoryLogger($db);
        $logger->logHistory($task_id, "Task Updated", $updated_by_name);

        if (isset($data->assigned_to) && !empty($data->assigned_to)) {
            require_once '../../notifications/notification_helper.php';
            NotificationHelper::sendToUser(
                $db,
                $data->assigned_to,
                null,
                "Task Updated: " . $title,
                "The task '{$title}' assigned to you has been updated by Admin.",
                "task_updated",
                "staff",
                "/tasks",
                "normal",
                ["task_id" => $task_id]
            );

            // Send Email only if assigned to a NEW person (or previously unassigned)
            if ($employee_id && $old_employee_id !== $employee_id) {
                require_once '../../emails/EmailHelper.php';
                $stmt_user = $db->prepare("SELECT name, email FROM users WHERE id = :id LIMIT 1");
                $stmt_user->execute([':id' => $data->assigned_to]);
                $user_data = $stmt_user->fetch(PDO::FETCH_ASSOC);

                if ($user_data && !empty($user_data['email'])) {
                    $stmt_tpl = $db->prepare("SELECT subject, body FROM email_templates WHERE event_name = 'task_assigned'");
                    $stmt_tpl->execute();
                    if ($tpl = $stmt_tpl->fetch(PDO::FETCH_ASSOC)) {
                        $subject = str_replace('{{task_title}}', $title ?? 'Task', $tpl['subject']);
                        $body = $tpl['body'];
                        $body = str_replace('{{staff_name}}', $user_data['name'], $body);
                        $body = str_replace('{{task_title}}', $title ?? 'Task', $body);
                        $body = str_replace('{{task_category}}', $category ?? 'N/A', $body);
                        
                        $actionUrl = 'https://staff.creativecomputeracademy.com/tasks?taskId=' . $task_id;
                        $htmlBody = EmailHelper::getHtmlTemplate($subject, $body, $actionUrl, 'View Task');
                        
                        EmailHelper::sendEmail($user_data['email'], $user_data['name'], $subject, $htmlBody);
                    }
                }
            }
        }

        echo json_encode(["status" => "success", "message" => "Task updated successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update task."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>