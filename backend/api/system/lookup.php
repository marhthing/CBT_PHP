<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/DataManager.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    // Get DataManager instance
    $data = DataManager::getInstance();
    
    $lookup_type = $_GET['type'] ?? '';

    switch ($lookup_type) {
        case 'terms':
            $terms = $data->getAllTerms();
            // Format for frontend compatibility
            $formatted_data = [];
            foreach ($terms as $term) {
                $formatted_data[] = [
                    'id' => $term['id'],
                    'name' => $term['name'],
                    'display_order' => $term['display_order']
                ];
            }
            Response::success("Terms retrieved successfully", $formatted_data);
            break;

        case 'sessions':
            $sessions = $data->getAllSessions();
            // Format for frontend compatibility
            $formatted_data = [];
            foreach ($sessions as $session) {
                $formatted_data[] = [
                    'id' => $session['id'],
                    'name' => $session['name'],
                    'start_date' => $session['start_date'],
                    'end_date' => $session['end_date'],
                    'is_current' => $session['is_current']
                ];
            }
            Response::success("Sessions retrieved successfully", $formatted_data);
            break;

        case 'subjects':
            $subjects = $data->getAllSubjects();
            // Format for frontend compatibility
            $formatted_data = [];
            foreach ($subjects as $subject) {
                $formatted_data[] = [
                    'id' => $subject['id'],
                    'name' => $subject['name'],
                    'code' => $subject['code'],
                    'description' => $subject['description']
                ];
            }
            Response::success("Subjects retrieved successfully", $formatted_data);
            break;

        case 'class_levels':
            $classes = $data->getAllClasses();
            // Format for frontend compatibility (using name as id for compatibility)
            $formatted_data = [];
            foreach ($classes as $class) {
                $formatted_data[] = [
                    'id' => $class['name'],
                    'name' => $class['display_name'],
                    'level_type' => $class['level_type'],
                    'display_order' => $class['display_order']
                ];
            }
            Response::success("Class levels retrieved successfully", $formatted_data);
            break;

        case 'assignments':
            $assignments = $data->getAllAssignments();
            // Format for frontend compatibility  
            $formatted_data = [];
            foreach ($assignments as $assignment) {
                $formatted_data[] = [
                    'id' => $assignment['name'],
                    'name' => $assignment['display_name'],
                    'code' => $assignment['code'],
                    'order' => $assignment['order']
                ];
            }
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
            // Return all lookup data if no type specified
            $lookup_data = [
                'subjects' => [],
                'terms' => [],
                'sessions' => [],
                'class_levels' => [],
                'assignments' => []
            ];
            
            // Get subjects
            $subjects = $data->getAllSubjects();
            foreach ($subjects as $subject) {
                $lookup_data['subjects'][] = [
                    'id' => $subject['id'],
                    'name' => $subject['name'],
                    'code' => $subject['code'],
                    'description' => $subject['description']
                ];
            }
            
            // Get terms
            $terms = $data->getAllTerms();
            foreach ($terms as $term) {
                $lookup_data['terms'][] = [
                    'id' => $term['id'],
                    'name' => $term['name'],
                    'display_order' => $term['display_order']
                ];
            }
            
            // Get sessions
            $sessions = $data->getAllSessions();
            foreach ($sessions as $session) {
                $lookup_data['sessions'][] = [
                    'id' => $session['id'],
                    'name' => $session['name'],
                    'start_date' => $session['start_date'],
                    'end_date' => $session['end_date'],
                    'is_current' => $session['is_current']
                ];
            }
            
            // Get class levels
            $classes = $data->getAllClasses();
            foreach ($classes as $class) {
                $lookup_data['class_levels'][] = [
                    'id' => $class['name'],
                    'name' => $class['display_name'],
                    'level_type' => $class['level_type'],
                    'display_order' => $class['display_order']
                ];
            }
            
            // Get assignments
            $assignments = $data->getAllAssignments();
            foreach ($assignments as $assignment) {
                $lookup_data['assignments'][] = [
                    'id' => $assignment['name'],
                    'name' => $assignment['display_name'],
                    'code' => $assignment['code'],
                    'order' => $assignment['order']
                ];
            }
            
            Response::success("All lookup data retrieved successfully", $lookup_data);
            break;
    }

} catch (Exception $e) {
    error_log("Lookup error: " . $e->getMessage());
    Response::serverError('Failed to retrieve lookup data');
}

?>