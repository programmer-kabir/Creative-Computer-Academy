<?php
date_default_timezone_set('Asia/Dhaka');

class Database {
    private $host = "localhost";
    private $db_name = "u647959341_cca_manage_db";
    private $username = "u647959341_cca_admin"; // Default XAMPP username
    private $password = "Cc@dbAmin12";     // Default XAMPP password is empty
    public $conn;
// Cc@dbAmin12
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8mb4");
        } catch(PDOException $exception) {
            echo "Database Connection Error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>
