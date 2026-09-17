<?php
require_once __DIR__ . '/../config/database.php';

date_default_timezone_set('Asia/Dhaka');

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "--- Updating Quiz Questions Schema for Multiple Question Types (MCQ, Short Q&A, True/False) ---\n";

    // Modify column question_type to support single_choice, short_answer, true_false
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `question_type` VARCHAR(50) NOT NULL DEFAULT 'single_choice'");
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_a` TEXT NULL");
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_b` TEXT NULL");
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_c` TEXT NULL");
    $db->exec("ALTER TABLE `course_quiz_questions` MODIFY COLUMN `option_d` TEXT NULL");

    // Add correct_answer_text if not exists
    $colCheck = $db->query("SHOW COLUMNS FROM `course_quiz_questions` LIKE 'correct_answer_text'")->fetch();
    if (!$colCheck) {
        $db->exec("ALTER TABLE `course_quiz_questions` ADD COLUMN `correct_answer_text` TEXT NULL AFTER `correct_option`");
        echo "✓ Column 'correct_answer_text' added.\n";
    } else {
        echo "✓ Column 'correct_answer_text' already exists.\n";
    }

    echo "✓ Schema migration completed successfully!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
