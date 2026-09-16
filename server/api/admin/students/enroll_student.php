<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->user_id) || !isset($data->course_id)) {
    echo json_encode(["status" => "error", "message" => "User ID and Course ID are required."]);
    exit;
}

$user_id = intval($data->user_id);
$course_id = intval($data->course_id);
$enrollment_date = !empty($data->enrollment_date) ? $data->enrollment_date : date('Y-m-d');

try {
    // 1. Verify user exists
    $u_chk = $db->prepare("SELECT id, name, email FROM users WHERE id = :uid LIMIT 1");
    $u_chk->execute([':uid' => $user_id]);
    $user = $u_chk->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        echo json_encode(["status" => "error", "message" => "Student user account not found."]);
        exit;
    }

    // 2. Fetch course details
    $c_stmt = $db->prepare("SELECT id, title, course_code FROM courses WHERE id = :cid LIMIT 1");
    $c_stmt->execute([':cid' => $course_id]);
    $course = $c_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        echo json_encode(["status" => "error", "message" => "Selected course does not exist."]);
        exit;
    }

    $course_title = $course['title'];
    $course_code = $course['course_code'];

    // 3. Check if already enrolled in this exact course
    $enr_chk = $db->prepare("SELECT id FROM students WHERE user_id = :uid AND course_id = :cid LIMIT 1");
    $enr_chk->execute([':uid' => $user_id, ':cid' => $course_id]);
    if ($enr_chk->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Student is already enrolled in {$course_title} ({$course_code})."]);
        exit;
    }

    // 4. Generate Student Enrollment Code
    $student_code = 'STU-' . $user_id . '-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $course_code), 0, 6));

    // 5. Insert clean course enrollment record
    $now_bd = date('Y-m-d H:i:s');
    $ins = $db->prepare("
        INSERT INTO students (
            user_id, student_code, course_id, batch_id,
            enrollment_date, status, created_at, updated_at
        ) VALUES (
            :user_id, :code, :course_id, NULL,
            :edate, 'active', :cr_time, :up_time
        )
    ");
    $ins->execute([
        ':user_id' => $user_id,
        ':code' => $student_code,
        ':course_id' => $course_id,
        ':edate' => $enrollment_date,
        ':cr_time' => $now_bd,
        ':up_time' => $now_bd
    ]);

    $enrollment_id = $db->lastInsertId();

    // Ensure student role is present in user_roles
    $r_chk = $db->prepare("SELECT id FROM user_roles WHERE user_id = :uid AND role = 'student' LIMIT 1");
    $r_chk->execute([':uid' => $user_id]);
    if ($r_chk->rowCount() === 0) {
        $r_ins = $db->prepare("INSERT INTO user_roles (user_id, role) VALUES (:uid, 'student')");
        $r_ins->execute([':uid' => $user_id]);
    }

    echo json_encode([
        "status" => "success",
        "message" => "Successfully enrolled student in {$course_title}!",
        "enrollment_id" => $enrollment_id,
        "student_code" => $student_code
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
