<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    // Lookup data is public - no authentication required
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
            // Use existing classes table structure
            $stmt = $conn->prepare("SELECT id, classes as name, classes as display_name FROM classes ORDER BY id");
            $stmt->execute();
            $data = $stmt->fetchAll();
            // Add level_type based on class name for compatibility
            foreach ($data as &$row) {
                $class_name = strtoupper($row['name']);
                $row['level_type'] = (strpos($class_name, 'JSS') === 0 || strpos($class_name, 'JS') === 0) ? 'junior' : 'senior';
                $row['display_order'] = $row['id'];
                $row['id'] = $row['name']; // Use classes name as id for compatibility
            }
            break;

        case 'difficulties':
            $data = [
                ['id' => 'easy', 'name' => 'Easy'],
                ['id' => 'medium', 'name' => 'Medium'],
                ['id' => 'hard', 'name' => 'Hard']
            ];
            break;

        default:
            // Return all lookup data if no type specified
            $data = [];
            
            // Get subjects
            $stmt = $conn->prepare("SELECT id, name, code, description FROM subjects WHERE is_active = true ORDER BY name");
            $stmt->execute();
            $data['subjects'] = $stmt->fetchAll();
            
            // Get terms
            $stmt = $conn->prepare("SELECT id, name, display_order FROM terms WHERE is_active = true ORDER BY display_order");
            $stmt->execute();
            $data['terms'] = $stmt->fetchAll();
            
            // Get sessions
            $stmt = $conn->prepare("SELECT id, name, start_date, end_date, is_current FROM sessions WHERE is_active = true ORDER BY name DESC");
            $stmt->execute();
            $data['sessions'] = $stmt->fetchAll();
            
            // Get class levels using existing classes table
            $stmt = $conn->prepare("SELECT id, classes as name, classes as display_name FROM classes ORDER BY id");
            $stmt->execute();
            $class_data = $stmt->fetchAll();
            // Add level_type based on class name for compatibility
            foreach ($class_data as &$row) {
                $class_name = strtoupper($row['name']);
                $row['level_type'] = (strpos($class_name, 'JSS') === 0 || strpos($class_name, 'JS') === 0) ? 'junior' : 'senior';
                $row['display_order'] = $row['id'];
                $row['id'] = $row['name']; // Use classes name as id for compatibility
            }
            $data['class_levels'] = $class_data;
            break;
    }

    Response::success("$lookup_type retrieved successfully", $data);

} catch (Exception $e) {
    Response::serverError('Failed to retrieve lookup data');
}

?>