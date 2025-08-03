<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('student');
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Get test code from URL parameter
    $test_code = $_GET['test_code'] ?? '';
    
    if (empty($test_code)) {
        Response::validationError('Test code is required');
    }
    
    // Get test information and validate
    $stmt = $db->prepare("
        SELECT tc.id, tc.code, tc.title, s.name as subject, tc.class_level, tc.duration_minutes, tc.total_questions as question_count, tc.is_active, tc.expires_at, tc.subject_id, tc.term_id, tc.session_id
        FROM test_codes tc
        LEFT JOIN subjects s ON tc.subject_id = s.id
        WHERE tc.code = ? AND tc.is_active = true AND tc.is_activated = true
    ");
    
    $stmt->execute([$test_code]);
    $test = $stmt->fetch();
    
    if (!$test) {
        Response::notFound('Test code not found or expired');
    }
    
    // Check if student has already taken this test
    $check_stmt = $db->prepare("
        SELECT id FROM test_results 
        WHERE test_code_id = ? AND student_id = ?
    ");
    
    $check_stmt->execute([$test['id'], $user['id']]);
    
    if ($check_stmt->fetch()) {
        Response::error('You have already completed this test', 409);
    }
    
    // Get random questions for the test
    $questions_stmt = $db->prepare("
        SELECT id, question_text, option_a, option_b, option_c, option_d, question_type
        FROM questions 
        WHERE subject_id = ? AND class_level = ? AND term_id = ? AND session_id = ?
        ORDER BY RANDOM()
        LIMIT ?
    ");
    
    $questions_stmt->execute([$test['subject_id'], $test['class_level'], $test['term_id'], $test['session_id'], $test['question_count']]);
    $questions = $questions_stmt->fetchAll();
    
    if (count($questions) < $test['question_count']) {
        Response::error('Insufficient questions available for this test');
    }
    
    Response::logRequest('student/take-test', 'GET', $user['id']);
    
    Response::success('Test data retrieved', [
        'id' => $test['id'],
        'title' => $test['title'],
        'subject' => $test['subject'],
        'class_level' => $test['class_level'],
        'duration_minutes' => $test['duration_minutes'],
        'questions' => $questions
    ]);
    
} catch (Exception $e) {
    error_log("Error getting test data: " . $e->getMessage());
    Response::serverError('Failed to load test');
}

?>
