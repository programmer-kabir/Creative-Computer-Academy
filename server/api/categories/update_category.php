<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'category_helper.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || empty($data->id)) {
    echo json_encode(["status" => "error", "message" => "Category ID is required."]);
    exit;
}

try {
    $id = (int)$data->id;
    $name = isset($data->name) ? trim($data->name) : null;
    $icon = isset($data->icon) ? trim($data->icon) : null;
    $color = isset($data->color) ? trim($data->color) : null;
    $status = isset($data->status) ? trim($data->status) : 'active';
    $estimated_minutes = isset($data->estimated_minutes) ? (int)$data->estimated_minutes : null;

    $checklists = null;
    if (isset($data->checklists) && is_array($data->checklists)) {
        $checklists = json_encode(array_values(array_filter($data->checklists)), JSON_UNESCAPED_UNICODE);
    }

    $specs = null;
    if (isset($data->specs) && is_array($data->specs)) {
        $specs = json_encode($data->specs, JSON_UNESCAPED_UNICODE);
    }

    $query = "UPDATE task_categories SET 
                name = COALESCE(:name, name),
                icon = COALESCE(:icon, icon),
                color = COALESCE(:color, color),
                status = :status,
                default_checklists = CASE WHEN :has_checklists = 1 THEN :checklists ELSE default_checklists END,
                default_specs = CASE WHEN :has_specs = 1 THEN :specs ELSE default_specs END,
                estimated_minutes = COALESCE(:est_min, estimated_minutes),
                updated_at = NOW()
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':name' => $name,
        ':icon' => $icon,
        ':color' => $color,
        ':status' => $status,
        ':has_checklists' => isset($data->checklists) ? 1 : 0,
        ':checklists' => $checklists,
        ':has_specs' => isset($data->specs) ? 1 : 0,
        ':specs' => $specs,
        ':est_min' => $estimated_minutes,
        ':id' => $id
    ]);

    echo json_encode(["status" => "success", "message" => "Category updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
