<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->user_id) || (empty($data->new_course_id) && empty($data->new_course_name))) {
    echo json_encode(["status" => "error", "message" => "User ID and New Course are required."]);
    exit;
}

try {
    $user_id = intval($data->user_id);
    $new_course_id = !empty($data->new_course_id) ? intval($data->new_course_id) : null;
    $new_course_name = !empty($data->new_course_name) ? trim($data->new_course_name) : null;

    if ($new_course_id) {
        $c_stmt = $db->prepare("SELECT id, title FROM courses WHERE id = :cid LIMIT 1");
        $c_stmt->execute([':cid' => $new_course_id]);
        $c_row = $c_stmt->fetch(PDO::FETCH_ASSOC);
        if ($c_row) {
            $new_course_name = $c_row['title'];
        }
    } else if ($new_course_name) {
        $c_stmt = $db->prepare("SELECT id, title FROM courses WHERE title = :title OR course_code = :code LIMIT 1");
        $c_stmt->execute([':title' => $new_course_name, ':code' => $new_course_name]);
        $c_row = $c_stmt->fetch(PDO::FETCH_ASSOC);
        if ($c_row) {
            $new_course_id = intval($c_row['id']);
            $new_course_name = $c_row['title'];
        }
    }

    if (!$new_course_id) {
        echo json_encode(["status" => "error", "message" => "Course not found."]);
        exit;
    }

    $stmt = $db->prepare("
        UPDATE students 
        SET course_id = :cid 
        WHERE user_id = :uid
    ");
    $stmt->execute([
        ':cid' => $new_course_id,
        ':uid' => $user_id
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Student successfully transferred to " . $new_course_name . "! All past attendance and assignment logs are preserved."
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
