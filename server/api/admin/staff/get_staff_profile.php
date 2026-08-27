<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_GET['employee_code'])) {
    echo json_encode(["status" => "error", "message" => "employee_code is required."]);
    exit;
}

$employee_code = $_GET['employee_code'];

try {
    // Get Employee and Staff Info using employee_code
    $query_staff = "
        SELECT 
            u.id as user_id, u.name, u.email, u.phone, u.status, u.profile_picture, u.cover_picture,
            e.id as employee_id, e.employee_code, e.designation, e.employment_status, e.employment_type,
            e.joining_date, e.shift_start, e.shift_end, e.allocated_break_minutes,
            e.has_tiffin_break, e.tiffin_start_time, e.tiffin_end_time, e.tiffin_duration_minutes,
            d.name AS department_name
        FROM employees e
        INNER JOIN users u ON e.user_id = u.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.employee_code = :employee_code LIMIT 1
    ";
    $stmt_staff = $db->prepare($query_staff);
    $stmt_staff->execute([':employee_code' => $employee_code]);
    $staff_info = $stmt_staff->fetch(PDO::FETCH_ASSOC);

    if (!$staff_info) {
        echo json_encode(["status" => "error", "message" => "Staff member not found."]);
        exit;
    }
    
    $employee_id = $staff_info['employee_id'];

    $stats = [
        "total" => 0,
        "completed" => 0,
        "in_progress" => 0,
        "to_do" => 0,
        "in_review" => 0,
        "rejected" => 0
    ];
    $recent_tasks = [];

    if ($employee_id) {
        // Fetch Task Statistics
        $query_stats = "SELECT status, COUNT(*) as count FROM tasks WHERE assigned_to = :employee_id GROUP BY status";
        $stmt_stats = $db->prepare($query_stats);
        $stmt_stats->execute([':employee_id' => $employee_id]);
        
        while ($row = $stmt_stats->fetch(PDO::FETCH_ASSOC)) {
            $stats["total"] += $row['count'];
            switch (strtolower(str_replace(' ', '_', $row['status']))) {
                case 'completed': $stats["completed"] = $row['count']; break;
                case 'in_progress': $stats["in_progress"] = $row['count']; break;
                case 'to-do': $stats["to_do"] = $row['count']; break;
                case 'in_review': $stats["in_review"] = $row['count']; break;
                case 'rejected': $stats["rejected"] = $row['count']; break;
            }
        }

        // Fetch Recent Tasks (Last 5)
        $query_recent = "SELECT id, title, status, priority, category, deadline FROM tasks WHERE assigned_to = :employee_id ORDER BY created_at DESC LIMIT 5";
        $stmt_recent = $db->prepare($query_recent);
        $stmt_recent->execute([':employee_id' => $employee_id]);
        $recent_tasks = $stmt_recent->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "info" => $staff_info,
            "stats" => $stats,
            "recent_tasks" => $recent_tasks
        ]
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
