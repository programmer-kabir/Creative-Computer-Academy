<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $userId = 14;

    echo "--- Enrolling User ID: $userId into a Batch ---\n";

    // 1. Check if user 14 exists
    $uStmt = $db->prepare("SELECT id, name, email FROM users WHERE id = :id LIMIT 1");
    $uStmt->execute([':id' => $userId]);
    $user = $uStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Create user 14 if it doesn't exist
        $pwd = password_hash('12345678', PASSWORD_BCRYPT);
        $insU = $db->prepare("
            INSERT INTO users (id, name, email, phone, password, status, created_at, updated_at)
            VALUES (14, 'Demo Student', 'student14@cca.edu.bd', '01700000014', :pwd, 'active', NOW(), NOW())
        ");
        $insU->execute([':pwd' => $pwd]);
        echo "✓ Created Demo Student with User ID 14 (Email: student14@cca.edu.bd, Pass: 12345678)\n";
    } else {
        echo "✓ Found user: {$user['name']} ({$user['email']})\n";
    }

    // 2. Ensure student role in user_roles
    $rChk = $db->prepare("SELECT id FROM user_roles WHERE user_id = :uid AND role = 'student' LIMIT 1");
    $rChk->execute([':uid' => $userId]);
    if ($rChk->rowCount() === 0) {
        $db->prepare("INSERT INTO user_roles (user_id, role) VALUES (:uid, 'student')")->execute([':uid' => $userId]);
        echo "✓ Assigned 'student' role in user_roles.\n";
    }

    // 3. Find an active or running batch
    $bStmt = $db->query("
        SELECT b.*, c.title AS course_title, c.course_code 
        FROM batches b
        LEFT JOIN courses c ON b.course_id = c.id
        ORDER BY b.id ASC
        LIMIT 1
    ");
    $batch = $bStmt->fetch(PDO::FETCH_ASSOC);

    if (!$batch) {
        // Create a default course and batch if none
        $db->exec("
            INSERT INTO courses (id, course_code, title, category, duration_months, total_classes, description)
            VALUES (1, 'GD-101', 'Graphic Design & Multimedia', 'Creative & Design', 3, 36, 'Master Adobe Photoshop, Illustrator, InDesign and branding')
            ON DUPLICATE KEY UPDATE title=title;
        ");
        $db->exec("
            INSERT INTO batches (id, course_id, batch_code, batch_name, schedule_days, schedule_time, start_date, status)
            VALUES (1, 1, 'GD-B12-2026', 'Graphic Design Batch 12 (Evening)', 'Sun, Tue, Thu', '04:00 PM - 06:00 PM', CURDATE(), 'running')
            ON DUPLICATE KEY UPDATE batch_name=batch_name;
        ");
        $bStmt = $db->query("SELECT b.*, c.title AS course_title, c.course_code FROM batches b LEFT JOIN courses c ON b.course_id = c.id WHERE b.id = 1");
        $batch = $bStmt->fetch(PDO::FETCH_ASSOC);
    }

    $batchId = intval($batch['id']);
    $courseId = intval($batch['course_id']);
    $courseName = $batch['course_title'] ?? 'Graphic Design & Multimedia';
    $batchNo = $batch['batch_code'] ?? 'GD-B12-2026';
    $studentCode = 'STU-14-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $batchNo), 0, 6));

    // 4. Check if already enrolled in this batch
    $sChk = $db->prepare("SELECT id FROM students WHERE user_id = :uid AND batch_id = :bid LIMIT 1");
    $sChk->execute([':uid' => $userId, ':bid' => $batchId]);
    $existingStudent = $sChk->fetch(PDO::FETCH_ASSOC);

    if ($existingStudent) {
        $enrollId = $existingStudent['id'];
        echo "✓ User 14 is already enrolled in {$batchNo} (Enrollment ID: {$enrollId})\n";
    } else {
        // Exact schema matching: user_id, student_code, course_id, batch_id, enrollment_date, status, created_at, updated_at
        $insS = $db->prepare("
            INSERT INTO students (
                user_id, student_code, course_id, batch_id,
                enrollment_date, status, created_at, updated_at
            ) VALUES (
                :uid, :code, :cid, :bid,
                CURDATE(), 'active', NOW(), NOW()
            )
        ");
        $insS->execute([
            ':uid' => $userId,
            ':code' => $studentCode,
            ':cid' => $courseId,
            ':bid' => $batchId
        ]);
        $enrollId = $db->lastInsertId();
        echo "✓ Enrolled User 14 into Batch {$batchNo} ({$courseName}) with Student Code: {$studentCode} (Enrollment ID: {$enrollId})\n";
    }

    echo "--- Enrollment Successful! ---\n";
    echo "Summary:\n";
    echo "User ID: $userId\n";
    echo "Student Code: $studentCode\n";
    echo "Course: $courseName\n";
    echo "Batch: $batchNo ({$batch['batch_name']})\n";
    echo "Schedule: {$batch['schedule_days']} at {$batch['schedule_time']}\n";

} catch (PDOException $e) {
    echo "Enrollment failed: " . $e->getMessage() . "\n";
}
?>
