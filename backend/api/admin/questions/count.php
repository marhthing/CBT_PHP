<?php

// Extra CORS headers for InfinityFree compatibility
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Authorization, Bearer");
header("Access-Control-Max-Age: 3600");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../includes/response.php';
require_once __DIR__ . '/../../../services/DataManager.php';
require_once __DIR__ . '/../../../services/ConstantsService.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

$auth = new Auth();
$user = $auth->requireRole('admin');

$dataManager = DataManager::getInstance();
$constantsService = ConstantsService::getInstance();
$questionService = $dataManager->getQuestionService();

try {
    // Get parameters
    $subject_id = $_GET['subject_id'] ?? null;
    $class_level = $_GET['class_level'] ?? null;
    $term_id = $_GET['term_id'] ?? null;
    $test_type = $_GET['test_type'] ?? null;

    if (!$subject_id || !$class_level || !$term_id || !$test_type) {
        Response::validationError('subject_id, class_level, term_id, and test_type are required');
    }

    // Build query based on test type
    $where_conditions = [
        'q.subject_id = ?',
        'q.class_level = ?',
        'q.term_id = ?'
    ];
    $params = [$subject_id, $class_level, $term_id];

    // Validate test type using constants service
    if (!$constantsService->isValidTestType($test_type)) {
        Response::validationError('Invalid test type provided');
    }
    
    // Get question count using service
    $count = $questionService->getQuestionCount($subject_id, $class_level, $term_id, $test_type);
    
    Response::logRequest('admin/questions/count', 'GET', $user['id']);
    Response::success('Question count retrieved', [
        'count' => $count,
        'subject_id' => (int)$subject_id,
        'class_level' => $class_level,
        'term_id' => (int)$term_id,
        'test_type' => $test_type
    ]);

} catch (Exception $e) {
    Response::serverError('Failed to get question count: ' . $e->getMessage());
}

?>