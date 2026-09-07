<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID required."]);
    exit;
}

try {
    // 1. Get student profile details by joining courses and batches
    $stu_stmt = $db->prepare("
        SELECT 
            u.id, u.name, u.email, u.phone, u.profile_picture,
            s.id AS student_record_id, s.student_code, s.course_id, s.batch_id, 
            s.enrollment_date, s.status AS student_status,
            COALESCE(c.title, 'General Course') AS course_name,
            c.course_code,
            COALESCE(b.batch_code, 'Batch-01') AS batch_no,
            b.batch_name, b.schedule_days, b.schedule_time, b.lab_room
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN courses c ON s.course_id = c.id
        LEFT JOIN batches b ON s.batch_id = b.id
        WHERE u.id = :user_id
        LIMIT 1
    ");
    $stu_stmt->execute([':user_id' => $user_id]);
    $student = $stu_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(["status" => "error", "message" => "Student not found."]);
        exit;
    }

    // 2. Attendance stats from shared attendance table
    $today = date('Y-m-d');
    $att_today_stmt = $db->prepare("SELECT check_in, check_out, status FROM attendance WHERE user_id = :user_id AND date = :today LIMIT 1");
    $att_today_stmt->execute([':user_id' => $user_id, ':today' => $today]);
    $today_att = $att_today_stmt->fetch(PDO::FETCH_ASSOC);

    // Total stats
    $tot_stmt = $db->prepare("
        SELECT 
            COUNT(*) AS total_days,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_days,
            SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_days,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_days
        FROM attendance
        WHERE user_id = :user_id
    ");
    $tot_stmt->execute([':user_id' => $user_id]);
    $stats = $tot_stmt->fetch(PDO::FETCH_ASSOC);

    // Recent 15 attendance records
    $rec_stmt = $db->prepare("SELECT id, date, check_in, check_out, status FROM attendance WHERE user_id = :user_id ORDER BY date DESC LIMIT 15");
    $rec_stmt->execute([':user_id' => $user_id]);
    $recent_logs = $rec_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fetch Batch & Schedule Details
    $batch_info = null;
    $batch_id = !empty($student['batch_id']) ? intval($student['batch_id']) : 0;

    if ($batch_id > 0) {
        $b_stmt = $db->prepare("
            SELECT 
                b.*,
                c.title AS course_title,
                c.course_code AS course_code_ref,
                u_lead.name AS instructor_name,
                u_ast.name AS assistant_name
            FROM batches b
            LEFT JOIN courses c ON b.course_id = c.id
            LEFT JOIN employees e_lead ON b.lead_instructor_id = e_lead.id
            LEFT JOIN users u_lead ON e_lead.user_id = u_lead.id
            LEFT JOIN employees e_ast ON b.assistant_instructor_id = e_ast.id
            LEFT JOIN users u_ast ON e_ast.user_id = u_ast.id
            WHERE b.id = :bid
            LIMIT 1
        ");
        $b_stmt->execute([':bid' => $batch_id]);
        $batch_info = $b_stmt->fetch(PDO::FETCH_ASSOC);
    }

    // 4. Fetch Course Modules
    $modules = [];
    $course_id = !empty($student['course_id']) ? intval($student['course_id']) : ($batch_info['course_id'] ?? 0);

    if ($course_id > 0) {
        $m_stmt = $db->prepare("
            SELECT m.*
            FROM course_modules m
            WHERE m.course_id = :cid
            ORDER BY m.module_no ASC
        ");
        $m_stmt->execute([':cid' => $course_id]);
        $modules = $m_stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "student" => $student,
            "today_attendance" => $today_att ? $today_att : null,
            "batch_info" => $batch_info,
            "modules" => $modules,
            "stats" => [
                "total_days" => intval($stats['total_days'] ?? 0),
                "present_days" => intval($stats['present_days'] ?? 0),
                "late_days" => intval($stats['late_days'] ?? 0),
                "absent_days" => intval($stats['absent_days'] ?? 0),
                "attendance_rate" => ($stats['total_days'] > 0) ? round(($stats['present_days'] / $stats['total_days']) * 100, 1) : 100
            ],
            "recent_logs" => $recent_logs
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
