<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

// Initialize auth and verify student role
$auth = new Auth();
$user = $auth->getCurrentUser();

if (!$user || $user['role'] !== 'student') {
    Response::unauthorized('Student access required');
}

try {
    // Get database connection
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    // Get available test codes for student with participation check
    $stmt = $db->prepare("
        SELECT tc.id, tc.code, tc.title, s.name as subject, tc.class_level,
               tc.duration_minutes, tc.total_questions as question_count, tc.is_active, tc.is_activated,
               tc.expires_at, tc.subject_id, tc.term_id, tc.session_id,
               CASE 
                   WHEN tr.id IS NOT NULL THEN true 
                   ELSE false 
               END as already_participated
        FROM test_codes tc
        LEFT JOIN subjects s ON tc.subject_id = s.id
        LEFT JOIN test_results tr ON tc.subject_id = tr.test_code_id AND tr.student_id = ? 
                                   AND EXISTS (
                                       SELECT 1 FROM test_codes tc2 
                                       WHERE tc2.id = tr.test_code_id 
                                       AND tc2.subject_id = tc.subject_id 
                                       AND tc2.class_level = tc.class_level 
                                       AND tc2.term_id = tc.term_id 
                                       AND tc2.session_id = tc.session_id
                                   )
        WHERE tc.is_active = true 
        AND tc.is_activated = true 
        AND tc.expires_at > NOW()
        ORDER BY tc.created_at DESC
    ");
    $stmt->execute([$user['id']]);
    $test_codes = $stmt->fetchAll();

    Response::success('Available tests retrieved', $test_codes);

} catch (Exception $e) {
    error_log("Available tests error: " . $e->getMessage());
    Response::serverError('Failed to retrieve available tests');
}

?>