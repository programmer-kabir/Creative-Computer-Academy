<?php
require_once __DIR__ . '/../config/database.php';

date_default_timezone_set('Asia/Dhaka');

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "--- Starting Quiz & Assessment Tables Migration ---\n";

    // 1. Create course_quizzes table
    $queryQuizzes = "
    CREATE TABLE IF NOT EXISTS `course_quizzes` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `course_id` INT NOT NULL,
        `milestone_id` INT NULL,
        `module_id` INT NOT NULL,
        `lesson_id` INT NULL,
        `quiz_no` INT NOT NULL DEFAULT 1,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT NULL,
        `time_limit_minutes` INT NOT NULL DEFAULT 10,
        `passing_score_percent` INT NOT NULL DEFAULT 70,
        `total_marks` INT NOT NULL DEFAULT 5,
        `order_index` INT NOT NULL DEFAULT 99,
        `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_quizzes_module` (`module_id`),
        INDEX `idx_quizzes_course` (`course_id`),
        INDEX `idx_quizzes_milestone` (`milestone_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($queryQuizzes);
    echo "✓ Table 'course_quizzes' verified/created.\n";

    // 2. Create course_quiz_questions table
    $queryQuestions = "
    CREATE TABLE IF NOT EXISTS `course_quiz_questions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `quiz_id` INT NOT NULL,
        `question_text` TEXT NOT NULL,
        `question_type` ENUM('single_choice', 'multiple_choice') NOT NULL DEFAULT 'single_choice',
        `option_a` TEXT NOT NULL,
        `option_b` TEXT NOT NULL,
        `option_c` TEXT NOT NULL,
        `option_d` TEXT NOT NULL,
        `correct_option` VARCHAR(10) NOT NULL DEFAULT 'a',
        `explanation` TEXT NULL,
        `marks` INT NOT NULL DEFAULT 1,
        `order_index` INT NOT NULL DEFAULT 1,
        INDEX `idx_questions_quiz` (`quiz_id`),
        INDEX `idx_questions_order` (`quiz_id`, `order_index`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($queryQuestions);
    echo "✓ Table 'course_quiz_questions' verified/created.\n";

    // 3. Create student_quiz_attempts table
    $queryAttempts = "
    CREATE TABLE IF NOT EXISTS `student_quiz_attempts` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `quiz_id` INT NOT NULL,
        `course_id` INT NOT NULL,
        `total_questions` INT NOT NULL DEFAULT 0,
        `correct_answers` INT NOT NULL DEFAULT 0,
        `score_percent` INT NOT NULL DEFAULT 0,
        `is_passed` TINYINT(1) NOT NULL DEFAULT 0,
        `answers_json` LONGTEXT NULL,
        `time_taken_seconds` INT NOT NULL DEFAULT 0,
        `attempt_number` INT NOT NULL DEFAULT 1,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_attempts_user_quiz` (`user_id`, `quiz_id`),
        INDEX `idx_attempts_course` (`course_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $db->exec($queryAttempts);
    echo "✓ Table 'student_quiz_attempts' verified/created.\n";

    // 4. Seed sample quizzes for each course if empty
    $courses = $db->query("SELECT id, title FROM courses WHERE status = 'active'")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($courses as $c) {
        $cid = $c['id'];
        $qCount = $db->query("SELECT COUNT(*) FROM course_quizzes WHERE course_id = $cid")->fetchColumn();
        
        if ($qCount == 0) {
            $modules = $db->query("SELECT id, milestone_id, module_no, title FROM course_modules WHERE course_id = $cid ORDER BY module_no ASC")->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($modules)) {
                // Attach sample quizzes to the first two modules
                foreach (array_slice($modules, 0, 2) as $mIdx => $mod) {
                    $modId = $mod['id'];
                    $mId = $mod['milestone_id'];
                    $qNo = $mIdx + 1;
                    $quizTitle = "Module 0{$mod['module_no']} Assessment: Core Skills & MCQ Challenge";
                    $quizDesc = "Test your knowledge on key topics covered in {$mod['title']}. Score 70% or higher to earn the completion badge!";

                    $stmtQ = $db->prepare("
                        INSERT INTO course_quizzes 
                        (course_id, milestone_id, module_id, quiz_no, title, description, time_limit_minutes, passing_score_percent, total_marks, order_index, status) 
                        VALUES (?, ?, ?, ?, ?, ?, 10, 70, 5, 99, 'active')
                    ");
                    $stmtQ->execute([$cid, $mId, $modId, $qNo, $quizTitle, $quizDesc]);
                    $quizId = $db->lastInsertId();

                    // Seed 5 high-quality sample questions
                    $sampleQuestions = [
                        [
                            'q' => "What is the primary objective of following standard best practices in project workflow?",
                            'a' => "To increase code complexity",
                            'b' => "To ensure scalability, maintainability, and team collaboration",
                            'c' => "To slow down deployment times",
                            'd' => "To prevent using modern frameworks",
                            'correct' => "b",
                            'exp' => "Standard industry practices guarantee high scalability, readable code, and seamless long-term maintenance."
                        ],
                        [
                            'q' => "Which keyboard shortcut is universally used to save changes in modern development environments?",
                            'a' => "Ctrl + S (or Cmd + S on Mac)",
                            'b' => "Ctrl + Q",
                            'c' => "Alt + F4",
                            'd' => "Shift + Delete",
                            'correct' => "a",
                            'exp' => "Ctrl + S is the universal standard shortcut to save active file modifications across all modern IDEs."
                        ],
                        [
                            'q' => "Why is responsive design essential in modern digital applications?",
                            'a' => "It only supports 4K monitor screens",
                            'b' => "It ensures consistent, optimal layout across mobile, tablet, and desktop devices",
                            'c' => "It eliminates the need for styling CSS",
                            'd' => "It requires separate websites for each device",
                            'correct' => "b",
                            'exp' => "Responsive design allows a single codebase to automatically adapt its user interface to any screen resolution."
                        ],
                        [
                            'q' => "What role does version control (such as Git) play in team projects?",
                            'a' => "Tracks revision history and enables concurrent branch collaboration",
                            'b' => "Replaces database storage engines",
                            'c' => "Prevents writing comments in code",
                            'd' => "Deletes outdated files automatically",
                            'correct' => "a",
                            'exp' => "Version control tracks every code snapshot, prevents data loss, and empowers teams to work on branches simultaneously."
                        ],
                        [
                            'q' => "Before delivering a completed module project to production, what is the most critical step?",
                            'a' => "Ignoring console warnings",
                            'b' => "Manual testing, edge-case validation, and performance checks",
                            'c' => "Deleting project documentation",
                            'd' => "Disabling authentication checks",
                            'correct' => "b",
                            'exp' => "Rigorous testing and cross-browser validation ensure error-free performance in live production environments."
                        ]
                    ];

                    foreach ($sampleQuestions as $qIdx => $sq) {
                        $stmtQuest = $db->prepare("
                            INSERT INTO course_quiz_questions 
                            (quiz_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_option, explanation, marks, order_index) 
                            VALUES (?, ?, 'single_choice', ?, ?, ?, ?, ?, ?, 1, ?)
                        ");
                        $stmtQuest->execute([
                            $quizId,
                            $sq['q'],
                            $sq['a'],
                            $sq['b'],
                            $sq['c'],
                            $sq['d'],
                            $sq['correct'],
                            $sq['exp'],
                            $qIdx + 1
                        ]);
                    }
                    echo "  + Created Quiz ID {$quizId} with 5 questions for Course ID {$cid} Module {$mod['module_no']}\n";
                }
            }
        }
    }

    echo "\n=== Migration Completed Successfully! ===\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
