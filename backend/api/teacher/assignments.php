<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

$auth = new Auth();
$user = $auth->requireRole('teacher');

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    $stmt = $db->prepare("
        SELECT 
            ta.id,
            ta.teacher_id,
            ta.subject_id,
            ta.class_level,
            ta.term_id,
            ta.session_id,
            ta.created_at,
            s.name as subject_name,
            s.code as subject_code,
            t.name as term_name,
            sess.name as session_name
        FROM teacher_assignments ta
        JOIN subjects s ON ta.subject_id = s.id
        JOIN terms t ON ta.term_id = t.id
        JOIN sessions sess ON ta.session_id = sess.id
        WHERE ta.teacher_id = ?
        ORDER BY s.name, ta.class_level, t.display_order
    ");
    
    $stmt->execute([$user['id']]);
    $assignments = $stmt->fetchAll();
    
    Response::success('Teacher assignments retrieved', $assignments);
    
} catch (Exception $e) {
    Response::serverError('Failed to fetch teacher assignments');
}

?>