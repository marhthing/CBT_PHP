<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/TestCodeService.php';
require_once __DIR__ . '/../../services/QuestionService.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

// Initialize auth and verify student role
$auth = new Auth();
$user = $auth->getCurrentUser();

if (!$user || $user['role'] !== 'student') {
    Response::unauthorized('Student access required');
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        Response::validationError('Invalid JSON input');
    }

    // Validate required fields
    Response::validateRequired($input, ['test_code']);

    $test_code = strtoupper(trim($input['test_code']));

    // Get service instances
    $testCodeService = TestCodeService::getInstance();
    $questionService = QuestionService::getInstance();

    // Get test code details using service
    $test_codes = $testCodeService->getTestCodes(['code' => $test_code], 1, 0);
    
    if (empty($test_codes)) {
        Response::notFound('Test code not found');
    }
    
    $test = $test_codes[0];

    // Check if test is active and available for validation
    if (!$test['is_active'] || !$test['is_activated']) {
        Response::badRequest('Test code is not active');
    }

    // Check if test is expired
    if ($test['expires_at'] && strtotime($test['expires_at']) < time()) {
        Response::badRequest('Test code has expired');
    }

    // Check if test code status allows validation (only 'active' status can be validated)
    if ($test['status'] !== 'active') {
        Response::badRequest('This test code is no longer available for use');
    }

    // Check for duplicate test attempt (same subject, class, term, test type)
    $duplicate_result = $testCodeService->checkDuplicateTestAttempt(
        $user['id'], 
        $test['subject_id'], 
        $test['class_level'], 
        $test['term_id'], 
        $test['test_type']
    );
    
    if (!$duplicate_result['success']) {
        Response::badRequest($duplicate_result['message']);
    }

    // Check if there are enough questions for this test using service
    require_once __DIR__ . '/../../services/ConstantsService.php';
    $constants = ConstantsService::getInstance();
    $test_type = $test['test_type'] ?? $constants->getDefaultAssignmentType();
    
    $question_filters = [
        'subject_id' => $test['subject_id'],
        'class_level' => $test['class_level'],
        'term_id' => $test['term_id']
    ];
    
    $test_types = $constants->getTestTypes();
    if ($test_type === $test_types['EXAMINATION']) {
        // For examination, include both First CA and Second CA questions
        $question_filters['assignment_types'] = [$test_types['FIRST_CA'], $test_types['SECOND_CA']];
    } else {
        // For specific assignment types
        $question_filters['question_assignment'] = $test_type;
    }
    
    $available_questions_count = $questionService->countQuestions($question_filters);

    if ($available_questions_count < $test['total_questions']) {
        Response::badRequest('Not enough questions available for this test');
    }

    // Mark test code as "using" using service
    $activation_result = $testCodeService->markTestCodeAsUsing($test['id'], $user['id']);
    
    if (!$activation_result['success']) {
        Response::badRequest($activation_result['message']);
    }

    Response::logRequest('student/validate-test-code', 'POST', $user['id']);

    Response::success('Test code is valid', [
        'test_id' => $test['id'],
        'title' => $test['title'],
        'subject' => $test['subject_name'],
        'class_level' => $test['class_level'],
        'duration_minutes' => $test['duration_minutes'],
        'question_count' => $test['total_questions'],
        'test_type' => $test['test_type']
    ]);

} catch (Exception $e) {
    Response::serverError('Failed to validate test code: ' . $e->getMessage());
}

?>