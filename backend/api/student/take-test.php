<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/TestCodeService.php';
require_once __DIR__ . '/../../services/QuestionService.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    // Start session early
    session_start();

    $auth = new Auth();
    $user = $auth->requireRole('student');

    // Get test code from URL parameter
    $test_code = $_GET['test_code'] ?? '';

    if (empty($test_code)) {
        Response::validationError('Test code is required');
    }

    // Get service instances
    $testCodeService = TestCodeService::getInstance();
    $questionService = QuestionService::getInstance();

    // Get test information using service
    $test_codes = $testCodeService->getTestCodes(['code' => $test_code], 1, 0);
    
    if (empty($test_codes)) {
        Response::notFound('Test code not found');
    }
    
    $test = $test_codes[0];

    // Validate test availability and ownership
    if (!$test['is_active'] || !$test['is_activated']) {
        Response::notFound('Test code not found, expired, or not available');
    }

    // Check test status and ownership
    if ($test['status'] === 'used') {
        Response::notFound('This test code has already been completed');
    }

    if ($test['status'] === 'using') {
        // If test is being used, verify it's by the same student
        if ($test['used_by'] != $user['id']) {
            Response::unauthorized('This test code is currently being used by another student');
        }
        // Same student can continue - no need to change status again
    } else {
        // Test is in 'active' status, mark it as 'using' for this student
        $activation_result = $testCodeService->markTestCodeAsUsing($test['id'], $user['id']);
        if (!$activation_result['success']) {
            Response::badRequest($activation_result['message']);
        }
    }

    // Check if student has already taken this test using service
    $duplicate_result = $testCodeService->checkTestAlreadyTaken($test['id'], $user['id']);
    if (!$duplicate_result['success']) {
        Response::error($duplicate_result['message'], 409);
    }

    // Get questions for the test using service
    require_once __DIR__ . '/../../services/ConstantsService.php';
    $constants = ConstantsService::getInstance();
    $test_type = $test['test_type'] ?? $constants->getDefaultAssignmentType();
    $question_count = (int)$test['total_questions'];
    
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
    
    // Get randomized questions with shuffled options
    $questions_result = $questionService->getRandomizedQuestionsForTest(
        $question_filters, 
        $question_count, 
        $test['id'], 
        $user['id']
    );
    
    if (!$questions_result['success']) {
        Response::error($questions_result['message']);
    }
    
    $questions = $questions_result['questions'];
    $answer_mappings = $questions_result['answer_mappings'];

    // Store answer mappings in session for later validation during submission
    $_SESSION['answer_mappings_' . $test['id'] . '_' . $user['id']] = $answer_mappings;

    Response::logRequest('student/take-test', 'GET', $user['id']);

    Response::success('Test data retrieved', [
        'id' => $test['id'],
        'title' => $test['title'],
        'subject' => $test['subject'],
        'class_level' => $test['class_level'],
        'duration_minutes' => $test['duration_minutes'],
        'test_type' => $test['test_type'],
        'questions' => $questions
    ]);

} catch (Exception $e) {
    Response::serverError('Failed to load test: ' . $e->getMessage());
}

?>