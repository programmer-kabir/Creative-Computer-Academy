<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT b.id as break_id, b.user_id, b.break_type, b.start_time, u.name, u.profile_picture, e.allocated_break_minutes 
              FROM employee_breaks b 
              JOIN users u ON b.user_id = u.id 
              JOIN employees e ON u.id = e.user_id 
              WHERE b.status = 'Active' AND b.date = :today";
    $stmt = $db->prepare($query);
    $stmt->execute([':today' => date('Y-m-d')]);
    
    $active_breaks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success", 
        "data" => $active_breaks,
        "server_time" => date('Y-m-d H:i:s')
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
