<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/DataManager.php';
require_once __DIR__ . '/../../services/TeacherAssignmentService.php';

$auth = new Auth();
$user = $auth->requireRole('admin');

$dataManager = DataManager::getInstance();
$teacherAssignmentService = TeacherAssignmentService::getInstance();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGet($teacherAssignmentService, $user);
        break;
    case 'POST':
        handlePost($teacherAssignmentService, $user);
        break;
    case 'DELETE':
        handleDelete($teacherAssignmentService, $user);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGet($teacherAssignmentService, $user) {
    try {
        // Get all teacher assignments using service
        $assignments = $teacherAssignmentService->getAllTeacherAssignments();
        
        // Format assignments for frontend
        $formatted_assignments = [];
        foreach ($assignments as $assignment) {
            $formatted_assignments[] = [
                'id' => $assignment['id'],
                'teacher_id' => $assignment['teacher_id'],
                'teacher_name' => $assignment['teacher_name'],
                'teacher_email' => $assignment['email'] ?? '', // This might not be available in the service query
                'subject_id' => $assignment['subject_id'],
                'subject_name' => $assignment['subject_name'],
                'class_level' => $assignment['class_level'],
                'created_at' => $assignment['created_at'],
                'assigned_by_name' => $user['full_name'] ?? 'Administrator'
            ];
        }
        
        Response::logRequest('admin/assignments', 'GET', $user['id']);
        Response::success('Teacher assignments retrieved', $formatted_assignments);
        
    } catch (Exception $e) {
        Response::serverError('Failed to get teacher assignments');
    }
}

function handlePost($teacherAssignmentService, $user) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Check if this is a method override (for InfinityFree compatibility)
        if (isset($input['_method']) && $input['_method'] === 'DELETE') {
            handleDelete($teacherAssignmentService, $user, $input);
            return;
        }
        
        // Validate required fields
        Response::validateRequired($input, ['teacher_id', 'subject_id', 'class_level', 'term_id', 'session_id']);
        
        // Use DataManager for validation
        $data = DataManager::getInstance();
        
        // Validate teacher exists and is a teacher
        require_once __DIR__ . '/../../services/UserService.php';
        $userService = UserService::getInstance();
        $teacher = $userService->getTeacherById($input['teacher_id']);
        if (!$teacher) {
            Response::validationError('Invalid teacher selected');
        }
        
        // Check if assignment already exists using service
        $existingAssignment = $teacherAssignmentService->isTeacherAssigned(
            $input['teacher_id'],
            $input['subject_id'],
            $input['class_level'],
            $input['session_id'],
            $input['term_id']
        );
        
        if ($existingAssignment) {
            Response::validationError('Teacher is already assigned to this subject and class');
        }
        
        // Validate subject exists
        if (!$data->isValidSubject($input['subject_id'])) {
            Response::validationError('Invalid subject selected');
        }
        
        // Validate class level exists
        if (!$data->isValidClassLevel($input['class_level'])) {
            Response::validationError('Invalid class level selected');
        }
        
        // Validate term exists
        if (!$data->isValidTerm($input['term_id'])) {
            Response::validationError('Invalid term selected');
        }
        
        // Validate session exists
        if (!$data->isValidSession($input['session_id'])) {
            Response::validationError('Invalid session selected');
        }
        
        // Create assignment using service
        $result = $teacherAssignmentService->createTeacherAssignment([
            'teacher_id' => $input['teacher_id'],
            'subject_id' => $input['subject_id'],
            'class_level' => $input['class_level'],
            'term_id' => $input['term_id'],
            'session_id' => $input['session_id']
        ]);
        
        if (!$result['success']) {
            Response::serverError($result['message']);
        }
        
        Response::logRequest('admin/assignments', 'POST', $user['id']);
        Response::created('Teacher assignment created successfully', ['assignment_id' => $result['id']]);
        
    } catch (Exception $e) {
        Response::serverError('Failed to create teacher assignment');
    }
}

function handleDelete($teacherAssignmentService, $user, $input = null) {
    try {
        // Parse assignment ID from URL path
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path_parts = explode('/', trim($path, '/'));
        $assignment_id = end($path_parts);
        
        if (!is_numeric($assignment_id)) {
            $assignment_id = $_GET['id'] ?? null;
        }
        
        // If still no ID and we have input data (from POST method override), try there
        if (!$assignment_id && $input && isset($input['id'])) {
            $assignment_id = $input['id'];
        }
        
        if (!$assignment_id) {
            Response::validationError('Assignment ID is required');
        }
        
        // Check if assignment exists using service
        $assignment = $teacherAssignmentService->getTeacherAssignmentById($assignment_id);
        
        if (!$assignment) {
            Response::notFound('Assignment not found');
        }
        
        // Delete assignment using service
        $result = $teacherAssignmentService->deleteTeacherAssignment($assignment_id);
        
        if (!$result['success']) {
            Response::serverError($result['message']);
        }
        
        Response::logRequest('admin/assignments', 'DELETE', $user['id']);
        Response::deleted('Teacher assignment removed successfully');
        
    } catch (Exception $e) {
        Response::serverError('Failed to delete teacher assignment');
    }
}

?>
