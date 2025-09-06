
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

// Get services directly instead of through DataManager
$constantsService = ConstantsService::getInstance();
require_once __DIR__ . '/../../../services/QuestionService.php';
$questionService = QuestionService::getInstance();

try {
    // Get parameters
    $subject_id = $_GET['subject_id'] ?? null;
    $class_level = $_GET['class_level'] ?? null;
    $term_id = $_GET['term_id'] ?? null;
    $test_type = $_GET['test_type'] ?? null;

    if (!$subject_id || !$class_level || !$term_id || !$test_type) {
        Response::validationError('subject_id, class_level, term_id, and test_type are required');
    }

    // Validate test type using constants service
    if (!$constantsService->isValidTestType($test_type)) {
        Response::validationError('Invalid test type provided');
    }
    
    // Normalize test type
    $normalizedTestType = $constantsService->normalizeTestType($test_type);
    if (!$normalizedTestType) {
        $normalizedTestType = $test_type; // Use original if normalization fails
    }
    
    $responseData = [
        'subject_id' => (int)$subject_id,
        'class_level' => $class_level,
        'term_id' => (int)$term_id,
        'test_type' => $test_type
    ];
    
    // Handle different test types appropriately
    if (strtolower($normalizedTestType) === 'examination') {
        // For examination, get counts from both First CA and Second CA
        $firstCAFilters = [
            'subject_id' => $subject_id,
            'class_level' => $class_level,
            'term_id' => $term_id,
            'question_assignment' => 'First CA'
        ];
        
        $secondCAFilters = [
            'subject_id' => $subject_id,
            'class_level' => $class_level,
            'term_id' => $term_id,
            'question_assignment' => 'Second CA'
        ];
        
        $firstCACount = $questionService->countQuestions($firstCAFilters);
        $secondCACount = $questionService->countQuestions($secondCAFilters);
        $totalCount = $firstCACount + $secondCACount;
        
        $responseData['count'] = $totalCount;
        $responseData['breakdown'] = [
            'first_ca' => $firstCACount,
            'second_ca' => $secondCACount,
            'total' => $totalCount,
            'ratio' => '1:5 (First CA : Second CA)'
        ];
        
    } else {
        // For other test types, use direct mapping
        $filters = [
            'subject_id' => $subject_id,
            'class_level' => $class_level,
            'term_id' => $term_id,
            'test_type' => $normalizedTestType
        ];
        
        $count = $questionService->countQuestions($filters);
        
        // Also provide breakdown for clarity
        if (strtolower($normalizedTestType) === 'first ca' || strtolower($normalizedTestType) === 'first_ca') {
            $responseData['count'] = $count;
            $responseData['breakdown'] = [
                'first_ca' => $count,
                'assignment_type' => 'First CA'
            ];
        } elseif (strtolower($normalizedTestType) === 'second ca' || strtolower($normalizedTestType) === 'second_ca') {
            $responseData['count'] = $count;
            $responseData['breakdown'] = [
                'second_ca' => $count,
                'assignment_type' => 'Second CA'
            ];
        } else {
            $responseData['count'] = $count;
        }
    }
    
    Response::logRequest('admin/questions/count', 'GET', $user['id']);
    Response::success('Question count retrieved', $responseData);

} catch (Exception $e) {
    Response::serverError('Failed to get question count: ' . $e->getMessage());
}

?>
