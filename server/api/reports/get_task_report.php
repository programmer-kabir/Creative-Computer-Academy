<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->user_id) || !isset($data->start_date) || !isset($data->end_date)) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters."]);
    exit;
}

$user_id = $data->user_id;
$start_date = $data->start_date . " 00:00:00";
$end_date = $data->end_date . " 23:59:59";

// Get employee_id
$emp_query = "SELECT id FROM employees WHERE user_id = :user_id LIMIT 1";
$emp_stmt = $db->prepare($emp_query);
$emp_stmt->bindParam(':user_id', $user_id);
$emp_stmt->execute();
if($emp_stmt->rowCount() == 0) {
    echo json_encode(["status" => "error", "message" => "Employee not found."]);
    exit;
}
$employee_id = $emp_stmt->fetch(PDO::FETCH_ASSOC)['id'];

// Get tasks created in this period
$task_query = "SELECT * FROM tasks WHERE assigned_to = :emp_id AND created_at BETWEEN :start_date AND :end_date ORDER BY created_at DESC";
$task_stmt = $db->prepare($task_query);
$task_stmt->bindParam(':emp_id', $employee_id);
$task_stmt->bindParam(':start_date', $start_date);
$task_stmt->bindParam(':end_date', $end_date);
$task_stmt->execute();

$tasks = [];
$task_ids = [];
$summary = [
    'total_assigned' => 0,
    'total_completed' => 0,
    'delayed_completions' => 0,
    'total_rejected' => 0,
    'total_resubmitted' => 0
];

while($row = $task_stmt->fetch(PDO::FETCH_ASSOC)) {
    $tasks[] = $row;
    $task_ids[] = $row['id'];
    $summary['total_assigned']++;
    if($row['status'] === 'Completed') {
        $summary['total_completed']++;
    }
}

if(count($task_ids) > 0) {
    $in_clause = implode(',', $task_ids);
    $log_query = "SELECT * FROM task_logs WHERE task_id IN ($in_clause) ORDER BY created_at ASC";
    $log_stmt = $db->prepare($log_query);
    $log_stmt->execute();
    
    $logs = $log_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process logs for metrics
    $task_starts = []; 
    $task_resubmits = [];
    
    foreach($logs as $log) {
        // Rejections
        if($log['status_to'] === 'Rejected') {
            $summary['total_rejected']++;
        }
        // Resubmissions
        if($log['status_from'] === 'Rejected' && $log['status_to'] === 'In Progress') {
            $summary['total_resubmitted']++;
            $tid = $log['task_id'];
            if(!isset($task_resubmits[$tid])) $task_resubmits[$tid] = 0;
            $task_resubmits[$tid]++;
        }
        // First Start
        if($log['status_to'] === 'In Progress' && !isset($task_starts[$log['task_id']])) {
            $task_starts[$log['task_id']] = strtotime($log['created_at']);
        }
    }
    
    // Check for delayed completions and resubmissions
    foreach($tasks as &$task) {
        $task_id = $task['id'];
        $task['was_delayed'] = false;
        $task['was_resubmitted'] = false;
        $task['resubmit_count'] = 0;
        
        if(isset($task_resubmits[$task_id])) {
            $task['was_resubmitted'] = true;
            $task['resubmit_count'] = $task_resubmits[$task_id];
        }
        
        if($task['status'] === 'Completed') {
            $created_time = strtotime($task['created_at']);
            if(isset($task_starts[$task_id])) {
                $start_time = $task_starts[$task_id];
                if(($start_time - $created_time) > 86400) {
                    $summary['delayed_completions']++;
                    $task['was_delayed'] = true;
                }
            }
        }
    }
}

echo json_encode([
    "status" => "success",
    "summary" => $summary,
    "tasks" => $tasks
]);
?>
