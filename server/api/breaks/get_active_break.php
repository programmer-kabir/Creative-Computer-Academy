<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

$user_id = $data->user_id;

try {
    // Get active break
    $query = "SELECT id, break_type, start_time FROM employee_breaks WHERE user_id = :user_id AND status = 'Active' ORDER BY id DESC LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute([':user_id' => $user_id]);
    
    $active_break = null;
    if ($stmt->rowCount() > 0) {
        $active_break = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Get allocated_break_minutes for this user
    $limit_query = "SELECT allocated_break_minutes FROM employees WHERE user_id = :user_id LIMIT 1";
    $limit_stmt = $db->prepare($limit_query);
    $limit_stmt->execute([':user_id' => $user_id]);
    $allocated_minutes = 60; // Default
    
    if ($limit_stmt->rowCount() > 0) {
        $emp = $limit_stmt->fetch(PDO::FETCH_ASSOC);
        if (isset($emp['allocated_break_minutes'])) {
            $allocated_minutes = (int)$emp['allocated_break_minutes'];
        }
    }

    // Get total break minutes today
    $today = date('Y-m-d');
    $total_query = "SELECT SUM(duration_minutes) as total_mins FROM employee_breaks WHERE user_id = :user_id AND date = :today AND status = 'Completed'";
    $total_stmt = $db->prepare($total_query);
    $total_stmt->execute([':user_id' => $user_id, ':today' => $today]);
    $total_break_minutes_today = 0;
    if ($total_stmt->rowCount() > 0) {
        $total_row = $total_stmt->fetch(PDO::FETCH_ASSOC);
        $total_break_minutes_today = (int)$total_row['total_mins'];
    }

    echo json_encode([
        "status" => "success", 
        "data" => [
            "active_break" => $active_break,
            "allocated_break_minutes" => $allocated_minutes,
            "total_break_minutes_today" => $total_break_minutes_today,
            "server_time" => date('Y-m-d H:i:s')
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
