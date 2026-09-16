<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "--- Starting Multi-Enrollment Database Migration ---\n";

    // 1. Update batches table
    $batchCols = $db->query("SHOW COLUMNS FROM `batches`")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('enrollment_start_date', $batchCols)) {
        $db->exec("ALTER TABLE `batches` ADD COLUMN `enrollment_start_date` DATE DEFAULT NULL AFTER `start_date`");
        echo "✓ Added column 'enrollment_start_date' to batches table.\n";
    }
    if (!in_array('enrollment_end_date', $batchCols)) {
        $db->exec("ALTER TABLE `batches` ADD COLUMN `enrollment_end_date` DATE DEFAULT NULL AFTER `enrollment_start_date`");
        echo "✓ Added column 'enrollment_end_date' to batches table.\n";
    }
    if (!in_array('is_enrollment_open', $batchCols)) {
        $db->exec("ALTER TABLE `batches` ADD COLUMN `is_enrollment_open` TINYINT(1) DEFAULT 1 AFTER `status`");
        echo "✓ Added column 'is_enrollment_open' to batches table.\n";
    }

    // Set default enrollment dates on existing batches if empty
    $db->exec("UPDATE `batches` SET `enrollment_start_date` = `start_date`, `enrollment_end_date` = DATE_ADD(`start_date`, INTERVAL 10 DAY) WHERE `enrollment_start_date` IS NULL");
    echo "✓ Initialized enrollment dates on existing batches.\n";

    // 2. Update students table indexes
    // Check existing indexes on students
    $indexes = $db->query("SHOW INDEX FROM `students`")->fetchAll(PDO::FETCH_ASSOC);
    $userIndexName = null;
    $hasUniqueUserBatch = false;

    foreach ($indexes as $idx) {
        if ($idx['Column_name'] === 'user_id' && $idx['Non_unique'] == 0) {
            $userIndexName = $idx['Key_name'];
        }
        if ($idx['Key_name'] === 'unique_user_batch') {
            $hasUniqueUserBatch = true;
        }
    }

    if ($userIndexName) {
        try {
            $db->exec("ALTER TABLE `students` DROP INDEX `$userIndexName`");
            echo "✓ Dropped unique constraint on user_id in students table.\n";
        } catch (Exception $eDrop) {
            echo "! Notice on dropping index: " . $eDrop->getMessage() . "\n";
        }
    }

    if (!$hasUniqueUserBatch) {
        try {
            $db->exec("ALTER TABLE `students` ADD UNIQUE KEY `unique_user_batch` (`user_id`, `batch_id`)");
            echo "✓ Added composite unique constraint `unique_user_batch` (`user_id`, `batch_id`).\n";
        } catch (Exception $eAdd) {
            echo "! Notice on adding unique_user_batch: " . $eAdd->getMessage() . "\n";
        }
    }

    // Ensure normal index on user_id
    try {
        $db->exec("ALTER TABLE `students` ADD INDEX `idx_students_user_id` (`user_id`)");
        echo "✓ Ensured standard index on `user_id`.\n";
    } catch (Exception $eIdx) {
        // Index already exists
    }

    echo "--- Migration Completed Successfully! ---\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
