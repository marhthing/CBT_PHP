<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireAuth(); // Any authenticated user can access lookups

    $database = new Database();
    $conn = $database->getConnection();

    $lookup_type = $_GET['type'] ?? '';

    switch ($lookup_type) {
        case 'terms':
            $stmt = $conn->prepare("SELECT id, name, display_order FROM terms WHERE is_active = true ORDER BY display_order");
            $stmt->execute();
            $data = $stmt->fetchAll();
            break;

        case 'sessions':
            $stmt = $conn->prepare("SELECT id, name, start_date, end_date, is_current FROM sessions WHERE is_active = true ORDER BY name DESC");
            $stmt->execute();
            $data = $stmt->fetchAll();
            break;

        case 'subjects':
            $stmt = $conn->prepare("SELECT id, name, code, description FROM subjects WHERE is_active = true ORDER BY name");
            $stmt->execute();
            $data = $stmt->fetchAll();
            break;

        case 'class_levels':
            // Common class levels for secondary schools
            $data = [
                ['id' => 'JSS1', 'name' => 'JSS 1'],
                ['id' => 'JSS2', 'name' => 'JSS 2'],
                ['id' => 'JSS3', 'name' => 'JSS 3'],
                ['id' => 'SS1', 'name' => 'SS 1'],
                ['id' => 'SS2', 'name' => 'SS 2'],
                ['id' => 'SS3', 'name' => 'SS 3']
            ];
            break;

        case 'difficulties':
            $data = [
                ['id' => 'easy', 'name' => 'Easy'],
                ['id' => 'medium', 'name' => 'Medium'],
                ['id' => 'hard', 'name' => 'Hard']
            ];
            break;

        default:
            Response::validationError('Invalid lookup type. Supported types: terms, sessions, subjects, class_levels, difficulties');
    }

    Response::success("$lookup_type retrieved successfully", $data);

} catch (Exception $e) {
    error_log("Lookup error: " . $e->getMessage());
    Response::serverError('Failed to retrieve lookup data');
}

?>