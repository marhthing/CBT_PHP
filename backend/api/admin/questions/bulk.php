<?php

require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../includes/response.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('admin');
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::validationError('Invalid JSON data');
    }
    
    // Validate required fields
    $required_fields = ['questions', 'subject_id', 'class_level', 'term_id', 'session_id'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            Response::validationError("Missing required field: $field");
        }
    }
    
    $questions = $input['questions'];
    $subject_id = $input['subject_id'];
    $class_level = $input['class_level'];
    $term_id = $input['term_id'];
    $session_id = $input['session_id'];
    
    if (!is_array($questions) || empty($questions)) {
        Response::validationError('Questions must be a non-empty array');
    }
    
    // Validate questions
    $valid_questions = [];
    $errors = [];
    
    foreach ($questions as $index => $question) {
        $question_errors = [];
        
        // Determine question type (default to multiple_choice if not specified)
        $question_type = $question['question_type'] ?? 'multiple_choice';
        
        if (!in_array($question_type, ['multiple_choice', 'true_false'])) {
            $question_errors[] = "Question " . ($index + 1) . ": Question type must be multiple_choice or true_false";
        }
        
        // Required fields based on question type
        if ($question_type === 'true_false') {
            $required_question_fields = [
                'question_text', 'option_a', 'option_b', 'correct_answer'
            ];
        } else {
            $required_question_fields = [
                'question_text', 'option_a', 'option_b', 'option_c', 
                'option_d', 'correct_answer'
            ];
        }
        
        foreach ($required_question_fields as $field) {
            if (!isset($question[$field]) || trim($question[$field]) === '') {
                $question_errors[] = "Question " . ($index + 1) . ": Missing $field";
            }
        }
        
        // Validate correct answer based on question type
        if (isset($question['correct_answer'])) {
            $correct_answer = strtoupper($question['correct_answer']);
            if ($question_type === 'true_false') {
                if (!in_array($correct_answer, ['A', 'B'])) {
                    $question_errors[] = "Question " . ($index + 1) . ": For True/False questions, correct answer must be A or B";
                }
            } else {
                if (!in_array($correct_answer, ['A', 'B', 'C', 'D'])) {
                    $question_errors[] = "Question " . ($index + 1) . ": For Multiple Choice questions, correct answer must be A, B, C, or D";
                }
            }
        }
        
        if (empty($question_errors)) {
            $valid_questions[] = [
                'question_text' => trim($question['question_text']),
                'option_a' => trim($question['option_a']),
                'option_b' => trim($question['option_b']),
                'option_c' => $question_type === 'true_false' ? null : trim($question['option_c']),
                'option_d' => $question_type === 'true_false' ? null : trim($question['option_d']),
                'correct_answer' => strtoupper(trim($question['correct_answer'])),
                'question_type' => $question_type
            ];
        } else {
            $errors = array_merge($errors, $question_errors);
        }
    }
    
    if (!empty($errors)) {
        Response::validationError('Validation errors found', ['errors' => $errors]);
    }
    
    if (empty($valid_questions)) {
        Response::validationError('No valid questions to create');
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Insert valid questions
        $stmt = $db->prepare("
            INSERT INTO questions (
                question_text, option_a, option_b, option_c, option_d,
                correct_answer, question_type, subject_id, class_level, term_id, session_id, teacher_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $created_count = 0;
        foreach ($valid_questions as $question) {
            $stmt->execute([
                $question['question_text'],
                $question['option_a'],
                $question['option_b'],
                $question['option_c'],
                $question['option_d'],
                $question['correct_answer'],
                $question['question_type'],
                $subject_id,
                $class_level,
                $term_id,
                $session_id,
                $user['id']
            ]);
            $created_count++;
        }
        
        $db->commit();
        
        Response::logRequest('admin/questions/bulk', 'POST', $user['id']);
        
        Response::success('Questions created successfully', [
            'created_count' => $created_count,
            'total_questions' => count($questions)
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    Response::error('Failed to create questions: ' . $e->getMessage());
}

?>