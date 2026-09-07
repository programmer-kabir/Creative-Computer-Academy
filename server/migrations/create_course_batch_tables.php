<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Courses Master Table
    $queryCourses = "CREATE TABLE IF NOT EXISTS `courses` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `course_code` VARCHAR(50) NOT NULL UNIQUE,
        `title` VARCHAR(150) NOT NULL,
        `category` VARCHAR(100) DEFAULT 'General',
        `description` TEXT DEFAULT NULL,
        `duration_months` INT DEFAULT 3,
        `total_classes` INT DEFAULT 36,
        `fee_amount` DECIMAL(10,2) DEFAULT 0.00,
        `status` ENUM('active', 'inactive', 'archived') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (`course_code`),
        INDEX (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $db->exec($queryCourses);
    echo "✓ Table 'courses' created or verified.\n";

    // 2. Course Modules (Syllabus/Curriculum)
    $queryModules = "CREATE TABLE IF NOT EXISTS `course_modules` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `course_id` INT NOT NULL,
        `module_no` INT NOT NULL DEFAULT 1,
        `title` VARCHAR(200) NOT NULL,
        `description` TEXT DEFAULT NULL,
        `duration_classes` INT DEFAULT 6,
        `order_index` INT DEFAULT 0,
        `status` ENUM('active', 'inactive') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (`course_id`),
        INDEX (`module_no`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $db->exec($queryModules);
    echo "✓ Table 'course_modules' created or verified.\n";

    // 3. Batches Table
    $queryBatches = "CREATE TABLE IF NOT EXISTS `batches` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `course_id` INT NOT NULL,
        `batch_code` VARCHAR(50) NOT NULL UNIQUE,
        `batch_name` VARCHAR(150) NOT NULL,
        `lead_instructor_id` INT DEFAULT NULL,
        `assistant_instructor_id` INT DEFAULT NULL,
        `lab_room` VARCHAR(100) DEFAULT 'Main Computer Lab',
        `schedule_days` VARCHAR(150) DEFAULT 'Sun, Tue, Thu',
        `schedule_time` VARCHAR(100) DEFAULT '10:00 AM - 12:00 PM',
        `max_capacity` INT DEFAULT 25,
        `start_date` DATE NOT NULL,
        `expected_end_date` DATE DEFAULT NULL,
        `status` ENUM('enrolling', 'running', 'exam_phase', 'completed', 'archived') DEFAULT 'enrolling',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (`course_id`),
        INDEX (`batch_code`),
        INDEX (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $db->exec($queryBatches);
    echo "✓ Table 'batches' created or verified.\n";

    // 4. Batch Module Progress (Unlocks & Completion)
    $queryBatchProgress = "CREATE TABLE IF NOT EXISTS `batch_module_progress` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `batch_id` INT NOT NULL,
        `module_id` INT NOT NULL,
        `is_unlocked` TINYINT(1) DEFAULT 0,
        `completed_classes` INT DEFAULT 0,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `unique_batch_module` (`batch_id`, `module_id`),
        INDEX (`batch_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $db->exec($queryBatchProgress);
    echo "✓ Table 'batch_module_progress' created or verified.\n";

    // 5. Seed default demo courses if empty
    $chkCourses = $db->query("SELECT COUNT(*) FROM `courses`")->fetchColumn();
    if ($chkCourses == 0) {
        $db->exec("INSERT INTO `courses` (`course_code`, `title`, `category`, `duration_months`, `total_classes`, `description`) VALUES
            ('GD-101', 'Graphic Design & Multimedia', 'Creative & Design', 3, 36, 'Master Adobe Photoshop, Illustrator, InDesign, vector branding, and AI creative tools.'),
            ('WD-201', 'Full Stack Web Development', 'Programming', 6, 72, 'Comprehensive web development covering HTML, CSS, JavaScript, React.js, PHP and MySQL.'),
            ('DM-301', 'Advanced Digital Marketing', 'Marketing & Business', 3, 36, 'SEO, Social Media Marketing, Meta Ads, Google Analytics, and Content Strategy.')
        ");

        $gdId = $db->lastInsertId();
        $db->exec("INSERT INTO `batches` (`course_id`, `batch_code`, `batch_name`, `schedule_days`, `schedule_time`, `max_capacity`, `start_date`, `status`) VALUES
            (1, 'GD-B11-2026', 'Graphic Design Batch 11 (Morning)', 'Sat, Mon, Wed', '10:00 AM - 12:00 PM', 25, CURDATE(), 'running'),
            (1, 'GD-B12-2026', 'Graphic Design Batch 12 (Evening)', 'Sun, Tue, Thu', '04:00 PM - 06:00 PM', 25, DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'enrolling'),
            (2, 'WD-B05-2026', 'Web Dev Batch 05 (Weekend)', 'Fri, Sat', '02:00 PM - 05:00 PM', 20, CURDATE(), 'running')
        ");
        echo "✓ Seeded initial courses and batches.\n";
    }

    echo "Course and Batch migration completed successfully.\n";
} catch (PDOException $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
?>
