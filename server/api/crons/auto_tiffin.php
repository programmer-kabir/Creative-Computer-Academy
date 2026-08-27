<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$date = date('Y-m-d');
$break_type = 'Tiffin';

// Log file path
$log_file = __DIR__ . '/auto_tiffin_log.txt';
$log_time = date('Y-m-d H:i:s');
$log = "[{$log_time}] Cron started.\n";

try {
    // Get all users who checked in today and have tiffin break enabled
    $query = "SELECT a.user_id, e.tiffin_start_time, e.tiffin_end_time, e.tiffin_duration_minutes 
              FROM attendance a
              JOIN employees e ON a.user_id = e.user_id
              WHERE a.date = :date AND e.has_tiffin_break = 1";
    $stmt = $db->prepare($query);
    $stmt->execute([':date' => $date]);
    
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $inserted_count = 0;

    foreach ($users as $u) {
        $user_id = $u['user_id'];
        $start_time = $date . ' ' . $u['tiffin_start_time'];
        $end_time = $date . ' ' . $u['tiffin_end_time'];
        $duration_minutes = $u['tiffin_duration_minutes'];

        // Check if an auto-tiffin break already exists for today
        $check = $db->prepare("SELECT id FROM employee_breaks WHERE user_id = :user_id AND date = :date AND break_type = 'Tiffin'");
        $check->execute([':user_id' => $user_id, ':date' => $date]);
        
        if ($check->rowCount() == 0) {
            $insert = $db->prepare("INSERT INTO employee_breaks (user_id, date, break_type, start_time, end_time, duration_minutes, status) VALUES (:user_id, :date, :break_type, :start_time, :end_time, :duration, 'Completed')");
            $insert->execute([
                ':user_id' => $user_id,
                ':date' => $date,
                ':break_type' => $break_type,
                ':start_time' => $start_time,
                ':end_time' => $end_time,
                ':duration' => $duration_minutes
            ]);
            $inserted_count++;
        }
    }
    
    $log .= "[{$log_time}] Success: Auto tiffin processed for {$inserted_count} users.\n";
    file_put_contents($log_file, $log, FILE_APPEND);
    echo json_encode(["status" => "success", "message" => "Auto tiffin processed for $inserted_count users."]);
} catch (PDOException $e) {
    $log .= "[{$log_time}] ERROR: " . $e->getMessage() . "\n";
    file_put_contents($log_file, $log, FILE_APPEND);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
