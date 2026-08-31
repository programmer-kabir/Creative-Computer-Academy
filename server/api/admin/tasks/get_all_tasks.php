<?php
require_once '../../../config/cors.php';
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

        // Fetch blueprint variants if any
        try {
            $bv_stmt = $db->prepare("SELECT id, variant_name, ai_model_used, is_active, blueprint_json, created_at FROM task_blueprint_variants WHERE task_id = :task_id ORDER BY is_active DESC, id ASC");
            $bv_stmt->execute([':task_id' => $row['id']]);
            $b_variants = $bv_stmt->fetchAll(PDO::FETCH_ASSOC);
            $row['blueprint_variants'] = array_map(function($bv) {
                $bv['blueprint_data'] = !empty($bv['blueprint_json']) ? json_decode($bv['blueprint_json'], true) : null;
                $bv['is_active'] = (int)$bv['is_active'] === 1;
                return $bv;
            }, $b_variants);
        } catch (Exception $ex) {
            $row['blueprint_variants'] = [];
        }

        // Fetch task review/rating if available
        try {
            $tr_stmt = $db->prepare("SELECT tr.rating, tr.feedback_notes, tr.tags, tr.created_at as reviewed_at, u.name as reviewer_name 
                FROM task_reviews tr 
                LEFT JOIN users u ON tr.reviewer_id = u.id 
                WHERE tr.task_id = :task_id LIMIT 1");
            $tr_stmt->execute([':task_id' => $row['id']]);
            if ($rev = $tr_stmt->fetch(PDO::FETCH_ASSOC)) {
                $rev['tags'] = !empty($rev['tags']) && is_string($rev['tags']) ? json_decode($rev['tags'], true) : [];
                $row['review'] = $rev;
            } else {
                $row['review'] = null;
            }
        } catch (Exception $ex) {
            $row['review'] = null;
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
