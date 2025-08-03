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
            ta.subject_id,
            s.name as subject_name,
            s.code as subject_code,
            ta.class_level,
            ta.term_id,
            t.name as term_name,
            ta.session_id,
            sess.name as session_name,
            ta.created_at
        FROM teacher_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.id
        LEFT JOIN terms t ON ta.term_id = t.id
        LEFT JOIN sessions sess ON ta.session_id = sess.id
        WHERE ta.teacher_id = ?
        ORDER BY s.name, ta.class_level
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
