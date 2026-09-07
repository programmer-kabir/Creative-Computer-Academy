<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Create students table
    $queryStudents = "CREATE TABLE IF NOT EXISTS `students` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL UNIQUE,
        `course_id` INT DEFAULT NULL,
        `batch_id` INT DEFAULT NULL,
        `student_code` VARCHAR(50) NOT NULL UNIQUE,
        `course_name` VARCHAR(150) NOT NULL,
        `batch_no` VARCHAR(50) DEFAULT NULL,
        `guardian_phone` VARCHAR(20) DEFAULT NULL,
        `enrollment_date` DATE NOT NULL,
        `completion_date` DATE DEFAULT NULL,
        `status` ENUM('active', 'completed', 'promoted_to_staff', 'dropped', 'suspended') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (`user_id`),
        INDEX (`course_id`),
        INDEX (`batch_id`),
        INDEX (`student_code`),
        INDEX (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $db->exec($queryStudents);
    echo "✓ Table 'students' verified/created.\n";

    // 1.1 ALTER table if columns missing
    try {
        $cols = $db->query("SHOW COLUMNS FROM `students`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('course_id', $cols)) {
            $db->exec("ALTER TABLE `students` ADD COLUMN `course_id` INT DEFAULT NULL AFTER `user_id`, ADD INDEX (`course_id`)");
            echo "✓ Added column 'course_id' to 'students'.\n";
        }
        if (!in_array('batch_id', $cols)) {
            $db->exec("ALTER TABLE `students` ADD COLUMN `batch_id` INT DEFAULT NULL AFTER `course_id`, ADD INDEX (`batch_id`)");
            echo "✓ Added column 'batch_id' to 'students'.\n";
        }

        // Sync existing students' course_id and batch_id if courses and batches exist
        $db->exec("
            UPDATE `students` s
            INNER JOIN `courses` c ON s.course_name = c.title OR s.course_name = c.course_code
            SET s.course_id = c.id
            WHERE s.course_id IS NULL;
        ");
        $db->exec("
            UPDATE `students` s
            INNER JOIN `batches` b ON s.batch_no = b.batch_code OR s.batch_no = b.batch_name
            SET s.batch_id = b.id
            WHERE s.batch_id IS NULL;
        ");
        echo "✓ Synchronized course_id & batch_id on existing students records.\n";
    } catch (Exception $eCol) {
        // Table or columns already fine
    }

    // 2. Create student_assignments table
    $queryAssignments = "CREATE TABLE IF NOT EXISTS `student_assignments` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `title` VARCHAR(255) NOT NULL,
        `course_id` INT DEFAULT NULL,
        `batch_id` INT DEFAULT NULL,
        `course_name` VARCHAR(150) NOT NULL,
        `batch_no` VARCHAR(50) DEFAULT NULL,
        `description` TEXT DEFAULT NULL,
        `due_date` DATETIME NOT NULL,
        `total_marks` INT DEFAULT 100,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (`course_id`),
        INDEX (`batch_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $db->exec($queryAssignments);
    echo "✓ Table 'student_assignments' verified/created.\n";

    // 3. Create student_submissions table
    $querySubmissions = "CREATE TABLE IF NOT EXISTS `student_submissions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `assignment_id` INT NOT NULL,
        `user_id` INT NOT NULL,
        `submission_link` TEXT NOT NULL,
        `notes` TEXT DEFAULT NULL,
        `marks_obtained` INT DEFAULT NULL,
        `feedback` TEXT DEFAULT NULL,
        `status` ENUM('submitted', 'reviewed', 'resubmit_required') DEFAULT 'submitted',
        `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `reviewed_at` DATETIME DEFAULT NULL,
        INDEX (`assignment_id`),
        INDEX (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $db->exec($querySubmissions);
    echo "✓ Table 'student_submissions' verified/created.\n";

    echo "All student tables migrated successfully.\n";
} catch (PDOException $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
?>
