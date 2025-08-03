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

    // Get available test codes for student
    $stmt = $db->prepare("
        SELECT tc.id, tc.code, tc.title, s.name as subject, tc.class_level,
               tc.duration_minutes, tc.total_questions as question_count, tc.is_active, tc.is_activated,
               tc.expires_at
        FROM test_codes tc
        LEFT JOIN subjects s ON tc.subject_id = s.id
        WHERE tc.is_active = true 
        AND tc.is_activated = true 
        AND tc.expires_at > NOW()
        ORDER BY tc.created_at DESC
    ");
    $stmt->execute();
    $test_codes = $stmt->fetchAll();

    Response::success('Available tests retrieved', $test_codes);

} catch (Exception $e) {
    error_log("Available tests error: " . $e->getMessage());
    Response::serverError('Failed to retrieve available tests');
}

?>