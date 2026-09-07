<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "
        SELECT 
            u.id, u.name, u.email, u.phone, u.status AS user_status, u.profile_picture, u.cover_picture,
            ur.role,
            s.id AS student_record_id, s.user_id, s.course_id, s.batch_id, s.student_code, 
            COALESCE(c.title, 'General Course') AS course_name, 
            c.course_code,
            COALESCE(b.batch_code, 'Batch-01') AS batch_no,
            b.batch_name, b.schedule_days, b.schedule_time, b.lab_room,
            s.guardian_phone,
            s.enrollment_date, s.completion_date, s.status AS student_status,
            e.employee_code, e.designation,
            (SELECT COUNT(*) FROM attendance a WHERE a.user_id = u.id AND a.status = 'Present') AS total_present_days,
            (SELECT COUNT(*) FROM attendance a WHERE a.user_id = u.id) AS total_attendance_logs,
            (SELECT a.check_in FROM attendance a WHERE a.user_id = u.id AND a.date = CURDATE() LIMIT 1) AS today_check_in,
            (SELECT a.status FROM attendance a WHERE a.user_id = u.id AND a.date = CURDATE() LIMIT 1) AS today_attendance_status
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN courses c ON s.course_id = c.id
        LEFT JOIN batches b ON s.batch_id = b.id
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE ur.role = 'student' OR s.id IS NOT NULL
        ORDER BY s.id DESC, u.name ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $students = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $students[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data" => $students
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
