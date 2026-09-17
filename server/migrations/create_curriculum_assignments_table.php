<?php
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Create course_assignments table
    $query = "CREATE TABLE IF NOT EXISTS `course_assignments` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `course_id` INT NOT NULL,
        `milestone_id` INT DEFAULT NULL,
        `module_id` INT NOT NULL,
        `assignment_no` INT DEFAULT 1,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT DEFAULT NULL,
        `total_marks` INT DEFAULT 100,
        `pass_marks` INT DEFAULT 50,
        `resources_json` TEXT DEFAULT NULL,
        `order_index` INT DEFAULT 99,
        `status` ENUM('active', 'inactive') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (`course_id`),
        INDEX (`module_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $db->exec($query);
    echo "✓ Table 'course_assignments' created or verified.\n";

    // 2. Ensure student_submissions table exists with assignment_id, course_id, user_id, submission_link, notes, marks_obtained, feedback, status
    $querySub = "CREATE TABLE IF NOT EXISTS `student_submissions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `assignment_id` INT NOT NULL,
        `course_id` INT DEFAULT NULL,
        `user_id` INT NOT NULL,
        `submission_link` TEXT NOT NULL,
        `notes` TEXT DEFAULT NULL,
        `marks_obtained` INT DEFAULT NULL,
        `feedback` TEXT DEFAULT NULL,
        `status` ENUM('submitted', 'reviewed', 'resubmit_required') DEFAULT 'submitted',
        `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `reviewed_at` DATETIME DEFAULT NULL,
        `reviewer_id` INT DEFAULT NULL,
        INDEX (`assignment_id`),
        INDEX (`user_id`),
        INDEX (`course_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $db->exec($querySub);
    echo "✓ Table 'student_submissions' created or verified.\n";

} catch (PDOException $e) {
    echo "Error creating assignment tables: " . $e->getMessage() . "\n";
}
?>
