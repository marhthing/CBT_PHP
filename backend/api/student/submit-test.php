<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/TestCodeService.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('student');
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::validationError('Invalid JSON input');
    }
    
    // Validate required fields
    Response::validateRequired($input, ['test_code', 'answers', 'time_taken']);
    
    $test_code = Response::sanitizeInput($input['test_code']);
    $answers = $input['answers']; // Array of question_id => answer
    $time_taken = (int) $input['time_taken'];
    
    // Get service instance
    $testCodeService = TestCodeService::getInstance();
    
    // Get test information using service
    $test_codes = $testCodeService->getTestCodes(['code' => $test_code], 1, 0);
    
    if (empty($test_codes)) {
        Response::notFound('Test code not found');
    }
    
    $test = $test_codes[0];

    // Validate test code availability using service
    $validation_result = $testCodeService->validateTestCodeAvailability($test['id'], $user['id']);
    if (!$validation_result['success']) {
        Response::error($validation_result['message']);
    }

    // Check for duplicate test attempt using service
    $duplicate_result = $testCodeService->checkDuplicateTestAttempt(
        $user['id'], 
        $test['subject_id'], 
        $test['class_level'], 
        $test['term_id'], 
        $test['test_type']
    );
    
    if (!$duplicate_result['success']) {
        Response::error($duplicate_result['message'], 409);
    }

    // Check if student has already submitted this specific test using service
    $already_taken_result = $testCodeService->checkTestAlreadyTaken($test['id'], $user['id']);
    if (!$already_taken_result['success']) {
        Response::error($already_taken_result['message'], 409);
    }

    // Validate time taken (allow 10% buffer)
    $max_time = $test['duration_minutes'] * 60 * 1.1; // 10% buffer
    if ($time_taken > $max_time) {
        Response::error('Test time exceeded');
    }

    // Submit test using service
    $submission_result = $testCodeService->submitTest($test, $user['id'], $answers, $time_taken);
    
    if (!$submission_result['success']) {
        Response::error($submission_result['message']);
    }

    Response::logRequest('student/submit-test', 'POST', $user['id']);

    Response::success('Test submitted successfully', $submission_result['data']);
    
} catch (Exception $e) {
    error_log("Submit test error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
    Response::serverError('Failed to submit test: ' . $e->getMessage());
}

?>