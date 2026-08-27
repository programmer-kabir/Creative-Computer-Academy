<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->reviewer_user_id) || !isset($data->start_date) || !isset($data->end_date)) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters."]);
    exit;
}

$reviewer_user_id = intval($data->reviewer_user_id);
$start_date = $data->start_date . " 00:00:00";
$end_date = $data->end_date . " 23:59:59";

try {
    $summary = [
        'total_received' => 0,
        'total_reviewed' => 0,
        'currently_pending' => 0,
        'total_approved' => 0,
        'total_rejected' => 0,
        'sla_met' => 0,
        'sla_breached' => 0,
        'avg_review_hours' => 0
    ];

    // 1. Total Received & Current Statuses (from tasks table)
    $query_summary = "
        SELECT 
            SUM(IF(t.status = 'In Review', 1, 0)) as pending_count,
            SUM(IF(t.status = 'Completed', 1, 0)) as approved_count,
            SUM(IF(t.status = 'Rejected', 1, 0)) as rejected_count,
            COUNT(t.id) as total_tasks
        FROM tasks t
        JOIN employees e ON t.assigned_to = e.id
        WHERE e.reporting_manager_id = :reviewer_id
    ";
    $stmt_sum = $db->prepare($query_summary);
    $stmt_sum->execute([':reviewer_id' => $reviewer_user_id]);
    $task_stats = $stmt_sum->fetch(PDO::FETCH_ASSOC);

    $summary['currently_pending'] = (int)$task_stats['pending_count'];
    $summary['total_approved'] = (int)$task_stats['approved_count'];
    $summary['total_rejected'] = (int)$task_stats['rejected_count'];
    $summary['total_reviewed'] = $summary['total_approved'] + $summary['total_rejected'];
    $summary['total_received'] = $summary['total_reviewed'] + $summary['currently_pending'];

    // 2. Review Actions & SLA & Peak Hours & Iteration Loops
    $peak_hours = array_fill(0, 24, 0);
    $friction_map = []; // user_id => rejections
    $iteration_loops = []; // task_id => count
    
    $query_logs = "
        SELECT 
            tl.id, tl.task_id, tl.status_to, tl.created_at, tl.changed_by,
            t.assigned_to, u.name as staff_name, t.title, t.priority,
            COALESCE(
                (SELECT created_at FROM task_logs tl2 
                 WHERE tl2.task_id = tl.task_id AND tl2.status_to = 'In Review' AND tl2.id < tl.id 
                 ORDER BY tl2.id DESC LIMIT 1),
                t.created_at
            ) as submitted_at
        FROM task_logs tl
        JOIN tasks t ON tl.task_id = t.id
        JOIN employees e ON t.assigned_to = e.id
        JOIN users u ON e.user_id = u.id
        WHERE tl.changed_by = :reviewer_id
          AND e.reporting_manager_id = :reviewer_id
          AND tl.status_to IN ('Completed', 'Rejected')
          AND tl.created_at BETWEEN :start_date AND :end_date
        ORDER BY tl.created_at DESC
    ";
    
    $stmt_logs = $db->prepare($query_logs);
    $stmt_logs->execute([':reviewer_id' => $reviewer_user_id, ':start_date' => $start_date, ':end_date' => $end_date]);
    
    $review_history = [];
    $total_review_time_seconds = 0;
    $total_reviews_for_avg = 0;
    $speed_trend_temp = [];

    function getWorkingSeconds($start_str, $end_str) {
        $start = strtotime($start_str);
        $end = strtotime($end_str);
        if ($start >= $end) return 0;
        
        $total_seconds = 0;
        $current = $start;
        
        while ($current < $end) {
            $end_of_day = strtotime('tomorrow', $current) - 1;
            $step_end = min($end_of_day, $end);
            
            // 5 is Friday in date('w')
            if (date('w', $current) != 5) {
                $total_seconds += ($step_end - $current) + 1;
            }
            $current = $step_end + 1;
        }
        return $total_seconds;
    }

    while($row = $stmt_logs->fetch(PDO::FETCH_ASSOC)) {
        if($row['status_to'] === 'Rejected') {
            // Friction map
            $staff = $row['staff_name'];
            if(!isset($friction_map[$staff])) $friction_map[$staff] = 0;
            $friction_map[$staff]++;
            
            // Iteration loops
            $tid = $row['task_id'];
            if(!isset($iteration_loops[$tid])) $iteration_loops[$tid] = 0;
            $iteration_loops[$tid]++;
        }
        
        // Peak hours
        $hour = (int)date('H', strtotime($row['created_at']));
        $peak_hours[$hour]++;
        
        // SLA & Time calculation
        $review_time = '-';
        if($row['submitted_at']) {
            $diff = getWorkingSeconds($row['submitted_at'], $row['created_at']);
            if($diff > 0) {
                $total_review_time_seconds += $diff;
                $total_reviews_for_avg++;
                
                $h = floor($diff / 3600);
                $m = floor(($diff % 3600) / 60);
                $review_time = "{$h}h {$m}m";
                
                if($diff > 86400) { // 24 hours
                    $summary['sla_breached']++;
                } else {
                    $summary['sla_met']++;
                }
                
                $date_key = date('M d', strtotime($row['created_at']));
                if (!isset($speed_trend_temp[$date_key])) $speed_trend_temp[$date_key] = ['total' => 0, 'count' => 0];
                $speed_trend_temp[$date_key]['total'] += $diff;
                $speed_trend_temp[$date_key]['count']++;
            }
        }
        
        $review_history[] = [
            'task_id' => $row['task_id'],
            'title' => $row['title'],
            'staff_name' => $row['staff_name'],
            'priority' => $row['priority'],
            'status' => $row['status_to'],
            'submitted_at' => $row['submitted_at'],
            'reviewed_at' => $row['created_at'],
            'review_time' => $review_time
        ];
    }
    
    // Calculate Averages
    if($total_reviews_for_avg > 0) {
        $avg_sec = $total_review_time_seconds / $total_reviews_for_avg;
        $h = floor($avg_sec / 3600);
        $m = floor(($avg_sec % 3600) / 60);
        $summary['avg_review_hours'] = "{$h}h {$m}m";
    }
    
    // Format peak hours for chart
    $chart_data = [];
    for($i=0; $i<24; $i++) {
        $chart_data[] = [
            'hour' => sprintf("%02d:00", $i),
            'count' => $peak_hours[$i]
        ];
    }
    
    // Sort friction to get top 3
    arsort($friction_map);
    $top_friction = array_slice($friction_map, 0, 3, true);
    
    // Average iterations
    $avg_iterations = 0;
    if(count($iteration_loops) > 0) {
        $avg_iterations = round(array_sum($iteration_loops) / count($iteration_loops), 1);
    }
    
    $speed_trend = [];
    foreach($speed_trend_temp as $date => $data) {
        $speed_trend[] = [
            'date' => $date,
            'avg_hours' => round($data['total'] / $data['count'] / 3600, 1)
        ];
    }
    $speed_trend = array_reverse($speed_trend);

    // 3. Workload Trend (Received vs Reviewed per day)
    $query_workload = "
        SELECT 
            DATE(tl.created_at) as log_date,
            SUM(IF(tl.status_to = 'In Review', 1, 0)) as received_count,
            SUM(IF(tl.status_to IN ('Completed', 'Rejected') AND tl.changed_by = :reviewer_id, 1, 0)) as reviewed_count
        FROM task_logs tl
        JOIN tasks t ON tl.task_id = t.id
        JOIN employees e ON t.assigned_to = e.id
        WHERE e.reporting_manager_id = :reviewer_id
          AND tl.created_at BETWEEN :start_date AND :end_date
          AND tl.status_to IN ('In Review', 'Completed', 'Rejected')
        GROUP BY DATE(tl.created_at)
        ORDER BY log_date ASC
    ";
    $stmt_wl = $db->prepare($query_workload);
    $stmt_wl->execute([':reviewer_id' => $reviewer_user_id, ':start_date' => $start_date, ':end_date' => $end_date]);
    
    $workload_trend = [];
    while($wl = $stmt_wl->fetch(PDO::FETCH_ASSOC)) {
        $workload_trend[] = [
            'date' => date('M d', strtotime($wl['log_date'])),
            'received' => (int)$wl['received_count'],
            'reviewed' => (int)$wl['reviewed_count']
        ];
    }

    echo json_encode([
        "status" => "success",
        "summary" => $summary,
        "insights" => [
            "top_friction" => $top_friction,
            "avg_iterations" => $avg_iterations,
            "peak_hours" => $chart_data,
            "speed_trend" => $speed_trend,
            "workload_trend" => $workload_trend
        ],
        "history" => $review_history
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
