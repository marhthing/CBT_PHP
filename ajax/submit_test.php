<?php
session_start();
require_once '../config/db.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

$sessionId = $_POST['session_id'] ?? '';
$testCodeId = $_POST['test_code_id'] ?? '';
$answers = json_decode($_POST['answers'] ?? '[]', true);

if (empty($sessionId) || empty($testCodeId) || !is_array($answers)) {
    echo json_encode(['success' => false, 'message' => 'Invalid data provided']);
    exit;
}

// Verify session belongs to current user
if (!isset($_SESSION['test_session']) || $_SESSION['test_session']['id'] !== $sessionId) {
    echo json_encode(['success' => false, 'message' => 'Invalid test session']);
    exit;
}

// Check if test has already been submitted
$existingQuery = "SELECT id FROM test_results WHERE student_id = ? AND test_code_id = ?";
$existing = $db->fetch($existingQuery, [$_SESSION['user_id'], $testCodeId]);

if ($existing) {
    echo json_encode(['success' => false, 'message' => 'Test already submitted']);
    exit;
}

try {
    $db->getConnection()->beginTransaction();
    
    // Get test details
    $testQuery = "SELECT * FROM test_codes WHERE id = ? AND active = true";
    $test = $db->fetch($testQuery, [$testCodeId]);
    
    if (!$test) {
        throw new Exception('Test code not found or inactive');
    }
    
    // Get questions for this test
    $questionsQuery = "SELECT * FROM questions 
                       WHERE class_id = ? AND subject_id = ? AND session = ? AND term = ? AND test_type = ?";
    $allQuestions = $db->fetchAll($questionsQuery, [
        $test['class_id'], 
        $test['subject_id'], 
        $test['session'], 
        $test['term'], 
        $test['test_type']
    ]);
    
    // Create a map of question IDs to correct answers
    $correctAnswers = [];
    foreach ($allQuestions as $question) {
        $correctAnswers[$question['id']] = $question['correct_option'];
    }
    
    // Calculate score
    $score = 0;
    $correctCount = 0;
    $wrongCount = 0;
    $questionsAnswered = count($answers);
    
    foreach ($answers as $questionId => $studentAnswer) {
        if (isset($correctAnswers[$questionId])) {
            if ($correctAnswers[$questionId] === $studentAnswer) {
                $score += $test['score_per_question'];
                $correctCount++;
            } else {
                $wrongCount++;
            }
        }
    }
    
    $totalScore = $test['num_questions'] * $test['score_per_question'];
    
    // Calculate time taken
    $startTime = $_SESSION['test_session']['start_time'];
    $timeTaken = time() - $startTime;
    
    // Insert test result
    $insertQuery = "INSERT INTO test_results (
        student_id, test_code_id, score, total_score, time_taken, 
        questions_answered, correct_answers, wrong_answers, 
        answers_json, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    
    $db->execute($insertQuery, [
        $_SESSION['user_id'],
        $testCodeId,
        $score,
        $totalScore,
        $timeTaken,
        $questionsAnswered,
        $correctCount,
        $wrongCount,
        json_encode($answers)
    ]);
    
    $resultId = $db->lastInsertId();
    
    // Clear test session
    unset($_SESSION['test_session']);
    unset($_SESSION['test_questions']);
    unset($_SESSION['test_answers']);
    
    $db->getConnection()->commit();
    
    // Log activity
    logActivity($_SESSION['user_id'], 'Test Completed', 
               "Completed test code {$test['code']} with score {$score}/{$totalScore}");
    
    echo json_encode([
        'success' => true,
        'message' => 'Test submitted successfully',
        'result_id' => $resultId,
        'score' => $score,
        'total_score' => $totalScore,
        'percentage' => round(($score / $totalScore) * 100, 1)
    ]);
    
} catch (Exception $e) {
    $db->getConnection()->rollback();
    error_log("Test submission error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to submit test: ' . $e->getMessage()]);
}
?>
