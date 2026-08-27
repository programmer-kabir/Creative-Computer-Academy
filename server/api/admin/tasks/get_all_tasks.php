<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "
        SELECT 
            t.*,
            u.name as assigned_to_name,
            u.profile_picture as assigned_to_avatar
        FROM tasks t
        LEFT JOIN employees e ON t.assigned_to = e.id
        LEFT JOIN users u ON e.user_id = u.id
        ORDER BY FIELD(t.status, 'In Review', 'In Progress', 'To-Do', 'Completed'), COALESCE(t.assign_date, t.created_at) DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $tasks = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Fetch History
        $history_query = "SELECT * FROM task_history WHERE task_id = :task_id ORDER BY created_at ASC";
        $history_stmt = $db->prepare($history_query);
        $history_stmt->execute([':task_id' => $row['id']]);
        $row['history'] = $history_stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode Checklists
        if (!empty($row['checklists']) && is_string($row['checklists'])) {
            $row['checklists'] = json_decode($row['checklists'], true);
        } else {
            $row['checklists'] = [];
        }

        // Fetch Submissions
        try {
            $sub_query = "SELECT * FROM task_submissions WHERE task_id = :task_id ORDER BY id ASC";
            $sub_stmt = $db->prepare($sub_query);
            $sub_stmt->execute([':task_id' => $row['id']]);
            $row['submissions'] = $sub_stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $ex) {
            $row['submissions'] = [];
        }

        // Fetch Reviewer Final Stock Delivery
        try {
            $del_query = "SELECT tfd.*, u.name as reviewer_name 
                          FROM task_final_deliveries tfd 
                          LEFT JOIN users u ON tfd.reviewer_id = u.id 
                          WHERE tfd.task_id = :task_id LIMIT 1";
            $del_stmt = $db->prepare($del_query);
            $del_stmt->execute([':task_id' => $row['id']]);
            $row['final_delivery'] = $del_stmt->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (Exception $ex) {
            $row['final_delivery'] = null;
        }

        // Decode blueprint_data
        if (!empty($row['blueprint_data'])) {
            $row['blueprint_data'] = is_string($row['blueprint_data']) ? json_decode($row['blueprint_data'], true) : $row['blueprint_data'];
        } else {
            $row['blueprint_data'] = null;
        }

        $tasks[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data" => $tasks
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
