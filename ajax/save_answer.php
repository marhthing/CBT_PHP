<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

$sessionId = $_POST['session_id'] ?? '';
$answers = json_decode($_POST['answers'] ?? '[]', true);

if (empty($sessionId) || !is_array($answers)) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

// Verify session belongs to current user
if (!isset($_SESSION['test_session']) || $_SESSION['test_session']['id'] !== $sessionId) {
    echo json_encode(['success' => false, 'message' => 'Invalid session']);
    exit;
}

try {
    // Save/update answers in session for now
    // In a production system, you might want to save to database for better persistence
    if (!isset($_SESSION['test_answers'])) {
        $_SESSION['test_answers'] = [];
    }
    
    foreach ($answers as $questionId => $answer) {
        $_SESSION['test_answers'][$questionId] = $answer;
    }
    
    echo json_encode([
        'success' => true, 
        'message' => 'Answers saved',
        'timestamp' => time()
    ]);
    
} catch (Exception $e) {
    error_log("Save answer error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to save answers']);
}
?>
