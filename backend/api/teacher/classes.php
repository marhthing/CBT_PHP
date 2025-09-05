<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/DataManager.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('teacher');
    
    $dataManager = DataManager::getInstance();
    $assignmentService = $dataManager->getAssignmentService();
    
    // Get teacher's assigned classes using service
    $classes = $assignmentService->getTeacherAssignments($user['id']);
    
    Response::logRequest('teacher/classes', 'GET', $user['id']);
    
    Response::success('Teacher classes retrieved', [
        'classes' => $classes
    ]);
    
} catch (Exception $e) {
    Response::serverError('Failed to get assigned classes');
}

?>
