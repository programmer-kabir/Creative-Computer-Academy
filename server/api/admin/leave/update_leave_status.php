<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../../config/database.php';
require_once '../../notifications/notification_helper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->leave_id) || !isset($data->status)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit;
}

try {
    // Attempt to update status and admin_comment
    // Using try-catch because if admin_comment column doesn't exist it will throw error
    $query = "UPDATE leave_requests SET status = :status, admin_comment = :admin_comment WHERE id = :id";
    $stmt = $db->prepare($query);
    
    $admin_comment = isset($data->admin_comment) ? $data->admin_comment : '';
    
    $stmt->bindParam(":status", $data->status);
    $stmt->bindParam(":admin_comment", $admin_comment);
    $stmt->bindParam(":id", $data->leave_id);
    
    if($stmt->execute()) {
        
        // Try to trigger Pusher notification
        try {
            // Get user_id for this leave to send targeted notification
            $u_query = "SELECT user_id FROM leave_requests WHERE id = :id";
            $u_stmt = $db->prepare($u_query);
            $u_stmt->bindParam(":id", $data->leave_id);
            $u_stmt->execute();
            if($row = $u_stmt->fetch(PDO::FETCH_ASSOC)) {
                $user_id = $row['user_id'];
                
                $title = "Leave " . $data->status;
                $message = "Your leave request has been " . strtolower($data->status) . ".";
                if (!empty($admin_comment)) {
                    $message .= " Reason: " . $admin_comment;
                }

                // Send notification (DB insert + Pusher trigger)
                NotificationHelper::sendToUser($db, $user_id, null, $title, $message, 'leave', 'staff', '/leave');
            }
        } catch (Exception $e) {
            // ignore notification errors
        }

        echo json_encode(["status" => "success"]);
    } else {
        // Fallback: If admin_comment doesn't exist in DB, just update status
        $query2 = "UPDATE leave_requests SET status = :status WHERE id = :id";
        $stmt2 = $db->prepare($query2);
        $stmt2->bindParam(":status", $data->status);
        $stmt2->bindParam(":id", $data->leave_id);
        
        if($stmt2->execute()) {
             echo json_encode(["status" => "success"]);
        } else {
             echo json_encode(["status" => "error", "message" => "Failed to update leave status"]);
        }
    }
} catch (Exception $e) {
    // Fallback if the first query failed due to column not found
    try {
        $query3 = "UPDATE leave_requests SET status = :status WHERE id = :id";
        $stmt3 = $db->prepare($query3);
        $stmt3->bindParam(":status", $data->status);
        $stmt3->bindParam(":id", $data->leave_id);
        
        if($stmt3->execute()) {
             echo json_encode(["status" => "success", "note" => "Updated status but admin_comment column might be missing."]);
        } else {
             echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    } catch(Exception $ex) {
        echo json_encode(["status" => "error", "message" => $ex->getMessage()]);
    }
}
?>
