<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Expose-Headers: Content-Disposition");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_GET['file']) || empty($_GET['file'])) {
    http_response_code(400);
    echo json_encode(["error" => "File path is required."]);
    exit;
}

$file_param = $_GET['file']; // e.g. uploads/task_images/task_6a8157a6b8765.webp

// Clean and validate the path to prevent directory traversal vulnerability
$file_param = str_replace(['..', '\\'], ['', '/'], $file_param);

$basename = pathinfo($file_param, PATHINFO_FILENAME); // e.g. task_6a8157a6b8765

// Search in originals directory
$originals_dir = "../../uploads/task_images/originals/";
$pattern = $originals_dir . $basename . ".*";
$matches = glob($pattern);

if ($matches && count($matches) > 0) {
    // Found original file!
    $original_file = $matches[0];
    if (file_exists($original_file)) {
        // Clear output buffer to prevent corrupt downloads
        if (ob_get_level()) ob_end_clean();
        
        $mime = mime_content_type($original_file);
        header('Content-Description: File Transfer');
        header('Content-Type: ' . ($mime ? $mime : 'application/octet-stream'));
        header('Content-Disposition: attachment; filename="' . basename($original_file) . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($original_file));
        readfile($original_file);
        exit;
    }
}

// Fallback: If no original file found, try to download the WebP preview file itself
$preview_file = "../../" . $file_param;
if (file_exists($preview_file)) {
    if (ob_get_level()) ob_end_clean();
    
    header('Content-Description: File Transfer');
    header('Content-Type: image/webp');
    header('Content-Disposition: attachment; filename="' . basename($preview_file) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($preview_file));
    readfile($preview_file);
    exit;
}

http_response_code(404);
echo json_encode(["error" => "File not found."]);
exit;
?>
