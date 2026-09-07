<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "
        SELECT 
            c.*,
            (SELECT COUNT(*) FROM batches b WHERE b.course_id = c.id AND b.status IN ('enrolling', 'running')) AS active_batches_count,
            (SELECT COUNT(*) FROM batches b WHERE b.course_id = c.id) AS total_batches_count,
            (SELECT COUNT(*) FROM course_modules m WHERE m.course_id = c.id) AS total_modules_count,
            (SELECT COUNT(*) FROM students s WHERE s.course_id = c.id) AS enrolled_students_count
        FROM courses c
        ORDER BY c.id DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute();
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $courses
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
