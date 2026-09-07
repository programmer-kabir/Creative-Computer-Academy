<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->course_id) || empty($data->batch_name)) {
    echo json_encode(["status" => "error", "message" => "Course ID and Batch Name are required."]);
    exit;
}

try {
    $course_id = intval($data->course_id);
    $batch_code = !empty($data->batch_code) ? strtoupper(trim($data->batch_code)) : 'BATCH-' . strtoupper(substr(uniqid(), -5));
    $batch_name = trim($data->batch_name);
    $lead_instructor_id = !empty($data->lead_instructor_id) ? intval($data->lead_instructor_id) : null;
    $assistant_instructor_id = !empty($data->assistant_instructor_id) ? intval($data->assistant_instructor_id) : null;
    $lab_room = !empty($data->lab_room) ? trim($data->lab_room) : 'Main Computer Lab';
    $schedule_days = !empty($data->schedule_days) ? trim($data->schedule_days) : 'Sun, Tue, Thu';
    $schedule_time = !empty($data->schedule_time) ? trim($data->schedule_time) : '10:00 AM - 12:00 PM';
    $max_capacity = !empty($data->max_capacity) ? intval($data->max_capacity) : 25;
    $start_date = !empty($data->start_date) ? $data->start_date : date('Y-m-d');
    $expected_end_date = !empty($data->expected_end_date) ? $data->expected_end_date : null;
    $status = !empty($data->status) ? $data->status : 'enrolling';

    $now_bd = date('Y-m-d H:i:s');

    if (!empty($data->id)) {
        $id = intval($data->id);
        $stmt = $db->prepare("
            UPDATE batches SET
                course_id = :cid,
                batch_code = :bcode,
                batch_name = :bname,
                lead_instructor_id = :lead,
                assistant_instructor_id = :ast,
                lab_room = :lab,
                schedule_days = :days,
                schedule_time = :time,
                max_capacity = :cap,
                start_date = :sdate,
                expected_end_date = :edate,
                status = :status,
                updated_at = :up_time
            WHERE id = :id
        ");
        $stmt->execute([
            ':cid' => $course_id,
            ':bcode' => $batch_code,
            ':bname' => $batch_name,
            ':lead' => $lead_instructor_id,
            ':ast' => $assistant_instructor_id,
            ':lab' => $lab_room,
            ':days' => $schedule_days,
            ':time' => $schedule_time,
            ':cap' => $max_capacity,
            ':sdate' => $start_date,
            ':edate' => $expected_end_date,
            ':status' => $status,
            ':up_time' => $now_bd,
            ':id' => $id
        ]);

        echo json_encode(["status" => "success", "message" => "Batch updated successfully."]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO batches (
                course_id, batch_code, batch_name, lead_instructor_id, assistant_instructor_id,
                lab_room, schedule_days, schedule_time, max_capacity, start_date, expected_end_date, status,
                created_at, updated_at
            ) VALUES (
                :cid, :bcode, :bname, :lead, :ast,
                :lab, :days, :time, :cap, :sdate, :edate, :status,
                :cr_time, :up_time
            )
        ");
        $stmt->execute([
            ':cid' => $course_id,
            ':bcode' => $batch_code,
            ':bname' => $batch_name,
            ':lead' => $lead_instructor_id,
            ':ast' => $assistant_instructor_id,
            ':lab' => $lab_room,
            ':days' => $schedule_days,
            ':time' => $schedule_time,
            ':cap' => $max_capacity,
            ':sdate' => $start_date,
            ':edate' => $expected_end_date,
            ':status' => $status,
            ':cr_time' => $now_bd,
            ':up_time' => $now_bd
        ]);

        $newBatchId = $db->lastInsertId();

        // Auto initialize batch module progress for all modules of this course
        $modStmt = $db->prepare("SELECT id FROM course_modules WHERE course_id = :cid ORDER BY module_no ASC");
        $modStmt->execute([':cid' => $course_id]);
        $first = true;
        while ($mod = $modStmt->fetch(PDO::FETCH_ASSOC)) {
            $insProg = $db->prepare("INSERT INTO batch_module_progress (batch_id, module_id, is_unlocked) VALUES (:bid, :mid, :unlocked)");
            $insProg->execute([
                ':bid' => $newBatchId,
                ':mid' => $mod['id'],
                ':unlocked' => $first ? 1 : 0
            ]);
            $first = false;
        }

        echo json_encode(["status" => "success", "message" => "Batch created successfully.", "id" => $newBatchId]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
