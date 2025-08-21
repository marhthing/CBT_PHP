<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

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
    
    // Get database connection
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    // Validate test code
    $stmt = $db->prepare("
        SELECT tc.id, tc.code, tc.title, s.name as subject, tc.class_level,
               tc.duration_minutes, tc.total_questions as question_count, tc.expires_at,
               tc.is_active, tc.is_activated, tc.status
        FROM test_codes tc
        LEFT JOIN subjects s ON tc.subject_id = s.id
        WHERE tc.code = ?
    ");
    $stmt->execute([$test_code]);
    $test = $stmt->fetch();

    if (!$test) {
        Response::notFound('Test code not found');
    }

    if (!$test['is_active']) {
        Response::badRequest('Test code is not active');
    }

    if (!$test['is_activated']) {
        Response::badRequest('Test code is not activated yet');
    }

    if ($test['status'] === 'used') {
        Response::badRequest('This test code has already been used and is permanently deactivated');
    }

    if ($test['status'] === 'using') {
        Response::badRequest('This test code is currently being used by another student');
    }

    if ($test['expires_at'] && strtotime($test['expires_at']) < time()) {
        Response::badRequest('Test code has expired');
    }

    // Check if student has already taken this test
    $stmt = $db->prepare("
        SELECT id FROM test_results 
        WHERE test_code_id = ? AND student_id = ?
    ");
    $stmt->execute([$test['id'], $user['id']]);
    $existing_result = $stmt->fetch();

    if ($existing_result) {
        Response::badRequest('You have already taken this test');
    }
    
    // Check if student has already taken a test for this subject, class, term, and session
    $duplicate_check_stmt = $db->prepare("
        SELECT tr.id FROM test_results tr
        JOIN test_codes tc ON tr.test_code_id = tc.id
        WHERE tr.student_id = ? 
        AND tc.subject_id = (SELECT subject_id FROM test_codes WHERE id = ?)
        AND tc.class_level = ?
        AND tc.term_id = (SELECT term_id FROM test_codes WHERE id = ?)
        AND tc.session_id = (SELECT session_id FROM test_codes WHERE id = ?)
    ");
    
    $duplicate_check_stmt->execute([
        (int)$user['id'], 
        (int)$test['id'],
        (int)$test['class_level'], 
        (int)$test['id'],
        (int)$test['id']
    ]);
    
    if ($duplicate_check_stmt->fetch()) {
        Response::badRequest('You have already taken a test for this subject, class, term and session');
    }

    // Check if there are enough questions for this test
    $stmt = $db->prepare("
        SELECT COUNT(*) as question_count
        FROM questions q
        WHERE q.subject_id = (SELECT subject_id FROM test_codes WHERE id = ?)
        AND q.class_level = ?
    ");
    $stmt->execute([(int)$test['id'], (int)$test['class_level']]);
    $available_questions = $stmt->fetch()['question_count'];

    if ($available_questions < $test['question_count']) {
        Response::badRequest('Not enough questions available for this test');
    }

    // Mark test code as "using" - security state change
    $update_stmt = $db->prepare("
        UPDATE test_codes 
        SET status = 'using', used_by = ?, used_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND status = 'active'
    ");
    $update_stmt->execute([$user['id'], $test['id']]);

    if ($update_stmt->rowCount() === 0) {
        Response::badRequest('Test code is no longer available');
    }

    Response::logRequest('student/validate-test-code', 'POST', $user['id']);

    Response::success('Test code is valid', [
        'test_id' => $test['id'],
        'title' => $test['title'],
        'subject' => $test['subject'],
        'class_level' => $test['class_level'],
        'duration_minutes' => $test['duration_minutes'],
        'question_count' => $test['question_count']
    ]);

} catch (Exception $e) {
    Response::serverError('Failed to validate test code');
}

?>