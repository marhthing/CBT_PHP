<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/UserService.php';

$auth = new Auth();
$user = $auth->requireRole('admin');

$userService = UserService::getInstance();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGet($userService, $user);
        break;
    case 'POST':
        handlePost($userService, $user);
        break;
    case 'PUT':
        handlePut($userService, $user);
        break;
    case 'DELETE':
        handleDelete($userService, $user);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGet($userService, $user) {
    try {
        $teachers = $userService->getAllTeachers();
        
        Response::logRequest('admin/teachers', 'GET', $user['id']);
        Response::success('Teachers retrieved', ['teachers' => $teachers]);
        
    } catch (Exception $e) {
        Response::serverError('Failed to get teachers');
    }
}

function handlePost($userService, $user) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Validate required fields
        Response::validateRequired($input, ['username', 'email', 'password', 'full_name']);
        
        // Validate email format
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            Response::validationError('Invalid email format');
        }
        
        // Validate password strength
        if (strlen($input['password']) < 6) {
            Response::validationError('Password must be at least 6 characters long');
        }
        
        // Check if username or email already exists using service
        if ($userService->emailExists($input['email'])) {
            Response::validationError('Email already exists');
        }
        
        if ($userService->usernameExists($input['username'])) {
            Response::validationError('Username already exists');
        }
        
        // Create teacher using service
        $teacher_id = $userService->createTeacher($input);
        
        if (!$teacher_id) {
            Response::serverError('Failed to create teacher');
        }
        
        Response::logRequest('admin/teachers', 'POST', $user['id']);
        Response::created('Teacher created successfully', ['teacher_id' => $teacher_id]);
        
    } catch (Exception $e) {
        Response::serverError('Failed to create teacher');
    }
}

function handlePut($userService, $user) {
    try {
        $teacher_id = $_GET['id'] ?? null;
        
        if (!$teacher_id) {
            Response::validationError('Teacher ID is required');
        }
        
        // Check if teacher exists using service
        $teacher = $userService->getTeacherById($teacher_id);
        if (!$teacher) {
            Response::notFound('Teacher not found');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Validate email format if provided
        if (isset($input['email']) && !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            Response::validationError('Invalid email format');
        }
        
        // Validate password strength if provided
        if (isset($input['password']) && strlen($input['password']) < 6) {
            Response::validationError('Password must be at least 6 characters long');
        }
        
        // Check for duplicates using service
        if (isset($input['email']) && $userService->emailExists($input['email'], $teacher_id)) {
            Response::validationError('Email already exists');
        }
        
        if (isset($input['username']) && $userService->usernameExists($input['username'], $teacher_id)) {
            Response::validationError('Username already exists');
        }
        
        // Update teacher using service
        $success = $userService->updateTeacher($teacher_id, $input);
        
        if (!$success) {
            Response::serverError('Failed to update teacher');
        }
        
        Response::logRequest('admin/teachers', 'PUT', $user['id']);
        Response::updated('Teacher updated successfully');
        
    } catch (Exception $e) {
        Response::serverError('Failed to update teacher');
    }
}

function handleDelete($userService, $user) {
    try {
        $teacher_id = $_GET['id'] ?? null;
        
        if (!$teacher_id) {
            Response::validationError('Teacher ID is required');
        }
        
        // Check if teacher exists using service
        $teacher = $userService->getTeacherById($teacher_id);
        if (!$teacher) {
            Response::notFound('Teacher not found');
        }
        
        // Delete teacher using service (soft delete)
        $success = $userService->deleteTeacher($teacher_id);
        
        if (!$success) {
            Response::serverError('Failed to delete teacher');
        }
        
        Response::logRequest('admin/teachers', 'DELETE', $user['id']);
        Response::deleted('Teacher deactivated successfully');
        
    } catch (Exception $e) {
        Response::serverError('Failed to delete teacher');
    }
}

?>
