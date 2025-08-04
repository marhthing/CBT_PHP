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
        SELECT id, total_questions as question_count, duration_minutes, is_active, expires_at, is_used, score_per_question, subject_id, class_level, term_id, session_id
        FROM test_codes 
        WHERE code = ?
    ");
    
    $stmt->execute([$test_code]);
    $test = $stmt->fetch();
    
    if (!$test) {
        Response::notFound('Test code not found');
    }
    
    if (!$test['is_active'] || ($test['expires_at'] && strtotime($test['expires_at']) < time())) {
        Response::error('Test is no longer available');
    }
    
    if ($test['is_used']) {
        Response::error('This test code has already been used');
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
    
    // Check if student has already taken a test for this subject, class, term, and session
    $duplicate_check_stmt = $db->prepare("
        SELECT tr.id FROM test_results tr
        JOIN test_codes tc ON tr.test_code_id = tc.id
        WHERE tr.student_id = ? 
        AND tc.subject_id = ? 
        AND tc.class_level = ? 
        AND tc.term_id = ? 
        AND tc.session_id = ?
    ");
    
    $duplicate_check_stmt->execute([
        $user['id'], 
        $test['subject_id'], 
        $test['class_level'], 
        $test['term_id'], 
        $test['session_id']
    ]);
    
    if ($duplicate_check_stmt->fetch()) {
        Response::error('You have already taken a test for this subject, class, term and session', 409);
    }
    
    // Validate time taken (allow 10% buffer)
    $max_time = $test['duration_minutes'] * 60 * 1.1; // 10% buffer
    if ($time_taken > $max_time) {
        Response::error('Test time exceeded');
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Get shuffled answer mappings from session
        session_start();
        $session_key = 'answer_mappings_' . $test['id'] . '_' . $user['id'];
        $answer_mappings = $_SESSION[$session_key] ?? null;
        
        if (!$answer_mappings) {
            // Fallback to original method if session data is missing
            $question_ids = array_keys($answers);
            $placeholders = implode(',', array_fill(0, count($question_ids), '?'));
            
            $correct_stmt = $db->prepare("
                SELECT id, correct_answer 
                FROM questions 
                WHERE id IN ($placeholders)
            ");
            
            $correct_stmt->execute($question_ids);
            $answer_mappings = $correct_stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        }
        
        // Calculate score using score_per_question and shuffled answers
        $correct_count = 0;
        $total_questions = count($answers);
        $score_per_question = (int)$test['score_per_question'];
        
        foreach ($answers as $question_id => $student_answer) {
            if (isset($answer_mappings[$question_id]) && 
                strtoupper($student_answer) === strtoupper($answer_mappings[$question_id])) {
                $correct_count++;
            }
        }
        
        // Clean up session data after use
        if (isset($_SESSION[$session_key])) {
            unset($_SESSION[$session_key]);
        }
        
        $score = $correct_count * $score_per_question;
        
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
            $is_correct = isset($answer_mappings[$question_id]) && 
                         strtoupper($student_answer) === strtoupper($answer_mappings[$question_id]);
            
            $answer_stmt->execute([$result_id, $question_id, strtoupper($student_answer), $is_correct ? 'true' : 'false']);
        }
        
        // Mark test code as used (permanently deactivated)
        $used_stmt = $db->prepare("
            UPDATE test_codes 
            SET status = 'used', is_used = true, used_at = CURRENT_TIMESTAMP, used_by = ?
            WHERE id = ?
        ");
        $used_stmt->execute([$user['id'], $test['id']]);
        
        $db->commit();
        
        Response::logRequest('student/submit-test', 'POST', $user['id']);
        
        $max_possible_score = $total_questions * $score_per_question;
        $percentage = round(($score / $max_possible_score) * 100, 2);
        
        Response::success('Test submitted successfully', [
            'result_id' => $result_id,
            'score' => $score,
            'total_questions' => $total_questions,
            'correct_answers' => $correct_count,
            'score_per_question' => $score_per_question,
            'max_possible_score' => $max_possible_score,
            'percentage' => $percentage,
            'time_taken' => $time_taken,
            'score_display' => "$score/$max_possible_score"
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    Response::serverError('Failed to submit test');
}

?>
