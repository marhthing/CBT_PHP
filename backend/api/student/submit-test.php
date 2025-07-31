<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('student');
    
    $database = new Database();
    $db = $database->getConnection();
    
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
    
    // Get test information
    $stmt = $db->prepare("
        SELECT id, question_count, duration_minutes, is_active, expires_at
        FROM test_codes 
        WHERE code = ?
    ");
    
    $stmt->execute([$test_code]);
    $test = $stmt->fetch();
    
    if (!$test) {
        Response::notFound('Test code not found');
    }
    
    if (!$test['is_active'] || strtotime($test['expires_at']) < time()) {
        Response::error('Test is no longer available');
    }
    
    // Check if student has already submitted this test
    $check_stmt = $db->prepare("
        SELECT id FROM test_results 
        WHERE test_code_id = ? AND student_id = ?
    ");
    
    $check_stmt->execute([$test['id'], $user['id']]);
    
    if ($check_stmt->fetch()) {
        Response::error('Test already submitted', 409);
    }
    
    // Validate time taken (allow 10% buffer)
    $max_time = $test['duration_minutes'] * 60 * 1.1; // 10% buffer
    if ($time_taken > $max_time) {
        Response::error('Test time exceeded');
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Get correct answers for submitted questions
        $question_ids = array_keys($answers);
        $placeholders = implode(',', array_fill(0, count($question_ids), '?'));
        
        $correct_stmt = $db->prepare("
            SELECT id, correct_answer 
            FROM questions 
            WHERE id IN ($placeholders)
        ");
        
        $correct_stmt->execute($question_ids);
        $correct_answers = $correct_stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Calculate score
        $score = 0;
        $total_questions = count($answers);
        
        foreach ($answers as $question_id => $student_answer) {
            if (isset($correct_answers[$question_id]) && 
                strtoupper($student_answer) === strtoupper($correct_answers[$question_id])) {
                $score++;
            }
        }
        
        // Insert test result
        $result_stmt = $db->prepare("
            INSERT INTO test_results (test_code_id, student_id, score, total_questions, time_taken, submitted_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ");
        
        $result_stmt->execute([$test['id'], $user['id'], $score, $total_questions, $time_taken]);
        $result_id = $db->lastInsertId();
        
        // Insert individual answers
        $answer_stmt = $db->prepare("
            INSERT INTO test_answers (result_id, question_id, selected_answer, is_correct)
            VALUES (?, ?, ?, ?)
        ");
        
        foreach ($answers as $question_id => $student_answer) {
            $is_correct = isset($correct_answers[$question_id]) && 
                         strtoupper($student_answer) === strtoupper($correct_answers[$question_id]);
            
            $answer_stmt->execute([$result_id, $question_id, strtoupper($student_answer), $is_correct]);
        }
        
        $db->commit();
        
        Response::logRequest('student/submit-test', 'POST', $user['id']);
        
        Response::success('Test submitted successfully', [
            'result_id' => $result_id,
            'score' => $score,
            'total_questions' => $total_questions,
            'percentage' => round(($score / $total_questions) * 100, 2),
            'time_taken' => $time_taken
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error submitting test: " . $e->getMessage());
    Response::serverError('Failed to submit test');
}

?>
