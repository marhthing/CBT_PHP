<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

// Initialize auth and verify admin role
$auth = new Auth();
$user = $auth->getCurrentUser();

if (!$user || $user['role'] !== 'admin') {
    Response::unauthorized('Admin access required');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get dashboard statistics
    $stats = [];

    // Total questions
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM questions");
    $stmt->execute();
    $stats['total_questions'] = $stmt->fetch()['total'];

    // Total test codes
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM test_codes");
    $stmt->execute();
    $stats['total_test_codes'] = $stmt->fetch()['total'];

    // Active test codes
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM test_codes WHERE is_active = true AND is_activated = true");
    $stmt->execute();
    $stats['active_test_codes'] = $stmt->fetch()['total'];

    // Total teachers
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'teacher' AND is_active = true");
    $stmt->execute();
    $stats['total_teachers'] = $stmt->fetch()['total'];

    // Total students
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'student' AND is_active = true");
    $stmt->execute();
    $stats['total_students'] = $stmt->fetch()['total'];

    // Recent tests (last 7 days)
    $stmt = $db->prepare("
        SELECT COUNT(*) as total 
        FROM test_results 
        WHERE submitted_at >= NOW() - INTERVAL '7 days'
    ");
    $stmt->execute();
    $stats['recent_tests'] = $stmt->fetch()['total'];

    Response::success('Dashboard statistics retrieved', $stats);

} catch (Exception $e) {
    error_log("Dashboard stats error: " . $e->getMessage());
    Response::serverError('Failed to retrieve dashboard statistics');
}

?>