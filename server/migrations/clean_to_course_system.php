<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "--- Starting Clean Course-Centric Migration ---\n";

    // 1. Update students table indexes to be (user_id, course_id) unique
    $indexes = $db->query("SHOW INDEX FROM `students`")->fetchAll(PDO::FETCH_ASSOC);
    $hasUniqueUserBatch = false;
    $hasUniqueUserCourse = false;

    foreach ($indexes as $idx) {
        if ($idx['Key_name'] === 'unique_user_batch') {
            $hasUniqueUserBatch = true;
        }
        if ($idx['Key_name'] === 'unique_user_course') {
            $hasUniqueUserCourse = true;
        }
    }

    if ($hasUniqueUserBatch) {
        try {
            $db->exec("ALTER TABLE `students` DROP INDEX `unique_user_batch`");
            echo "✓ Dropped old batch index `unique_user_batch`.\n";
        } catch (Exception $e) {
            echo "! Notice: " . $e->getMessage() . "\n";
        }
    }

    if (!$hasUniqueUserCourse) {
        try {
            $db->exec("ALTER TABLE `students` ADD UNIQUE KEY `unique_user_course` (`user_id`, `course_id`)");
            echo "✓ Added clean `unique_user_course` (`user_id`, `course_id`) index.\n";
        } catch (Exception $e) {
            echo "! Notice on adding unique_user_course: " . $e->getMessage() . "\n";
        }
    }

    echo "--- Database Transition to Pure Course System Completed! ---\n";

} catch (PDOException $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
?>
