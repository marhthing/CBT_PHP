<?php

require_once __DIR__ . '/../../cors.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: *');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Auth check and get user ID from JWT
    require_once __DIR__ . '/../../includes/auth.php';
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if (!$user || $user['role'] !== 'teacher') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }

    // Direct database connection and query
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Get teacher assignments using the actual teacher ID from JWT
    $stmt = $pdo->prepare("
        SELECT ta.subject_id, ta.class_level, ta.term_id, ta.session_id,
               s.name as subject_name, s.code as subject_code,
               cl.display_name as class_display_name,
               t.name as term_name, 
               sess.name as session_name
        FROM teacher_assignments ta
        LEFT JOIN subjects s ON ta.subject_id = s.id
        LEFT JOIN terms t ON ta.term_id = t.id
        LEFT JOIN sessions sess ON ta.session_id = sess.id
        LEFT JOIN class_levels cl ON ta.class_level = cl.name
        WHERE ta.teacher_id = :teacher_id
        ORDER BY s.name ASC
    ");
    
    $stmt->execute(['teacher_id' => $user['id']]);
    $assignments = $stmt->fetchAll();
    
    // Format for frontend filters
    $subjects = [];
    $classes = [];
    $terms = [];
    $sessions = [];
    
    foreach ($assignments as $assignment) {
        // Subjects
        if (!isset($subjects[$assignment['subject_id']])) {
            $subjects[$assignment['subject_id']] = [
                'id' => $assignment['subject_id'],
                'name' => $assignment['subject_name'],
                'code' => $assignment['subject_code']
            ];
        }
        
        // Classes
        if (!isset($classes[$assignment['class_level']])) {
            $classes[$assignment['class_level']] = [
                'id' => $assignment['class_level'],
                'name' => $assignment['class_display_name']
            ];
        }
        
        // Terms
        if (!isset($terms[$assignment['term_id']])) {
            $terms[$assignment['term_id']] = [
                'id' => $assignment['term_id'],
                'name' => $assignment['term_name']
            ];
        }
        
        // Sessions
        if (!isset($sessions[$assignment['session_id']])) {
            $sessions[$assignment['session_id']] = [
                'id' => $assignment['session_id'],
                'name' => $assignment['session_name']
            ];
        }
    }
    
    $response = [
        'success' => true,
        'message' => 'Teacher classes retrieved',
        'timestamp' => date('c'),
        'data' => [
            'assignments' => $assignments,
            'subjects' => array_values($subjects),
            'classes' => array_values($classes),
            'terms' => array_values($terms),
            'sessions' => array_values($sessions)
        ]
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("Teacher classes error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to get assigned classes',
        'timestamp' => date('c')
    ]);
}

?>
