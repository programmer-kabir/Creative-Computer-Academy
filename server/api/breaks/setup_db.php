<?php
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // 1. Add allocated_break_minutes to employees table
    $query1 = "ALTER TABLE employees ADD COLUMN IF NOT EXISTS allocated_break_minutes INT DEFAULT 60";
    $db->exec($query1);
    echo "Column allocated_break_minutes added successfully.\n";

    // 2. Create employee_breaks table
    $query2 = "CREATE TABLE IF NOT EXISTS employee_breaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        break_type VARCHAR(50) NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME DEFAULT NULL,
        duration_minutes INT DEFAULT 0,
        status ENUM('Active', 'Completed') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $db->exec($query2);
    echo "Table employee_breaks created successfully.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
