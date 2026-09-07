<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->user_id) || empty($data->new_batch_code)) {
    echo json_encode(["status" => "error", "message" => "User ID and New Batch Code are required."]);
    exit;
}

try {
    $user_id = intval($data->user_id);
    $new_batch_id = !empty($data->new_batch_id) ? intval($data->new_batch_id) : null;
    $new_batch_code = !empty($data->new_batch_code) ? trim($data->new_batch_code) : null;
    $new_course_id = !empty($data->new_course_id) ? intval($data->new_course_id) : null;
    $new_course_name = !empty($data->new_course_name) ? trim($data->new_course_name) : null;

    // Resolve batch info from batches table
    if ($new_batch_id) {
        $b_stmt = $db->prepare("SELECT b.*, c.title AS course_title, c.id AS course_id_ref FROM batches b LEFT JOIN courses c ON b.course_id = c.id WHERE b.id = :bid LIMIT 1");
        $b_stmt->execute([':bid' => $new_batch_id]);
        $b_row = $b_stmt->fetch(PDO::FETCH_ASSOC);
        if ($b_row) {
            $new_batch_code = $b_row['batch_code'];
            $new_course_id = $b_row['course_id_ref'] ?? $b_row['course_id'];
            $new_course_name = $b_row['course_title'] ?? $new_course_name;
        }
    } else if ($new_batch_code) {
        $b_stmt = $db->prepare("SELECT b.*, c.title AS course_title, c.id AS course_id_ref FROM batches b LEFT JOIN courses c ON b.course_id = c.id WHERE b.batch_code = :bcode OR b.batch_name = :bname LIMIT 1");
        $b_stmt->execute([':bcode' => $new_batch_code, ':bname' => $new_batch_code]);
        $b_row = $b_stmt->fetch(PDO::FETCH_ASSOC);
        if ($b_row) {
            $new_batch_id = intval($b_row['id']);
            $new_course_id = $b_row['course_id_ref'] ?? $b_row['course_id'];
            $new_course_name = $b_row['course_title'] ?? $new_course_name;
        }
    }

    $stmt = $db->prepare("
        UPDATE students 
        SET batch_id = :bid, course_id = :cid 
        WHERE user_id = :uid
    ");
    $stmt->execute([
        ':bid' => $new_batch_id,
        ':cid' => $new_course_id,
        ':uid' => $user_id
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Student successfully transferred to " . $new_batch_code . "! All historical attendance and assignment logs are preserved."
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
