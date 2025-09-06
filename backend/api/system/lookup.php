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
    // Get direct database connection for performance
    $database = new Database();
    $pdo = $database->getConnection();
    
    $lookup_type = $_GET['type'] ?? '';

    switch ($lookup_type) {
        case 'terms':
            $stmt = $pdo->prepare("SELECT id, name, display_order FROM terms WHERE is_active = true ORDER BY display_order");
            $stmt->execute();
            $formatted_data = $stmt->fetchAll();
            Response::success("Terms retrieved successfully", $formatted_data);
            break;

        case 'sessions':
            $stmt = $pdo->prepare("SELECT id, name, start_date, end_date, is_current FROM sessions WHERE is_active = true ORDER BY start_date DESC");
            $stmt->execute();
            $formatted_data = $stmt->fetchAll();
            Response::success("Sessions retrieved successfully", $formatted_data);
            break;

        case 'subjects':
            $stmt = $pdo->prepare("SELECT id, name, code, description FROM subjects WHERE is_active = true ORDER BY name");
            $stmt->execute();
            $formatted_data = $stmt->fetchAll();
            Response::success("Subjects retrieved successfully", $formatted_data);
            break;

        case 'class_levels':
            $stmt = $pdo->prepare("SELECT name as id, display_name as name, level_type, display_order FROM class_levels WHERE is_active = true ORDER BY display_order");
            $stmt->execute();
            $formatted_data = $stmt->fetchAll();
            Response::success("Class levels retrieved successfully", $formatted_data);
            break;

        case 'assignments':
            $formatted_data = [
                ['id' => 'First CA', 'name' => 'First Continuous Assessment', 'code' => 'CA1', 'order' => 1],
                ['id' => 'Second CA', 'name' => 'Second Continuous Assessment', 'code' => 'CA2', 'order' => 2],
                ['id' => 'Examination', 'name' => 'Examination', 'code' => 'EXAM', 'order' => 3]
            ];
            Response::success("Assignments retrieved successfully", $formatted_data);
            break;

        case 'difficulties':
            require_once __DIR__ . '/../../services/ConstantsService.php';
            $constants = ConstantsService::getInstance();
            $formatted_data = $constants->getDifficultyLevels();
            Response::success("Difficulties retrieved successfully", $formatted_data);
            break;

        case 'grading_scale':
            require_once __DIR__ . '/../../services/ConstantsService.php';
            $constants = ConstantsService::getInstance();
            $formatted_data = [];
            
            // Get grading scale from constants and add color mappings
            $grading_scale = [
                ['min' => 90, 'grade' => 'A', 'color' => ['bg' => '#dcfce7', 'text' => '#166534']],
                ['min' => 80, 'grade' => 'B', 'color' => ['bg' => '#dcfce7', 'text' => '#166534']],
                ['min' => 70, 'grade' => 'C', 'color' => ['bg' => '#fef3c7', 'text' => '#92400e']],
                ['min' => 60, 'grade' => 'D', 'color' => ['bg' => '#dbeafe', 'text' => '#1e40af']],
                ['min' => 0,  'grade' => 'F', 'color' => ['bg' => '#fef2f2', 'text' => '#dc2626']]
            ];
            
            Response::success("Grading scale retrieved successfully", $grading_scale);
            break;

        default:
            // Return all lookup data if no type specified - using direct queries for performance
            $lookup_data = [
                'subjects' => [],
                'terms' => [],
                'sessions' => [],
                'class_levels' => [],
                'assignments' => []
            ];
            
            // Get subjects directly
            $stmt = $pdo->prepare("SELECT id, name, code, description FROM subjects WHERE is_active = true ORDER BY name");
            $stmt->execute();
            $lookup_data['subjects'] = $stmt->fetchAll();
            
            // Get terms directly
            $stmt = $pdo->prepare("SELECT id, name, display_order FROM terms WHERE is_active = true ORDER BY display_order");
            $stmt->execute();
            $lookup_data['terms'] = $stmt->fetchAll();
            
            // Get sessions directly
            $stmt = $pdo->prepare("SELECT id, name, start_date, end_date, is_current FROM sessions WHERE is_active = true ORDER BY start_date DESC");
            $stmt->execute();
            $lookup_data['sessions'] = $stmt->fetchAll();
            
            // Get class levels directly
            $stmt = $pdo->prepare("SELECT name as id, display_name as name, level_type, display_order FROM class_levels WHERE is_active = true ORDER BY display_order");
            $stmt->execute();
            $lookup_data['class_levels'] = $stmt->fetchAll();
            
            // Get assignments - hardcoded for performance since this is static data
            $lookup_data['assignments'] = [
                ['id' => 'First CA', 'name' => 'First Continuous Assessment', 'code' => 'CA1', 'order' => 1],
                ['id' => 'Second CA', 'name' => 'Second Continuous Assessment', 'code' => 'CA2', 'order' => 2],
                ['id' => 'Examination', 'name' => 'Examination', 'code' => 'EXAM', 'order' => 3]
            ];
            
            Response::success("All lookup data retrieved successfully", $lookup_data);
            break;
    }

} catch (Exception $e) {
    error_log("Lookup error: " . $e->getMessage());
    Response::serverError('Failed to retrieve lookup data');
}

?>