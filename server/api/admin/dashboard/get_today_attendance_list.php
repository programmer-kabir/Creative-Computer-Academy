<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$today = date('Y-m-d');

try {
    $query = "
        SELECT 
            u.id, u.name, u.profile_picture,
            e.designation,
            a.id as attendance_id, a.check_in, a.status as attendance_status
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN attendance a ON u.id = a.user_id AND a.date = :today
        WHERE ur.role IN ('staff', 'manager', 'instructor') AND u.status = 'active'
        ORDER BY u.name ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':today', $today);
    $stmt->execute();

    $present = [];
    $absent = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if ($row['attendance_id']) {
            $present[] = $row;
        } else {
            $absent[] = $row;
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "present" => $present,
            "absent" => $absent
        ]
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
