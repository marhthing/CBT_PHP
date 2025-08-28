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
               tc.is_active, tc.is_activated, tc.status, tc.subject_id, tc.term_id, tc.session_id, tc.test_type
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
    
    // Check if student has already taken a test for this subject, class, term, AND test type
    $duplicate_check_stmt = $db->prepare("
        SELECT tr.id FROM test_results tr
        JOIN test_codes tc ON tr.test_code_id = tc.id
        WHERE tr.student_id = ? 
        AND tc.subject_id = ?
        AND tc.class_level = ?
        AND tc.term_id = ?
        AND tc.test_type = ?
    ");
    
    $duplicate_check_stmt->execute([
        $user['id'], 
        $test['subject_id'],
        $test['class_level'], 
        $test['term_id'],
        $test['test_type']
    ]);
    
    if ($duplicate_check_stmt->fetch()) {
        Response::badRequest('You have already taken a ' . $test['test_type'] . ' test for this subject, class, and term');
    }

    // Check if there are enough questions for this test based on test_type
    $test_type = $test['test_type'] ?? 'First CA';
    
    if ($test_type === 'Examination') {
        // For Examination, count ALL questions from both First CA and Second CA
        $stmt = $db->prepare("
            SELECT COUNT(*) as question_count
            FROM questions q
            WHERE q.subject_id = ? AND q.class_level = ? AND q.term_id = ?
            AND (COALESCE(q.question_assignment, 'First CA') = 'First CA' OR COALESCE(q.question_assignment, 'First CA') = 'Second CA')
        ");
        $stmt->execute([$test['subject_id'], $test['class_level'], $test['term_id']]);
    } else {
        // For specific assignment types (First CA, Second CA), filter by assignment type
        $stmt = $db->prepare("
            SELECT COUNT(*) as question_count
            FROM questions q
            WHERE q.subject_id = ? AND q.class_level = ? AND q.term_id = ?
            AND COALESCE(q.question_assignment, 'First CA') = ?
        ");
        $stmt->execute([$test['subject_id'], $test['class_level'], $test['term_id'], $test_type]);
    }
    
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
        'question_count' => $test['question_count'],
        'test_type' => $test['test_type']
    ]);

} catch (Exception $e) {
    Response::serverError('Failed to validate test code');
}

?>