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
    // Query tasks with status 'Rejected' assigned to employees under this reviewer
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
            t.updated_at AS rejected_at,
            t.reviewed_by,
            t.reviewed_at,
            t.rejection_reason,
            t.rejection_image,
            (SELECT name FROM users WHERE id = t.reviewed_by) AS reviewed_by_name,
            u.id AS user_id,
            u.name AS staff_name,
            u.profile_picture AS staff_avatar,
            d.name AS department_name
        FROM tasks t
        JOIN employees e ON t.assigned_to = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.reporting_manager_id = :reviewer_user_id
          AND t.status = 'Rejected'
        ORDER BY t.updated_at DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':reviewer_user_id', $reviewer_user_id, PDO::PARAM_INT);
    $stmt->execute();

    $rejected_tasks = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($row['checklists']) && is_string($row['checklists'])) {
            $row['checklists'] = json_decode($row['checklists'], true);
        } else {
            $row['checklists'] = [];
        }
        $rejected_tasks[] = $row;
    }

    if (!empty($rejected_tasks)) {
        $task_ids = array_column($rejected_tasks, 'task_id');
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

        foreach ($rejected_tasks as &$pt) {
            $pt['submissions'] = $submissions_by_task[$pt['task_id']] ?? [];
        }
    }

    echo json_encode([
        "status" => "success",
        "count"  => count($rejected_tasks),
        "data"   => $rejected_tasks
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
