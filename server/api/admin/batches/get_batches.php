<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$course_id = isset($_GET['course_id']) ? intval($_GET['course_id']) : null;
$status = isset($_GET['status']) ? trim($_GET['status']) : null;

try {
    $where = [];
    $params = [];

    if ($course_id) {
        $where[] = "b.course_id = :cid";
        $params[':cid'] = $course_id;
    }

    if ($status && $status !== 'all') {
        $where[] = "b.status = :status";
        $params[':status'] = $status;
    }

    $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

    $query = "
        SELECT 
            b.*,
            c.title AS course_title,
            c.course_code AS course_code_ref,
            c.category AS course_category,
            c.total_classes AS course_total_classes,
            u_lead.name AS lead_instructor_name,
            u_lead.email AS lead_instructor_email,
            u_ast.name AS assistant_instructor_name,
            (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) AS enrolled_students_count,
            (SELECT COUNT(*) FROM course_modules m WHERE m.course_id = b.course_id) AS total_modules_count
        FROM batches b
        LEFT JOIN courses c ON b.course_id = c.id
        LEFT JOIN employees e_lead ON b.lead_instructor_id = e_lead.id
        LEFT JOIN users u_lead ON e_lead.user_id = u_lead.id
        LEFT JOIN employees e_ast ON b.assistant_instructor_id = e_ast.id
        LEFT JOIN users u_ast ON e_ast.user_id = u_ast.id
        $whereClause
        ORDER BY b.id DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $batches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $batches
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
