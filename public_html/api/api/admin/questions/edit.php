<?php

// Dedicated edit endpoint for InfinityFree compatibility
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Authorization, Bearer");
header("Access-Control-Max-Age: 3600");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../includes/response.php';

// Only allow POST requests (using method override)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('admin');
    
    $database = new Database();
    $db = $database->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::validationError('Invalid JSON input');
    }
    
    // Get question ID from input since URL routing might not work
    if (!isset($input['id'])) {
        Response::validationError('Question ID is required');
    }
    
    $question_id = $input['id'];
    
    // Check if question exists
    $check_stmt = $db->prepare("SELECT id FROM questions WHERE id = ?");
    $check_stmt->execute([$question_id]);
    
    if (!$check_stmt->fetch()) {
        Response::notFound('Question not found');
    }
    
    // Determine question type (default to multiple_choice if not specified)
    $question_type = $input['question_type'] ?? 'multiple_choice';
    
    if (!in_array($question_type, ['multiple_choice', 'true_false'])) {
        Response::validationError('Question type must be multiple_choice or true_false');
    }
    
    // Validate required fields based on question type
    if ($question_type === 'true_false') {
        Response::validateRequired($input, [
            'question_text', 'option_a', 'option_b',
            'correct_answer', 'subject_id', 'class_level', 'term_id', 'session_id'
        ]);
        
        // For true/false, correct answer must be A or B
        if (!in_array($input['correct_answer'], ['A', 'B'])) {
            Response::validationError('For True/False questions, correct answer must be A or B');
        }
    } else {
        Response::validateRequired($input, [
            'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'subject_id', 'class_level', 'term_id', 'session_id'
        ]);
        
        // For multiple choice, correct answer must be A, B, C, or D
        if (!in_array($input['correct_answer'], ['A', 'B', 'C', 'D'])) {
            Response::validationError('For Multiple Choice questions, correct answer must be A, B, C, or D');
        }
    }
    
    // Validate foreign keys exist
    $checks = [
        ['subjects', 'id', $input['subject_id'], 'Subject'],
        ['terms', 'id', $input['term_id'], 'Term'],
        ['sessions', 'id', $input['session_id'], 'Session']
    ];
    
    foreach ($checks as [$table, $column, $value, $name]) {
        $check_stmt = $db->prepare("SELECT id FROM {$table} WHERE {$column} = ? AND is_active = " . $database->getBooleanTrue());
        $check_stmt->execute([$value]);
        if (!$check_stmt->fetch()) {
            Response::validationError("Invalid {$name} selected");
        }
    }
    
    // Validate class level
    $check_stmt = $db->prepare("SELECT name FROM class_levels WHERE name = ? AND is_active = " . $database->getBooleanTrue());
    $check_stmt->execute([$input['class_level']]);
    if (!$check_stmt->fetch()) {
        Response::validationError('Invalid class level');
    }
    
    // Update question
    $stmt = $db->prepare("
        UPDATE questions SET
            question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?,
            correct_answer = ?, question_type = ?, subject_id = ?, class_level = ?, 
            term_id = ?, session_id = ?
        WHERE id = ?
    ");
    
    $stmt->execute([
        $input['question_text'],
        $input['option_a'],
        $input['option_b'],
        $question_type === 'true_false' ? null : $input['option_c'],
        $question_type === 'true_false' ? null : $input['option_d'],
        $input['correct_answer'],
        $question_type,
        $input['subject_id'],
        $input['class_level'],
        $input['term_id'],
        $input['session_id'],
        $question_id
    ]);
    
    Response::logRequest('admin/questions/edit', 'POST', $user['id']);
    Response::success('Question updated successfully');
    
} catch (Exception $e) {
    Response::serverError('Failed to update question: ' . $e->getMessage());
}

?>