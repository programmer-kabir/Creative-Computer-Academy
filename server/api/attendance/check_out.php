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

if(!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "User ID required."]);
    exit;
}

$user_id = $data->user_id;

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

$today = date('Y-m-d');
$current_time = date('H:i:s');

// --- Security: Office IP Verification ---
$allowed_ips = ['127.0.0.1', '::1', '182.48.76.182']; 
$user_ip = $_SERVER['REMOTE_ADDR'];

if (!in_array($user_ip, $allowed_ips)) {
    echo json_encode([
        "status" => "error", 
        "message" => "Check-out failed. You must be connected to the Office Wi-Fi. (Your IP: " . $user_ip . ")",
        "ip" => $user_ip
    ]);
    exit;
}
// ----------------------------------------
$query = "UPDATE attendance SET check_out = :check_out WHERE user_id = :user_id AND date = :date AND check_out IS NULL";
$stmt = $db->prepare($query);

$stmt->bindParam(':check_out', $current_time);
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':date', $today);

if($stmt->execute() && $stmt->rowCount() > 0) {
    echo json_encode([
        "status" => "success", 
        "message" => "Checked out successfully",
        "time" => $current_time
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Could not check out. You may not have checked in today, or you already checked out."]);
}
?>
