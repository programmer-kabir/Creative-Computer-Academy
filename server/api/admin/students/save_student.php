<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->name) || !isset($data->email) || !isset($data->course_name)) {
    echo json_encode(["status" => "error", "message" => "Name, Email, and Course Name are required."]);
    exit;
}

try {
    $db->beginTransaction();

    $name = trim($data->name);
    $email = trim($data->email);
    $phone = isset($data->phone) ? trim($data->phone) : '';
    $guardian_phone = isset($data->guardian_phone) ? trim($data->guardian_phone) : '';
    $course_id = !empty($data->course_id) ? intval($data->course_id) : null;
    $batch_id = !empty($data->batch_id) ? intval($data->batch_id) : null;
    $course_name = isset($data->course_name) ? trim($data->course_name) : '';
    $batch_no = isset($data->batch_no) ? trim($data->batch_no) : 'Batch-01';

    // If course_id is provided, fetch title to keep synced
    if ($course_id) {
        $c_chk = $db->prepare("SELECT title FROM courses WHERE id = :cid LIMIT 1");
        $c_chk->execute([':cid' => $course_id]);
        $c_res = $c_chk->fetch(PDO::FETCH_ASSOC);
        if ($c_res) $course_name = $c_res['title'];
    } else if (!empty($course_name)) {
        $c_chk = $db->prepare("SELECT id FROM courses WHERE title = :title OR course_code = :code LIMIT 1");
        $c_chk->execute([':title' => $course_name, ':code' => $course_name]);
        $c_res = $c_chk->fetch(PDO::FETCH_ASSOC);
        if ($c_res) $course_id = intval($c_res['id']);
    }

    // If batch_id is provided, fetch batch_code to keep synced
    if ($batch_id) {
        $b_chk = $db->prepare("SELECT batch_code FROM batches WHERE id = :bid LIMIT 1");
        $b_chk->execute([':bid' => $batch_id]);
        $b_res = $b_chk->fetch(PDO::FETCH_ASSOC);
        if ($b_res) $batch_no = $b_res['batch_code'];
    } else if (!empty($batch_no)) {
        $b_chk = $db->prepare("SELECT id FROM batches WHERE batch_code = :bcode OR batch_name = :bname LIMIT 1");
        $b_chk->execute([':bcode' => $batch_no, ':bname' => $batch_no]);
        $b_res = $b_chk->fetch(PDO::FETCH_ASSOC);
        if ($b_res) $batch_id = intval($b_res['id']);
    }

    $enrollment_date = !empty($data->enrollment_date) ? $data->enrollment_date : date('Y-m-d');
    $student_code = !empty($data->student_code) ? trim($data->student_code) : 'STU-' . strtoupper(substr(uniqid(), -6));
    $password = !empty($data->password) ? password_hash($data->password, PASSWORD_BCRYPT) : password_hash('12345678', PASSWORD_BCRYPT);
    $status = !empty($data->status) ? $data->status : 'active';

    $is_edit = !empty($data->id);

    if ($is_edit) {
        $user_id = intval($data->id);

        // Check if email taken by another user
        $chk = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
        $chk->execute([':email' => $email, ':id' => $user_id]);
        if ($chk->rowCount() > 0) {
            $db->rollBack();
            echo json_encode(["status" => "error", "message" => "Email is already taken by another account."]);
            exit;
        }

        // Update users table
        if (!empty($data->password)) {
            $up_user = $db->prepare("UPDATE users SET name = :name, email = :email, phone = :phone, password = :pass, status = :status WHERE id = :id");
            $up_user->execute([':name' => $name, ':email' => $email, ':phone' => $phone, ':pass' => $password, ':status' => $status, ':id' => $user_id]);
        } else {
            $up_user = $db->prepare("UPDATE users SET name = :name, email = :email, phone = :phone, status = :status WHERE id = :id");
            $up_user->execute([':name' => $name, ':email' => $email, ':phone' => $phone, ':status' => $status, ':id' => $user_id]);
        }

        $now_bd = date('Y-m-d H:i:s');

        // Update or insert students table
        $chk_stu = $db->prepare("SELECT id FROM students WHERE user_id = :user_id");
        $chk_stu->execute([':user_id' => $user_id]);
        if ($chk_stu->rowCount() > 0) {
            $up_stu = $db->prepare("
                UPDATE students 
                SET student_code = :code, course_id = :course_id, batch_id = :batch_id, guardian_phone = :gphone, enrollment_date = :edate, status = :status, updated_at = :up_time 
                WHERE user_id = :user_id
            ");
            $up_stu->execute([
                ':code' => $student_code,
                ':course_id' => $course_id,
                ':batch_id' => $batch_id,
                ':gphone' => $guardian_phone,
                ':edate' => $enrollment_date,
                ':status' => $status,
                ':up_time' => $now_bd,
                ':user_id' => $user_id
            ]);
        } else {
            $ins_stu = $db->prepare("
                INSERT INTO students (user_id, student_code, course_id, batch_id, guardian_phone, enrollment_date, status, created_at, updated_at) 
                VALUES (:user_id, :code, :course_id, :batch_id, :gphone, :edate, :status, :cr_time, :up_time)
            ");
            $ins_stu->execute([
                ':user_id' => $user_id,
                ':code' => $student_code,
                ':course_id' => $course_id,
                ':batch_id' => $batch_id,
                ':gphone' => $guardian_phone,
                ':edate' => $enrollment_date,
                ':status' => $status,
                ':cr_time' => $now_bd,
                ':up_time' => $now_bd
            ]);
        }

        $db->commit();
        echo json_encode(["status" => "success", "message" => "Student updated successfully."]);
    } else {
        $now_bd = date('Y-m-d H:i:s');

        // Create new student
        $chk = $db->prepare("SELECT id FROM users WHERE email = :email");
        $chk->execute([':email' => $email]);
        if ($chk->rowCount() > 0) {
            $db->rollBack();
            echo json_encode(["status" => "error", "message" => "A user with this email already exists."]);
            exit;
        }

        // Insert into users
        $ins_user = $db->prepare("INSERT INTO users (name, email, phone, password, status, created_at, updated_at) VALUES (:name, :email, :phone, :password, :status, :cr_time, :up_time)");
        $ins_user->execute([
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone,
            ':password' => $password,
            ':status' => $status,
            ':cr_time' => $now_bd,
            ':up_time' => $now_bd
        ]);
        $user_id = $db->lastInsertId();

        // Insert into user_roles
        $ins_role = $db->prepare("INSERT INTO user_roles (user_id, role) VALUES (:user_id, 'student')");
        $ins_role->execute([':user_id' => $user_id]);

        // Insert into students table
        $ins_stu = $db->prepare("
            INSERT INTO students (user_id, student_code, course_id, batch_id, guardian_phone, enrollment_date, status, created_at, updated_at) 
            VALUES (:user_id, :code, :course_id, :batch_id, :gphone, :edate, :status, :cr_time, :up_time)
        ");
        $ins_stu->execute([
            ':user_id' => $user_id,
            ':code' => $student_code,
            ':course_id' => $course_id,
            ':batch_id' => $batch_id,
            ':gphone' => $guardian_phone,
            ':edate' => $enrollment_date,
            ':status' => $status,
            ':cr_time' => $now_bd,
            ':up_time' => $now_bd
        ]);

        $db->commit();
        echo json_encode(["status" => "success", "message" => "Student registered successfully.", "user_id" => $user_id]);
    }
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
