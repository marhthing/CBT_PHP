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

    // Get dashboard statistics with optimized combined query
    $stats = [];

    // Combine multiple counts into a single query for better performance
    $stmt = $db->prepare("
        SELECT 
            (SELECT COUNT(*) FROM questions) as total_questions,
            (SELECT COUNT(*) FROM test_codes) as total_test_codes,
            (SELECT COUNT(*) FROM test_codes WHERE is_active = true AND is_activated = true) as active_test_codes,
            (SELECT COUNT(*) FROM test_codes WHERE is_active = false OR is_activated = false) as inactive_test_codes,
            (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND is_active = true) as total_teachers,
            (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = true) as total_students,
            (SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = true) as total_admins,
            (SELECT COUNT(*) FROM teacher_assignments) as total_assignments,
            (SELECT COUNT(*) FROM test_results WHERE submitted_at >= NOW() - INTERVAL '7 days') as recent_tests,
            (SELECT COUNT(*) FROM test_results WHERE DATE(submitted_at) = CURRENT_DATE) as tests_today,
            (SELECT COALESCE(ROUND(AVG(score::decimal / total_questions) * 100, 1), 0) FROM test_results WHERE total_questions > 0) as average_score
    ");
    $stmt->execute();
    $main_stats = $stmt->fetch();
    
    // Assign the stats
    $stats['total_questions'] = (int)$main_stats['total_questions'];
    $stats['total_test_codes'] = (int)$main_stats['total_test_codes'];
    $stats['active_test_codes'] = (int)$main_stats['active_test_codes'];
    $stats['inactive_test_codes'] = (int)$main_stats['inactive_test_codes'];
    $stats['total_teachers'] = (int)$main_stats['total_teachers'];
    $stats['total_students'] = (int)$main_stats['total_students'];
    $stats['total_admins'] = (int)$main_stats['total_admins'];
    $stats['total_assignments'] = (int)$main_stats['total_assignments'];
    $stats['recent_tests'] = (int)$main_stats['recent_tests'];
    $stats['tests_today'] = (int)$main_stats['tests_today'];
    $stats['average_score'] = (float)$main_stats['average_score'];

    // Most active subject (separate query for clarity)
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
    $stats['most_active_subject_count'] = $most_active ? (int)$most_active['question_count'] : 0;

    // Test completion rate (separate query for clarity)
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
    Response::serverError('Failed to retrieve dashboard statistics');
}

?>