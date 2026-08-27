<?php
// config/cors.php
$allowed_origins = ['https://staff.creativecomputeracademy.com', 'https://admin.creativecomputeracademy.com', 'https://audit.creativecomputeracademy.com', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} // Allow all origins for development (e.g. localhost:5173)
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>