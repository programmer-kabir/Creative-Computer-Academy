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
    // Query tasks with status 'In Review' assigned to employees under this reviewer
    $query = "
        SELECT 
            t.id AS task_id,
            t.title,
            t.description,
            COALESCE(tc_child.name, tc_sub.name, tc_main.name, '') AS category,
            t.is_self_created,
            t.priority,
            t.deadline,
            t.checklists,
            t.ref_image,
            t.visual_image,
            t.ref_links,
            t.submission_link,
            t.submitted_at,
            t.total_time_spent,
            t.timer_status,
            t.session_start_time,
            t.created_at,
            t.assign_date,
            u.id AS user_id,
            u.name AS staff_name,
            u.profile_picture AS staff_avatar,
            d.name AS department_name
        FROM tasks t
        JOIN employees e ON t.assigned_to = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN task_categories tc_main ON t.category_id = tc_main.id
        LEFT JOIN task_categories tc_sub ON t.subcategory_id = tc_sub.id
        LEFT JOIN task_categories tc_child ON t.child_category_id = tc_child.id
        WHERE e.reporting_manager_id = :reviewer_user_id
          AND t.status = 'In Review'
        ORDER BY t.updated_at DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':reviewer_user_id', $reviewer_user_id, PDO::PARAM_INT);
    $stmt->execute();

    $pending_tasks = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($row['checklists']) && is_string($row['checklists'])) {
            $row['checklists'] = json_decode($row['checklists'], true);
        } else {
            $row['checklists'] = [];
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

        $pending_tasks[] = $row;
    }

    if (!empty($pending_tasks)) {
        $task_ids = array_column($pending_tasks, 'task_id');
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

        foreach ($pending_tasks as &$pt) {
            $pt['submissions'] = $submissions_by_task[$pt['task_id']] ?? [];

            if (intval($pt['total_time_spent']) <= 0) {
                $calc_log_stmt = $db->prepare("SELECT status_to, created_at FROM task_logs WHERE task_id = :task_id ORDER BY id ASC");
                $calc_log_stmt->execute([':task_id' => $pt['task_id']]);
                $t_logs = $calc_log_stmt->fetchAll(PDO::FETCH_ASSOC);

                $in_prog_time = null;
                $computed_time = 0;
                foreach ($t_logs as $tl) {
                    if ($tl['status_to'] === 'In Progress') {
                        $in_prog_time = strtotime($tl['created_at']);
                    } elseif ($in_prog_time && in_array($tl['status_to'], ['In Review', 'Completed', 'Rejected'])) {
                        $computed_time += max(0, strtotime($tl['created_at']) - $in_prog_time);
                        $in_prog_time = null;
                    }
                }

                if ($computed_time <= 0 && !empty($pt['submitted_at'])) {
                    $start_ref = strtotime(!empty($pt['assign_date']) ? $pt['assign_date'] . ' 09:00:00' : $pt['created_at']);
                    $end_ref = strtotime($pt['submitted_at']);
                    if ($end_ref > $start_ref) {
                        $diff = $end_ref - $start_ref;
                        if ($diff > 0 && $diff < 86400 * 30) {
                            $computed_time = $diff;
                        }
                    }
                }

                if ($computed_time > 0) {
                    $pt['total_time_spent'] = $computed_time;
                    try {
                        $db->prepare("UPDATE tasks SET total_time_spent = :time WHERE id = :task_id AND total_time_spent = 0")->execute([
                            ':time' => $computed_time,
                            ':task_id' => $pt['task_id']
                        ]);
                    } catch (Exception $e) {}
                }
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "count" => count($pending_tasks),
        "data" => $pending_tasks
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
