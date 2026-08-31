<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$reviewer_user_id = isset($_GET['reviewer_user_id']) ? intval($_GET['reviewer_user_id']) : null;
if (!$reviewer_user_id) {
    $data = json_decode(file_get_contents("php://input"));
    if (isset($data->reviewer_user_id)) $reviewer_user_id = intval($data->reviewer_user_id);
}

if (!$reviewer_user_id) {
    echo json_encode(["status" => "error", "message" => "reviewer_user_id is required."]);
    exit;
}

try {
    // Query tasks with status 'Completed' assigned to employees under this reviewer
    $query = "
        SELECT 
            t.id AS task_id,
            t.title,
            t.description,
            t.priority,
            t.deadline,
            t.checklists,
            t.ref_image,
            t.visual_image,
            t.ref_links,
            t.submission_link,
            t.submitted_at,
            t.total_time_spent,
            t.created_at,
            t.assign_date,
            t.reviewed_by,
            t.reviewed_at,
            (SELECT name FROM users WHERE id = t.reviewed_by) AS reviewed_by_name,
            tfd.final_file_url,
            tfd.final_image_url,
            tfd.fix_notes,
            tfd.is_stock_ready,
            tfd.source_type AS delivery_source_type,
            u.id AS user_id,
            u.name AS staff_name,
            u.profile_picture AS staff_avatar,
            d.name AS department_name,
            tr.rating,
            tr.feedback_notes,
            tr.feedback_notes AS review_feedback,
            tr.tags,
            tr.tags AS review_tags
        FROM tasks t
        JOIN employees e ON t.assigned_to = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN task_final_deliveries tfd ON t.id = tfd.task_id
        LEFT JOIN task_reviews tr ON t.id = tr.task_id
        WHERE e.reporting_manager_id = :reviewer_user_id
          AND t.status = 'Completed'
        ORDER BY t.updated_at DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':reviewer_user_id', $reviewer_user_id, PDO::PARAM_INT);
    $stmt->execute();

    $completed_tasks = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($row['checklists']) && is_string($row['checklists'])) {
            $row['checklists'] = json_decode($row['checklists'], true);
        } else {
            $row['checklists'] = [];
        }

        $raw_tags = $row['tags'] ?? $row['review_tags'] ?? null;
        if (!empty($raw_tags) && is_string($raw_tags)) {
            $row['tags'] = json_decode($raw_tags, true);
            $row['review_tags'] = $row['tags'];
        } else {
            $row['tags'] = is_array($raw_tags) ? $raw_tags : [];
            $row['review_tags'] = $row['tags'];
        }

        // Fetch blueprint variants from task_blueprint_variants
        try {
            $bv_stmt = $db->prepare("SELECT id, variant_name, ai_model_used, is_active, blueprint_json, created_at FROM task_blueprint_variants WHERE task_id = :task_id ORDER BY is_active DESC, id ASC");
            $bv_stmt->execute([':task_id' => $row['task_id']]);
            $b_variants = $bv_stmt->fetchAll(PDO::FETCH_ASSOC);
            $row['blueprint_variants'] = array_map(function($bv) {
                $bv['blueprint_data'] = !empty($bv['blueprint_json']) ? json_decode($bv['blueprint_json'], true) : null;
                $bv['is_active'] = (int)$bv['is_active'] === 1;
                return $bv;
            }, $b_variants);
        } catch (Exception $ex) {
            $row['blueprint_variants'] = [];
        }

        $completed_tasks[] = $row;
    }

    if (!empty($completed_tasks)) {
        $task_ids = array_column($completed_tasks, 'task_id');
        $submissions_by_task = [];
        try {
            $in_ids = implode(',', array_map('intval', $task_ids));
            $sub_stmt = $db->query("SELECT * FROM task_submissions WHERE task_id IN ($in_ids) ORDER BY id ASC");
            if ($sub_stmt) {
                while ($sub = $sub_stmt->fetch(PDO::FETCH_ASSOC)) {
                    $submissions_by_task[$sub['task_id']][] = $sub;
                }
            }
        } catch (Exception $ex) {}

        foreach ($completed_tasks as &$pt) {
            $pt['submissions'] = $submissions_by_task[$pt['task_id']] ?? [];
        }
    }

    echo json_encode([
        "status" => "success",
        "count" => count($completed_tasks),
        "data" => $completed_tasks
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
