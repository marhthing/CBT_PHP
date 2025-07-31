<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('teacher');
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Get teacher's assigned classes
    $stmt = $db->prepare("
        SELECT 
            ta.id,
            ta.subject,
            ta.class_level,
            ta.created_at,
            u.full_name as assigned_by_name
        FROM teacher_assignments ta
        LEFT JOIN users u ON ta.assigned_by = u.id
        WHERE ta.teacher_id = ?
        ORDER BY ta.subject, ta.class_level
    ");
    
    $stmt->execute([$user['id']]);
    $classes = $stmt->fetchAll();
    
    Response::logRequest('teacher/classes', 'GET', $user['id']);
    
    Response::success('Teacher classes retrieved', [
        'classes' => $classes
    ]);
    
} catch (Exception $e) {
    error_log("Error getting teacher classes: " . $e->getMessage());
    Response::serverError('Failed to get assigned classes');
}

?>
