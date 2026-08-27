<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "User ID required."]);
    exit;
}

$user_id = $data->user_id;

// --- Security: Office IP Verification ---
// Replace with the actual public IP address of the office Wi-Fi in production.
$allowed_ips = ['127.0.0.1', '::1', '182.48.76.182']; 
$user_ip = $_SERVER['REMOTE_ADDR'];

if (!in_array($user_ip, $allowed_ips)) {
    echo json_encode([
        "status" => "error", 
        "message" => "Check-in failed. You must be connected to the Office Wi-Fi. (Your IP: " . $user_ip . ")",
        "ip" => $user_ip
    ]);
    exit;
}
// ----------------------------------------

$today = date('Y-m-d');
$current_time = date('H:i:s');

// Diagnostic check to verify if the user exists in the users table
$user_check = $db->prepare("SELECT id FROM users WHERE id = :id");
$user_check->execute([':id' => $user_id]);
if ($user_check->rowCount() === 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Diagnostic error: The user ID '" . $user_id . "' does not exist in the users table."
    ]);
    exit;
}

// Get employee shift start time
$emp_query = "SELECT shift_start FROM employees WHERE user_id = :user_id LIMIT 1";
$emp_stmt = $db->prepare($emp_query);
$emp_stmt->bindParam(':user_id', $user_id);
$emp_stmt->execute();

$shift_start = '10:00:00'; // Default
if($emp_stmt->rowCount() > 0) {
    $emp_row = $emp_stmt->fetch(PDO::FETCH_ASSOC);
    if($emp_row['shift_start']) {
        $shift_start = $emp_row['shift_start'];
    }
}

// Calculate late threshold (shift_start + 15 minutes)
$late_threshold = date('H:i:s', strtotime($shift_start) + 15 * 60);

// Check if already checked in today
$check_query = "SELECT id, check_in, check_out FROM attendance WHERE user_id = :user_id AND date = :today LIMIT 1";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(':user_id', $user_id);
$check_stmt->bindParam(':today', $today);
$check_stmt->execute();

if($check_stmt->rowCount() > 0) {
    echo json_encode(["status" => "error", "message" => "You have already checked in today."]);
    exit;
}

// Determine Status
$status = 'Present';

// Insert Check-in
$query = "INSERT INTO attendance (user_id, date, check_in, status) VALUES (:user_id, :date, :check_in, :status)";
$stmt = $db->prepare($query);

$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':date', $today);
$stmt->bindParam(':check_in', $current_time);
$stmt->bindParam(':status', $status);

if($stmt->execute()) {
    echo json_encode([
        "status" => "success", 
        "message" => "Checked in successfully as " . $status,
        "time" => $current_time,
        "attendance_status" => $status
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to check in."]);
}
?>
