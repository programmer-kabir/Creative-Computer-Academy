<?php
require_once '../../config/cors.php';
require_once '../../config/R2Client.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
    exit;
}

$taskId = isset($_POST['task_id']) ? intval($_POST['task_id']) : 0;
$userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;

if (empty($_FILES)) {
    echo json_encode(["status" => "error", "message" => "No files received."]);
    exit;
}

$r2 = new R2Client();
$uploadedFiles = [];
$errors = [];

// Helper to determine file_type
function classifyFileType($ext, $mime) {
    $ext = strtolower($ext);
    $previewExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    $videoExts = ['mp4', 'mov', 'webm', 'avi', 'mkv'];
    $sourceExts = ['psd', 'eps', 'ai', 'indd', 'cdr', 'zip', 'rar', '7z', 'tar', 'gz', 'pdf', 'fig', 'xd', 'sketch', 'docx', 'xlsx', 'pptx'];

    if (in_array($ext, $previewExts)) {
        return 'preview';
    } elseif (in_array($ext, $videoExts)) {
        return 'video';
    } elseif (in_array($ext, $sourceExts)) {
        return 'source';
    }
    return 'other';
}

// Normalize $_FILES into standard array of file items
$fileItems = [];
foreach ($_FILES as $inputKey => $fileData) {
    if (is_array($fileData['name'])) {
        for ($i = 0; $i < count($fileData['name']); $i++) {
            if ($fileData['error'][$i] === UPLOAD_ERR_OK && !empty($fileData['tmp_name'][$i])) {
                $fileItems[] = [
                    'name' => $fileData['name'][$i],
                    'type' => $fileData['type'][$i],
                    'tmp_name' => $fileData['tmp_name'][$i],
                    'size' => $fileData['size'][$i],
                ];
            }
        }
    } else {
        if ($fileData['error'] === UPLOAD_ERR_OK && !empty($fileData['tmp_name'])) {
            $fileItems[] = [
                'name' => $fileData['name'],
                'type' => $fileData['type'],
                'tmp_name' => $fileData['tmp_name'],
                'size' => $fileData['size'],
            ];
        }
    }
}

if (empty($fileItems)) {
    echo json_encode(["status" => "error", "message" => "No valid files were uploaded."]);
    exit;
}

$usedNames = [];

foreach ($fileItems as $file) {
    $originalName = $file['name'];
    $fileSize = $file['size'];
    $fileTmpPath = $file['tmp_name'];
    $fileExt = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    
    // Accurate MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $detectedMime = finfo_file($finfo, $fileTmpPath);
    finfo_close($finfo);
    $mimeType = $detectedMime ?: ($file['type'] ?: 'application/octet-stream');

    $fileType = classifyFileType($fileExt, $mimeType);

    // Clean exact name based on Task ID (e.g. task_submissions/task_190/190.psd and 190.jpg)
    if (!empty($taskId)) {
        if (!isset($usedNames[$fileExt])) {
            $usedNames[$fileExt] = 1;
            $targetFileName = "{$taskId}.{$fileExt}";
        } else {
            $usedNames[$fileExt]++;
            $targetFileName = "{$taskId}_{$usedNames[$fileExt]}.{$fileExt}";
        }
        $r2Key = "task_submissions/task_{$taskId}/{$targetFileName}";
    } else {
        $cleanName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
        $timestamp = time();
        $targetFileName = "{$timestamp}_{$cleanName}.{$fileExt}";
        $r2Key = "task_submissions/{$targetFileName}";
    }

    // Upload to Cloudflare R2
    $uploadRes = $r2->uploadFile($fileTmpPath, $r2Key, $mimeType);

    if ($uploadRes['success']) {
        $uploadedFiles[] = [
            'name' => $originalName,
            'url' => $uploadRes['url'],
            'key' => $r2Key,
            'size' => $fileSize,
            'ext' => $fileExt,
            'mime' => $mimeType,
            'file_type' => $fileType
        ];
    } else {
        $errors[] = "Failed to upload '{$originalName}': " . ($uploadRes['error'] ?? 'Unknown error');
    }
}

if (!empty($uploadedFiles)) {
    echo json_encode([
        "status" => "success",
        "message" => count($uploadedFiles) . " file(s) uploaded successfully to Cloudflare R2.",
        "files" => $uploadedFiles,
        "errors" => $errors
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "All file uploads failed.",
        "errors" => $errors
    ]);
}
?>
