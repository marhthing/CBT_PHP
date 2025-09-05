<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/StatsService.php';

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
    $statsService = StatsService::getInstance();
    
    // Get admin dashboard statistics using service
    $stats = $statsService->getAdminDashboardStats();
    
    // Get additional statistics not covered by main dashboard stats
    
    // Get questions breakdown by assignment type (using service)
    // Note: This could be moved to a specialized method in QuestionService if needed
    require_once __DIR__ . '/../../services/QuestionService.php';
    $questionService = QuestionService::getInstance();
    $questionStats = $questionService->getQuestionStats();
    
    $assignment_breakdown = [];
    if (isset($questionStats['by_assignment'])) {
        foreach ($questionStats['by_assignment'] as $assignment) {
            $assignment_breakdown[$assignment['question_assignment']] = (int)$assignment['question_count'];
        }
    }
    $stats['questions_by_assignment'] = $assignment_breakdown;
    
    // Get most active subject
    $most_active_subject = 'No subjects';
    $most_active_count = 0;
    if (isset($questionStats['by_subject']) && !empty($questionStats['by_subject'])) {
        $top_subject = $questionStats['by_subject'][0]; // First one is highest due to ORDER BY question_count DESC
        $most_active_subject = $top_subject['subject_name'];
        $most_active_count = (int)$top_subject['question_count'];
    }
    $stats['most_active_subject'] = $most_active_subject;
    $stats['most_active_subject_count'] = $most_active_count;
    
    // Calculate test completion rate
    // This is a simple calculation based on activated test codes vs completed tests
    $completion_rate = 0;
    if ($stats['active_test_codes'] > 0 && $stats['recent_tests'] > 0) {
        // Rough estimate: recent tests as percentage of active test codes
        $completion_rate = min(100, round(($stats['recent_tests'] / $stats['active_test_codes']) * 100, 1));
    }
    $stats['completion_rate'] = $completion_rate;
    
    // Ensure all values are properly typed
    $stats['total_questions'] = (int)($stats['total_questions'] ?? 0);
    $stats['total_test_codes'] = (int)($stats['total_test_codes'] ?? 0);
    $stats['active_test_codes'] = (int)($stats['active_test_codes'] ?? 0);
    $stats['inactive_test_codes'] = (int)($stats['inactive_test_codes'] ?? 0);
    $stats['total_teachers'] = (int)($stats['total_teachers'] ?? 0);
    $stats['total_students'] = (int)($stats['total_students'] ?? 0);
    $stats['total_admins'] = (int)($stats['total_admins'] ?? 0);
    $stats['total_assignments'] = (int)($stats['total_assignments'] ?? 0);
    $stats['recent_tests'] = (int)($stats['recent_tests'] ?? 0);
    $stats['tests_today'] = (int)($stats['tests_today'] ?? 0);
    $stats['average_score'] = (float)($stats['average_score'] ?? 0);

    Response::success('Dashboard statistics retrieved', $stats);

} catch (Exception $e) {
    Response::serverError('Failed to retrieve dashboard statistics: ' . $e->getMessage());
}

?>