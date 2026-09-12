<?php
require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        die("Could not connect to database.\n");
    }

    // 1. Create attendance_device_logs table
    $queryDeviceLogs = "CREATE TABLE IF NOT EXISTS `attendance_device_logs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `attendance_id` INT NOT NULL,
        `user_id` INT NOT NULL,
        `punch_type` ENUM('check_in', 'check_out') NOT NULL,
        `timestamp` DATETIME NOT NULL,
        
        -- Network Info
        `ip_address` VARCHAR(45) NOT NULL,
        `network_type` VARCHAR(30) DEFAULT 'unknown',
        `isp_name` VARCHAR(100) DEFAULT NULL,
        
        -- Device Specifications
        `device_type` VARCHAR(20) DEFAULT 'Desktop',
        `device_brand` VARCHAR(50) DEFAULT NULL,
        `device_model` VARCHAR(100) DEFAULT NULL,
        `os_name` VARCHAR(50) DEFAULT NULL,
        `browser_name` VARCHAR(50) DEFAULT NULL,
        `screen_res` VARCHAR(30) DEFAULT NULL,
        `device_fingerprint` VARCHAR(64) NOT NULL,
        
        -- Geolocation & Distance
        `latitude` DECIMAL(10, 8) DEFAULT NULL,
        `longitude` DECIMAL(11, 8) DEFAULT NULL,
        `accuracy_meters` FLOAT DEFAULT NULL,
        `distance_meters` FLOAT DEFAULT NULL,
        `is_within_geofence` TINYINT(1) DEFAULT 1,
        
        -- Security Scoring
        `trust_score` INT DEFAULT 100,
        `fraud_flags` TEXT DEFAULT NULL,
        `verification_status` ENUM('verified', 'flagged', 'rejected') DEFAULT 'verified',
        
        INDEX (`attendance_id`),
        INDEX (`user_id`),
        INDEX (`device_fingerprint`),
        INDEX (`timestamp`),
        INDEX (`verification_status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $db->exec($queryDeviceLogs);
    echo "✓ Table 'attendance_device_logs' created or verified successfully.\n";

    // 2. Ensure system_settings table exists and seed default attendance & geofence settings
    $querySettingsTable = "CREATE TABLE IF NOT EXISTS `system_settings` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `setting_key` VARCHAR(100) NOT NULL UNIQUE,
        `setting_value` TEXT NOT NULL,
        `description` VARCHAR(255) DEFAULT NULL,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $db->exec($querySettingsTable);
    echo "✓ Table 'system_settings' verified.\n";

    $defaultSettings = [
        'office_latitude' => ['23.81033100', 'Office GPS Latitude coordinate'],
        'office_longitude' => ['90.41252100', 'Office GPS Longitude coordinate'],
        'office_geofence_radius_meters' => ['50', 'Allowed radius in meters for office attendance'],
        'attendance_security_mode' => ['audit_flag', 'Security mode: audit_flag (allow & flag) or strict_block (block if outside)'],
        'office_allowed_ips' => ['127.0.0.1,::1,182.48.76.182', 'Comma-separated list of allowed office public IPs or subnets']
    ];

    $insertSettingStmt = $db->prepare("
        INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
        VALUES (:key, :val, :desc, NOW())
        ON DUPLICATE KEY UPDATE description = VALUES(description)
    ");

    foreach ($defaultSettings as $key => [$val, $desc]) {
        $insertSettingStmt->execute([
            ':key' => $key,
            ':val' => $val,
            ':desc' => $desc
        ]);
    }
    echo "✓ Default attendance security settings seeded/verified in system_settings.\n";
    echo "Migration completed successfully!\n";

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
