<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->user_id) || empty($data->course_id)) {
    echo json_encode(["status" => "error", "message" => "User ID and Course ID are required."]);
    exit;
}

try {
    $user_id = intval($data->user_id);
    $course_id = intval($data->course_id);

    // 1. Verify User exists
    $u_stmt = $db->prepare("SELECT id, name, email FROM users WHERE id = :uid LIMIT 1");
    $u_stmt->execute([':uid' => $user_id]);
    $user = $u_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "User account not found."]);
        exit;
    }

    // 2. Verify Course exists
    $c_stmt = $db->prepare("SELECT id, title, course_code, category FROM courses WHERE id = :cid LIMIT 1");
    $c_stmt->execute([':cid' => $course_id]);
    $course = $c_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        echo json_encode(["status" => "error", "message" => "Course not found or inactive."]);
        exit;
    }

    // 3. Check existing enrollment in this course
    $chk_stmt = $db->prepare("SELECT id, status FROM students WHERE user_id = :uid AND course_id = :cid LIMIT 1");
    $chk_stmt->execute([':uid' => $user_id, ':cid' => $course_id]);
    $existing = $chk_stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['status'] === 'active') {
            echo json_encode([
                "status" => "info",
                "message" => "You are already actively enrolled in " . $course['title'] . "!"
            ]);
            exit;
        } else {
            // Reactivate enrollment
            $up = $db->prepare("UPDATE students SET status = 'active', enrollment_date = :edate, updated_at = :up_time WHERE id = :id");
            $up->execute([
                ':edate' => date('Y-m-d'),
                ':up_time' => date('Y-m-d H:i:s'),
                ':id' => $existing['id']
            ]);

            echo json_encode([
                "status" => "success",
                "message" => "Successfully re-activated enrollment in " . $course['title'] . "!",
                "course" => $course
            ]);
            exit;
        }
    }

    // 4. Generate student code or inherit existing student code
    $code_stmt = $db->prepare("SELECT student_code FROM students WHERE user_id = :uid AND student_code IS NOT NULL LIMIT 1");
    $code_stmt->execute([':uid' => $user_id]);
    $existing_code = $code_stmt->fetchColumn();

    $student_code = $existing_code ?: 'STU-' . strtoupper(substr(uniqid(), -6));
    $now_bd = date('Y-m-d H:i:s');
    $today = date('Y-m-d');

    // 5. Insert new student course enrollment
    $ins = $db->prepare("
        INSERT INTO students (user_id, course_id, student_code, enrollment_date, status, created_at, updated_at)
        VALUES (:uid, :cid, :code, :edate, 'active', :ctime, :utime)
    ");
    $ins->execute([
        ':uid' => $user_id,
        ':cid' => $course_id,
        ':code' => $student_code,
        ':edate' => $today,
        ':ctime' => $now_bd,
        ':utime' => $now_bd
    ]);

    $new_enrollment_id = $db->lastInsertId();

    echo json_encode([
        "status" => "success",
        "message" => "🎉 Enrolled in " . $course['title'] . " successfully! You can start learning right away.",
        "enrollment_id" => $new_enrollment_id,
        "course" => $course
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
