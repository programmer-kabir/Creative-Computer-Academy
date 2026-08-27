<?php
require_once '../../config/cors.php';

if (!isset($_GET['url']) && !isset($_GET['file'])) {
    http_response_code(400);
    echo json_encode(["error" => "File URL or path is required."]);
    exit;
}

$file_url = trim($_GET['url'] ?? $_GET['file']);
$custom_filename = trim($_GET['filename'] ?? '');

if (empty($file_url)) {
    http_response_code(400);
    echo json_encode(["error" => "Empty file parameter."]);
    exit;
}

// 1. If it's a relative path on local server
if (!preg_match('/^https?:\/\//i', $file_url)) {
    $clean_path = str_replace(['..', '\\'], ['', '/'], $file_url);
    $local_path = __DIR__ . '/../../' . ltrim($clean_path, '/');
    
    if (file_exists($local_path) && is_file($local_path)) {
        if (ob_get_level()) ob_end_clean();
        
        $filename = $custom_filename ?: basename($local_path);
        $mime = mime_content_type($local_path) ?: 'application/octet-stream';
        
        header('Content-Description: File Transfer');
        header('Content-Type: ' . $mime);
        header('Content-Disposition: attachment; filename="' . str_replace('"', '', $filename) . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . filesize($local_path));
        readfile($local_path);
        exit;
    }
}

// 2. If it's a remote URL (e.g. Cloudflare R2 or CDN)
$filename = $custom_filename;
if (empty($filename)) {
    $path = parse_url($file_url, PHP_URL_PATH);
    $filename = $path ? basename($path) : 'download_file';
}

// Fetch remote content using cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $file_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
$content = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300 && $content !== false) {
    if (ob_get_level()) ob_end_clean();
    
    header('Content-Description: File Transfer');
    header('Content-Type: ' . ($contentType ?: 'application/octet-stream'));
    header('Content-Disposition: attachment; filename="' . str_replace('"', '', $filename) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    header('Content-Length: ' . strlen($content));
    echo $content;
    exit;
}

// Fallback: Redirect if direct proxy failed
header("Location: " . $file_url);
exit;
?>
