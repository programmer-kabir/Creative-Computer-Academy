<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

try {
    // Top 10 English Typists
    $stmtEn = $db->query("
        SELECT 
            t.user_id,
            MAX(t.wpm) as best_wpm,
            AVG(t.accuracy_percent) as avg_accuracy,
            COUNT(t.id) as test_count,
            COALESCE(u.name, 'Student') as student_name,
            COALESCE(u.student_code, '') as student_code,
            COALESCE(u.avatar, '') as avatar
        FROM student_typing_sessions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.language = 'en' AND t.accuracy_percent >= 75
        GROUP BY t.user_id
        ORDER BY best_wpm DESC, avg_accuracy DESC
        LIMIT 10
    ");
    $topTypistsEn = $stmtEn->fetchAll(PDO::FETCH_ASSOC);

    // Top 10 Bangla Typists
    $stmtBn = $db->query("
        SELECT 
            t.user_id,
            MAX(t.wpm) as best_wpm,
            AVG(t.accuracy_percent) as avg_accuracy,
            COUNT(t.id) as test_count,
            COALESCE(u.name, 'Student') as student_name,
            COALESCE(u.student_code, '') as student_code,
            COALESCE(u.avatar, '') as avatar
        FROM student_typing_sessions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.language IN ('bn_avro', 'bn_bijoy') AND t.accuracy_percent >= 75
        GROUP BY t.user_id
        ORDER BY best_wpm DESC, avg_accuracy DESC
        LIMIT 10
    ");
    $topTypistsBn = $stmtBn->fetchAll(PDO::FETCH_ASSOC);

    // Top Foundations Achievers (Most Badges)
    $stmtBadges = $db->query("
        SELECT 
            b.user_id,
            COUNT(b.id) as badge_count,
            COALESCE(u.name, 'Student') as student_name,
            COALESCE(u.student_code, '') as student_code,
            COALESCE(u.avatar, '') as avatar
        FROM student_skill_badges b
        LEFT JOIN users u ON b.user_id = u.id
        GROUP BY b.user_id
        ORDER BY badge_count DESC
        LIMIT 10
    ");
    $topAchievers = $stmtBadges->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "top_english_typists" => $topTypistsEn,
            "top_bangla_typists" => $topTypistsBn,
            "top_achievers" => $topAchievers
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
