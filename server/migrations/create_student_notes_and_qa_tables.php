<?php
require_once __DIR__ . '/../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo "Database connection failed!\n";
    exit(1);
}

try {
    // 1. Create `student_lesson_notes` Table (Private Personal Notes for each student)
    $sqlNotes = "
    CREATE TABLE IF NOT EXISTS `student_lesson_notes` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `course_id` INT NOT NULL,
        `lesson_id` INT NOT NULL,
        `timestamp_seconds` INT NOT NULL DEFAULT 0,
        `timestamp_formatted` VARCHAR(20) NOT NULL DEFAULT '00:00',
        `note_text` LONGTEXT NOT NULL,
        `color_tag` VARCHAR(30) DEFAULT 'indigo',
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_notes_user_lesson` (`user_id`, `lesson_id`),
        INDEX `idx_notes_user_course` (`user_id`, `course_id`),
        INDEX `idx_notes_lesson` (`lesson_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($sqlNotes);
    echo "✅ Table `student_lesson_notes` verified/created successfully.\n";

    // 2. Create `student_lesson_discussions` Table (Public Q&A Questions for the lesson)
    $sqlDiscussions = "
    CREATE TABLE IF NOT EXISTS `student_lesson_discussions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `course_id` INT NOT NULL,
        `lesson_id` INT NOT NULL,
        `timestamp_seconds` INT DEFAULT 0,
        `timestamp_formatted` VARCHAR(20) DEFAULT NULL,
        `question_title` VARCHAR(255) NOT NULL,
        `question_details` LONGTEXT DEFAULT NULL,
        `status` ENUM('open', 'resolved', 'pinned') NOT NULL DEFAULT 'open',
        `upvotes` INT NOT NULL DEFAULT 0,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_disc_lesson` (`lesson_id`),
        INDEX `idx_disc_course` (`course_id`),
        INDEX `idx_disc_user` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($sqlDiscussions);
    echo "✅ Table `student_lesson_discussions` verified/created successfully.\n";

    // 3. Create `student_lesson_discussion_replies` Table (Replies & Instructor Answers)
    $sqlReplies = "
    CREATE TABLE IF NOT EXISTS `student_lesson_discussion_replies` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `discussion_id` INT NOT NULL,
        `user_id` INT NOT NULL,
        `reply_text` LONGTEXT NOT NULL,
        `is_instructor` TINYINT(1) NOT NULL DEFAULT 0,
        `is_solution` TINYINT(1) NOT NULL DEFAULT 0,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_replies_disc` (`discussion_id`),
        INDEX `idx_replies_user` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($sqlReplies);
    echo "✅ Table `student_lesson_discussion_replies` verified/created successfully.\n";

    echo "\n🎉 All Student Personal Notes & Q&A Discussion schemas are fully active!\n";
} catch (PDOException $e) {
    echo "❌ Error migrating tables: " . $e->getMessage() . "\n";
}
?>
