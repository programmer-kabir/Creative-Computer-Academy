<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
if (file_exists('../../config/R2Client.php')) {
    require_once '../../config/R2Client.php';
}

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Auto-ensure task_final_deliveries table exists
$createTableQuery = "CREATE TABLE IF NOT EXISTS `task_final_deliveries` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `task_id` INT NOT NULL UNIQUE,
    `reviewer_id` INT NOT NULL,
    `final_file_url` TEXT NOT NULL,
    `final_image_url` TEXT DEFAULT NULL,
    `fix_notes` TEXT DEFAULT NULL,
    `is_stock_ready` TINYINT(1) DEFAULT 1,
    `source_type` ENUM('reviewer_corrected', 'staff_verified') DEFAULT 'reviewer_corrected',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (`task_id`),
    INDEX (`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

try {
    $db->exec($createTableQuery);
} catch (Exception $e) {
    error_log("Failed to create task_final_deliveries table: " . $e->getMessage());
}

$task_id = isset($_POST['task_id']) ? intval($_POST['task_id']) : null;
$reviewer_id = isset($_POST['reviewer_id']) ? intval($_POST['reviewer_id']) : null;
$fix_notes = isset($_POST['fix_notes']) ? trim($_POST['fix_notes']) : null;
$final_file_link = isset($_POST['final_file_link']) ? trim($_POST['final_file_link']) : null;
$final_image_link = isset($_POST['final_image_link']) ? trim($_POST['final_image_link']) : null;
$source_type = isset($_POST['source_type']) ? $_POST['source_type'] : 'reviewer_corrected';

if (!$task_id || !$reviewer_id) {
    echo json_encode(["status" => "error", "message" => "task_id and reviewer_id are required."]);
    exit();
}

// Check task exists
$stmt = $db->prepare("SELECT id, title, status FROM tasks WHERE id = :id");
$stmt->execute([':id' => $task_id]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$task) {
    echo json_encode(["status" => "error", "message" => "Task not found."]);
    exit();
}

$r2 = class_exists('R2Client') ? new R2Client() : null;

$final_file_url = $final_file_link;
$final_image_url = $final_image_link;

// 1. Upload Final Source File to Cloud (e.g. task_submissions/task_14/14_update.psd)
if (isset($_FILES['final_file'])) {
    if ($_FILES['final_file']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['final_file']['tmp_name'];
        $originalFileName = $_FILES['final_file']['name'];
        $fileExt = strtolower(pathinfo($originalFileName, PATHINFO_EXTENSION));

        $targetFileName = "{$task_id}_update.{$fileExt}";
        $r2Key = "task_submissions/task_{$task_id}/{$targetFileName}";

        // MIME detection
        $mimeType = 'application/octet-stream';
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $fileTmpPath) ?: $mimeType;
            finfo_close($finfo);
        }

        $uploadedToCloud = false;
        if ($r2) {
            $uploadRes = $r2->uploadFile($fileTmpPath, $r2Key, $mimeType);
            if ($uploadRes && !empty($uploadRes['success'])) {
                $final_file_url = $uploadRes['url'] ?? $uploadRes['public_url'] ?? $r2->getPublicUrl($r2Key);
                $uploadedToCloud = true;
            }
        }

        // Local fallback if R2 not configured
        if (!$uploadedToCloud) {
            $localDir = '../../uploads/reviewer_finals/';
            if (!file_exists($localDir)) {
                mkdir($localDir, 0777, true);
            }
            $destPath = $localDir . $targetFileName;
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                $final_file_url = "uploads/reviewer_finals/" . $targetFileName;
            }
        }
    } elseif ($_FILES['final_file']['error'] !== UPLOAD_ERR_NO_FILE) {
        $errCode = $_FILES['final_file']['error'];
        $errMsg = "File upload failed (error code $errCode).";
        if ($errCode === UPLOAD_ERR_INI_SIZE || $errCode === UPLOAD_ERR_FORM_SIZE) {
            $errMsg = "ফাইল সাইজ সার্ভার লিমিটের চেয়ে বড়। অনুগ্রহ করে ড্রাইভ লিংক দিন অথবা ফাইল সাইজ কমান।";
        }
        echo json_encode(["status" => "error", "message" => $errMsg]);
        exit();
    }
}

// 2. Upload Final Preview Image to Cloud (e.g. task_submissions/task_14/14_update.jpg)
if (isset($_FILES['final_image']) && $_FILES['final_image']['error'] === UPLOAD_ERR_OK) {
    $imgTmpPath = $_FILES['final_image']['tmp_name'];
    $imgName = $_FILES['final_image']['name'];
    $imgExt = strtolower(pathinfo($imgName, PATHINFO_EXTENSION)) ?: 'jpg';

    $targetImgName = "{$task_id}_update.{$imgExt}";
    $r2ImgKey = "task_submissions/task_{$task_id}/{$targetImgName}";

    $mimeType = 'image/jpeg';
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $imgTmpPath) ?: $mimeType;
        finfo_close($finfo);
    }

    $uploadedImgToCloud = false;
    if ($r2) {
        $uploadImgRes = $r2->uploadFile($imgTmpPath, $r2ImgKey, $mimeType);
        if ($uploadImgRes && !empty($uploadImgRes['success'])) {
            $final_image_url = $uploadImgRes['url'] ?? $uploadImgRes['public_url'] ?? $r2->getPublicUrl($r2ImgKey);
            $uploadedImgToCloud = true;
        }
    }

    // Local fallback
    if (!$uploadedImgToCloud) {
        $localDir = '../../uploads/reviewer_finals/';
        if (!file_exists($localDir)) {
            mkdir($localDir, 0777, true);
        }
        $destImgPath = $localDir . $targetImgName;
        if (move_uploaded_file($imgTmpPath, $destImgPath)) {
            $final_image_url = "uploads/reviewer_finals/" . $targetImgName;
        }
    }
}

if (empty($final_file_url) && empty($final_image_url)) {
    echo json_encode(["status" => "error", "message" => "Please provide a final file (upload or link) or preview image."]);
    exit();
}

try {
    $db->beginTransaction();

    // 1. Insert or Update task_final_deliveries
    $deliveryQuery = "INSERT INTO task_final_deliveries 
        (task_id, reviewer_id, final_file_url, final_image_url, fix_notes, is_stock_ready, source_type)
        VALUES (:task_id, :reviewer_id, :final_file_url, :final_image_url, :fix_notes, 1, :source_type)
        ON DUPLICATE KEY UPDATE 
            reviewer_id = VALUES(reviewer_id),
            final_file_url = VALUES(final_file_url),
            final_image_url = VALUES(final_image_url),
            fix_notes = VALUES(fix_notes),
            is_stock_ready = 1,
            source_type = VALUES(source_type),
            updated_at = NOW()";

    $delStmt = $db->prepare($deliveryQuery);
    $delStmt->execute([
        ':task_id' => $task_id,
        ':reviewer_id' => $reviewer_id,
        ':final_file_url' => $final_file_url ?? '',
        ':final_image_url' => $final_image_url,
        ':fix_notes' => $fix_notes,
        ':source_type' => $source_type
    ]);

    // 2. Mark task as Completed
    $taskUpdateQuery = "UPDATE tasks 
        SET status = 'Completed',
            reviewed_by = :reviewer_id,
            reviewed_at = NOW(),
            rejected_by = NULL,
            rejected_at = NULL,
            rejection_reason = NULL
        WHERE id = :task_id";

    $taskStmt = $db->prepare($taskUpdateQuery);
    $taskStmt->execute([
        ':reviewer_id' => $reviewer_id,
        ':task_id' => $task_id
    ]);

    // 3. Save Rating / Review to task_reviews if provided
    $rating = isset($_POST['rating']) ? intval($_POST['rating']) : null;
    $feedback_notes = isset($_POST['feedback_notes']) ? trim($_POST['feedback_notes']) : $fix_notes;
    $tags_val = null;
    if (isset($_POST['tags'])) {
        $tags_val = is_array($_POST['tags']) ? json_encode($_POST['tags']) : (is_string($_POST['tags']) ? $_POST['tags'] : null);
    }

    if ($rating !== null && $rating > 0) {
        try {
            // Find staff user_id
            $stf_stmt = $db->prepare("SELECT e.user_id FROM tasks t JOIN employees e ON t.assigned_to = e.id WHERE t.id = :id");
            $stf_stmt->execute([':id' => $task_id]);
            $staff_uid = $stf_stmt->fetchColumn() ?: null;

            $rev_stmt = $db->prepare("INSERT INTO task_reviews (task_id, reviewer_id, staff_user_id, rating, feedback_notes, tags, created_at) 
                VALUES (:task_id, :reviewer_id, :staff_user_id, :rating, :feedback_notes, :tags, NOW())
                ON DUPLICATE KEY UPDATE rating = VALUES(rating), feedback_notes = VALUES(feedback_notes), tags = VALUES(tags), updated_at = NOW()");
            $rev_stmt->execute([
                ':task_id' => $task_id,
                ':reviewer_id' => $reviewer_id,
                ':staff_user_id' => $staff_uid,
                ':rating' => $rating,
                ':feedback_notes' => $feedback_notes,
                ':tags' => $tags_val
            ]);
        } catch (Exception $ex) {
            error_log("Failed to insert task review in submit_final_delivery: " . $ex->getMessage());
        }
    }

    // 4. Log History Safely
    $reviewerNameStmt = $db->prepare("SELECT name FROM users WHERE id = :id");
    $reviewerNameStmt->execute([':id' => $reviewer_id]);
    $reviewerName = $reviewerNameStmt->fetchColumn() ?: 'Reviewer';

    $actionLog = ($source_type === 'reviewer_corrected')
        ? "Reviewer uploaded corrected final stock version & approved task" . ($rating > 0 ? " ({$rating} Stars)" : "")
        : "Reviewer approved task as-is" . ($rating > 0 ? " ({$rating} Stars)" : "");

    try {
        $histQuery = "INSERT INTO task_history (task_id, action, changed_by, created_at) VALUES (:task_id, :action, :changed_by, NOW())";
        $histStmt = $db->prepare($histQuery);
        $histStmt->execute([
            ':task_id' => $task_id,
            ':action' => $actionLog,
            ':changed_by' => $reviewerName
        ]);
    } catch (Exception $e) {
        error_log("Task history log error: " . $e->getMessage());
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Final stock delivery saved to Cloud and task approved successfully!",
        "delivery" => [
            "task_id" => $task_id,
            "final_file_url" => $final_file_url,
            "final_image_url" => $final_image_url,
            "fix_notes" => $fix_notes,
            "rating" => $rating,
            "source_type" => $source_type
        ]
    ]);
} catch (Exception $e) {
    $db->rollBack();
    error_log("Error saving final delivery: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Failed to save final delivery: " . $e->getMessage()]);
}
?>
