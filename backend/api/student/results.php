<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/DataManager.php';
require_once __DIR__ . '/../../services/ConstantsService.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('student');

    $dataManager = DataManager::getInstance();
    $constantsService = ConstantsService::getInstance();

    // Check if requesting limited results
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : null;

    // Get student results using service
    $resultsService = $dataManager->getResultsService();
    $results = $resultsService->getStudentResults($user['id'], $limit);

    // Add calculated fields
    foreach ($results as &$result) {
        $max_possible_score = $result['total_questions'] * $result['score_per_question'];
        $result['percentage'] = round(($result['score'] / $max_possible_score) * 100, 2);
        $result['grade'] = $constantsService->calculateGrade($result['percentage']);
        $result['max_possible_score'] = $max_possible_score;
        $result['test_code'] = [
            'code' => $result['code'],
            'title' => $result['title'],
            'subject' => $result['subject'],
            'class_level' => $result['class_level'],
            'duration_minutes' => $result['duration_minutes'],
            'test_type' => $result['test_type']
        ];

        // Remove redundant fields
        unset($result['code'], $result['title'], $result['subject'], 
             $result['class_level'], $result['duration_minutes'], $result['test_type']);
    }

    Response::logRequest('student/results', 'GET', $user['id']);

    Response::success('Test results retrieved', [
        'results' => $results
    ]);

} catch (Exception $e) {
    error_log('Student results error: ' . $e->getMessage());
    Response::serverError('Failed to get test results: ' . $e->getMessage());
}

?>