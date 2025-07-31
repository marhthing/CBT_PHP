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
    $user = $auth->requireRole('student');
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Get available test codes
    $stmt = $db->prepare("
        SELECT 
            tc.id,
            tc.code,
            tc.title,
            tc.subject,
            tc.class_level,
            tc.duration_minutes,
            tc.question_count,
            tc.is_active,
            tc.expires_at,
            tc.created_at,
            CASE 
                WHEN tr.id IS NOT NULL THEN true 
                ELSE false 
            END as completed
        FROM test_codes tc
        LEFT JOIN test_results tr ON tc.id = tr.test_code_id AND tr.student_id = ?
        WHERE tc.is_active = true 
        AND tc.expires_at > CURRENT_TIMESTAMP
        ORDER BY tc.created_at DESC
    ");
    
    $stmt->execute([$user['id']]);
    $tests = $stmt->fetchAll();
    
    Response::logRequest('student/tests', 'GET', $user['id']);
    
    Response::success('Available tests retrieved', [
        'tests' => $tests
    ]);
    
} catch (Exception $e) {
    error_log("Error getting student tests: " . $e->getMessage());
    Response::serverError('Failed to get available tests');
}

?>
