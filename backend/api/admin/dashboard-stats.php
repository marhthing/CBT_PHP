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

    // Tests taken today
    $stmt = $db->prepare("
        SELECT COUNT(*) as total 
        FROM test_results 
        WHERE DATE(submitted_at) = CURRENT_DATE
    ");
    $stmt->execute();
    $stats['tests_today'] = $stmt->fetch()['total'];

    // Average score across all tests
    $stmt = $db->prepare("
        SELECT COALESCE(ROUND(AVG(score::decimal / total_questions * 100), 1), 0) as avg_score
        FROM test_results 
        WHERE total_questions > 0
    ");
    $stmt->execute();
    $stats['average_score'] = $stmt->fetch()['avg_score'];

    // Inactive test codes
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM test_codes WHERE is_active = false OR is_activated = false");
    $stmt->execute();
    $stats['inactive_test_codes'] = $stmt->fetch()['total'];

    // Total admins
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM users WHERE role = 'admin' AND is_active = true");
    $stmt->execute();
    $stats['total_admins'] = $stmt->fetch()['total'];

    // Teacher assignments count
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM teacher_assignments");
    $stmt->execute();
    $stats['total_assignments'] = $stmt->fetch()['total'];

    // Most active subject (by questions)
    $stmt = $db->prepare("
        SELECT s.name as subject_name, COUNT(q.id) as question_count
        FROM subjects s
        LEFT JOIN questions q ON s.id = q.subject_id
        GROUP BY s.id, s.name
        ORDER BY question_count DESC
        LIMIT 1
    ");
    $stmt->execute();
    $most_active = $stmt->fetch();
    $stats['most_active_subject'] = $most_active ? $most_active['subject_name'] : 'No subjects';
    $stats['most_active_subject_count'] = $most_active ? $most_active['question_count'] : 0;

    // Test completion rate
    $stmt = $db->prepare("
        SELECT 
            COUNT(CASE WHEN tr.id IS NOT NULL THEN 1 END) as completed_tests,
            COUNT(tc.id) as total_activated_codes
        FROM test_codes tc
        LEFT JOIN test_results tr ON tc.id = tr.test_code_id
        WHERE tc.is_activated = true
    ");
    $stmt->execute();
    $completion_data = $stmt->fetch();
    $stats['completion_rate'] = $completion_data['total_activated_codes'] > 0 
        ? round(($completion_data['completed_tests'] / $completion_data['total_activated_codes']) * 100, 1)
        : 0;

    Response::success('Dashboard statistics retrieved', $stats);

} catch (Exception $e) {
    error_log("Dashboard stats error: " . $e->getMessage());
    Response::serverError('Failed to retrieve dashboard statistics');
}

?>