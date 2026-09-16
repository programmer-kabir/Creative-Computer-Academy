<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "--- Starting Curriculum Hierarchy Migration ---\n";

    // 1. Create course_milestones table
    $queryMilestones = "
    CREATE TABLE IF NOT EXISTS `course_milestones` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `course_id` INT NOT NULL,
        `milestone_no` INT NOT NULL DEFAULT 1,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT NULL,
        `order_index` INT NOT NULL DEFAULT 1,
        `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_course_milestones_course` (`course_id`),
        INDEX `idx_course_milestones_order` (`course_id`, `order_index`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($queryMilestones);
    echo "✓ Table 'course_milestones' verified/created.\n";

    // 2. Ensure course_modules has milestone_id column
    $colCheck = $db->query("SHOW COLUMNS FROM `course_modules` LIKE 'milestone_id'")->fetch();
    if (!$colCheck) {
        $db->exec("ALTER TABLE `course_modules` ADD COLUMN `milestone_id` INT NULL AFTER `course_id`");
        $db->exec("ALTER TABLE `course_modules` ADD INDEX `idx_modules_milestone` (`milestone_id`)");
        echo "✓ Added 'milestone_id' column to 'course_modules'.\n";
    } else {
        echo "✓ 'milestone_id' column in 'course_modules' already present.\n";
    }

    // 3. Create course_lessons table (5-9 videos per module)
    $queryLessons = "
    CREATE TABLE IF NOT EXISTS `course_lessons` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `course_id` INT NOT NULL,
        `milestone_id` INT NULL,
        `module_id` INT NOT NULL,
        `lesson_no` INT NOT NULL DEFAULT 1,
        `title` VARCHAR(255) NOT NULL,
        `video_type` ENUM('youtube', 'vimeo', 'drive', 'direct', 'embed') NOT NULL DEFAULT 'youtube',
        `video_url` VARCHAR(1000) NOT NULL,
        `duration_minutes` VARCHAR(50) NOT NULL DEFAULT '10:00',
        `summary` TEXT NULL,
        `resources_json` TEXT NULL,
        `order_index` INT NOT NULL DEFAULT 1,
        `is_free_preview` TINYINT(1) NOT NULL DEFAULT 0,
        `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_lessons_module` (`module_id`),
        INDEX `idx_lessons_course` (`course_id`),
        INDEX `idx_lessons_milestone` (`milestone_id`),
        INDEX `idx_lessons_order` (`module_id`, `order_index`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($queryLessons);
    echo "✓ Table 'course_lessons' verified/created.\n";

    // 4. Create student_lesson_progress table
    $queryProgress = "
    CREATE TABLE IF NOT EXISTS `student_lesson_progress` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `course_id` INT NOT NULL,
        `lesson_id` INT NOT NULL,
        `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
        `watched_seconds` INT NOT NULL DEFAULT 0,
        `completed_at` DATETIME NULL,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY `unique_user_lesson` (`user_id`, `lesson_id`),
        INDEX `idx_progress_user_course` (`user_id`, `course_id`),
        INDEX `idx_progress_lesson` (`lesson_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($queryProgress);
    echo "✓ Table 'student_lesson_progress' verified/created.\n";

    // 5. Seed default milestones & lessons for courses that don't have them yet
    $courses = $db->query("SELECT id, title FROM courses WHERE status = 'active'")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($courses as $c) {
        $cid = $c['id'];
        $ctitle = $c['title'];

        // Check if course has milestones
        $mCount = $db->query("SELECT COUNT(*) FROM course_milestones WHERE course_id = $cid")->fetchColumn();
        if ($mCount == 0) {
            // Create 2-3 sample milestones
            $milestones = [
                ['no' => 1, 'title' => "Milestone 1: Core Fundamentals & Concept Mastery", 'desc' => "Build rock-solid basic understanding and theoretical foundations."],
                ['no' => 2, 'title' => "Milestone 2: Practical Implementation & Tools In-Depth", 'desc' => "Hands-on implementation of core tools, techniques, and workflow."],
                ['no' => 3, 'title' => "Milestone 3: Advanced Projects & Industry Workflow", 'desc' => "Real-world portfolio projects, optimization, and final production delivery."]
            ];

            $mIds = [];
            foreach ($milestones as $idx => $m) {
                $stmt = $db->prepare("INSERT INTO course_milestones (course_id, milestone_no, title, description, order_index, status) VALUES (?, ?, ?, ?, ?, 'active')");
                $stmt->execute([$cid, $m['no'], $m['title'], $m['desc'], $idx + 1]);
                $mIds[$m['no']] = $db->lastInsertId();
            }
            echo "  + Created 3 milestones for Course ID {$cid} ({$ctitle})\n";

            // Attach existing modules to these milestones
            $existingModules = $db->query("SELECT id, module_no, title FROM course_modules WHERE course_id = $cid ORDER BY module_no ASC")->fetchAll(PDO::FETCH_ASSOC);

            if (empty($existingModules)) {
                // If no modules exist, create standard modules
                $sampleModules = [
                    ['mno' => 1, 'title' => 'Module 01: Environment Setup & Foundation', 'milestone' => 1],
                    ['mno' => 2, 'title' => 'Module 02: Core Principles & Workflow Architecture', 'milestone' => 1],
                    ['mno' => 3, 'title' => 'Module 03: Practical Deep-Dive & Key Techniques', 'milestone' => 2],
                    ['mno' => 4, 'title' => 'Module 04: Advanced Hands-On Project Implementation', 'milestone' => 2],
                    ['mno' => 5, 'title' => 'Module 05: Capstone Project & Portfolio Review', 'milestone' => 3]
                ];

                foreach ($sampleModules as $sm) {
                    $targetMId = $mIds[$sm['milestone']] ?? $mIds[1];
                    $stmtMod = $db->prepare("INSERT INTO course_modules (course_id, milestone_id, module_no, title, description, duration_classes, order_index, status) VALUES (?, ?, ?, ?, ?, '6 Classes', ?, 'active')");
                    $stmtMod->execute([$cid, $targetMId, $sm['mno'], $sm['title'], "Master key concepts in this module.", $sm['mno']]);
                    $modId = $db->lastInsertId();
                    $existingModules[] = ['id' => $modId, 'module_no' => $sm['mno'], 'title' => $sm['title'], 'milestone_id' => $targetMId];
                }
            } else {
                // Distribute existing modules across milestones
                foreach ($existingModules as $emIdx => $em) {
                    $targetMNo = ($emIdx < 2) ? 1 : (($emIdx < 4) ? 2 : 3);
                    $targetMId = $mIds[$targetMNo] ?? $mIds[1];
                    $db->exec("UPDATE course_modules SET milestone_id = {$targetMId} WHERE id = {$em['id']}");
                }
            }

            // Seed 5-6 sample lessons for each module
            $sampleLessonsTemplates = [
                ['title' => "1. Overview, Tools Setup & Roadmap", 'dur' => "10:30", 'url' => "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
                ['title' => "2. Core Concepts & Essential Breakdown", 'dur' => "14:15", 'url' => "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
                ['title' => "3. Deep Dive into Practical Techniques", 'dur' => "18:40", 'url' => "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
                ['title' => "4. Common Mistakes & Best Industry Practices", 'dur' => "12:20", 'url' => "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
                ['title' => "5. Hands-on Practice & Project Integration", 'dur' => "22:50", 'url' => "https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
                ['title' => "6. Module Summary, Quiz & Assignment Brief", 'dur' => "08:15", 'url' => "https://www.youtube.com/watch?v=dQw4w9WgXcQ"]
            ];

            foreach ($existingModules as $mod) {
                $modId = $mod['id'];
                $lCount = $db->query("SELECT COUNT(*) FROM course_lessons WHERE module_id = $modId")->fetchColumn();
                if ($lCount == 0) {
                    $mIdForMod = $db->query("SELECT milestone_id FROM course_modules WHERE id = $modId")->fetchColumn();
                    foreach ($sampleLessonsTemplates as $lIdx => $lt) {
                        $lNo = $lIdx + 1;
                        $lTitle = "Lecture {$mod['module_no']}-{$lNo}: {$lt['title']}";
                        $resJson = json_encode([
                            ["title" => "Lecture Notes & Cheat Sheet", "url" => "https://example.com/notes.pdf"],
                            ["title" => "Project Source Files & Assets", "url" => "https://example.com/assets.zip"]
                        ]);

                        $stmtL = $db->prepare("INSERT INTO course_lessons (course_id, milestone_id, module_id, lesson_no, title, video_type, video_url, duration_minutes, summary, resources_json, order_index, is_free_preview, status) VALUES (?, ?, ?, ?, ?, 'youtube', ?, ?, ?, ?, ?, ?, 'active')");
                        $stmtL->execute([
                            $cid,
                            $mIdForMod ?: null,
                            $modId,
                            $lNo,
                            $lTitle,
                            $lt['url'],
                            $lt['dur'],
                            "Comprehensive video class explaining {$lTitle}. Watch carefully and complete practice exercises.",
                            $resJson,
                            $lNo,
                            $lNo === 1 ? 1 : 0
                        ]);
                    }
                }
            }
        }
    }

    echo "\n=== Migration Completed Successfully! ===\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
