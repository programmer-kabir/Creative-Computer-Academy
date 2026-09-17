<?php
require_once __DIR__ . '/../config/database.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    die("Database connection failed.\n");
}

echo "Starting Computer Foundations & Typing Lab migration...\n";

try {
    // 1. Mouse & Foundations Drills Table
    $db->exec("
        CREATE TABLE IF NOT EXISTS `student_foundations_drills` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `drill_type` ENUM('mouse_click', 'mouse_double_click', 'mouse_drag_drop', 'mouse_right_click', 'mouse_scroll', 'shortcuts_trainer') NOT NULL,
            `level_no` INT NOT NULL DEFAULT 1,
            `score` INT NOT NULL DEFAULT 0,
            `accuracy_percent` INT NOT NULL DEFAULT 100,
            `reaction_time_ms` INT NOT NULL DEFAULT 0,
            `mistakes_count` INT NOT NULL DEFAULT 0,
            `duration_seconds` INT NOT NULL DEFAULT 0,
            `completed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_drills_user` (`user_id`),
            INDEX `idx_drills_type` (`drill_type`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "✓ Table 'student_foundations_drills' created or exists.\n";

    // 2. Typing Sessions Table
    $db->exec("
        CREATE TABLE IF NOT EXISTS `student_typing_sessions` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `language` ENUM('en', 'bn_avro', 'bn_bijoy') NOT NULL DEFAULT 'en',
            `difficulty_level` ENUM('home_row', 'top_row', 'bottom_row', 'numbers_symbols', 'words', 'paragraphs', 'speed_test') NOT NULL DEFAULT 'home_row',
            `wpm` INT NOT NULL DEFAULT 0,
            `cpm` INT NOT NULL DEFAULT 0,
            `accuracy_percent` INT NOT NULL DEFAULT 100,
            `raw_wpm` INT NOT NULL DEFAULT 0,
            `mistakes_count` INT NOT NULL DEFAULT 0,
            `error_keys_json` LONGTEXT NULL,
            `duration_seconds` INT NOT NULL DEFAULT 60,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_typing_user` (`user_id`),
            INDEX `idx_typing_lang` (`language`),
            INDEX `idx_typing_wpm` (`wpm`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "✓ Table 'student_typing_sessions' created or exists.\n";

    // 3. Student Skill Badges Table
    $db->exec("
        CREATE TABLE IF NOT EXISTS `student_skill_badges` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `badge_code` VARCHAR(50) NOT NULL,
            `badge_title` VARCHAR(100) NOT NULL,
            `badge_category` ENUM('mouse', 'typing', 'shortcuts', 'general') NOT NULL DEFAULT 'general',
            `badge_icon` VARCHAR(50) NOT NULL DEFAULT '🏆',
            `description` TEXT NULL,
            `unlocked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `uniq_user_badge` (`user_id`, `badge_code`),
            INDEX `idx_badges_user` (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "✓ Table 'student_skill_badges' created or exists.\n";

    echo "Migration completed successfully!\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
