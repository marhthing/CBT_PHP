<?php

// Extra CORS headers for InfinityFree compatibility
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
require_once __DIR__ . '/../../../services/DataManager.php';

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
    require_once __DIR__ . '/../../../services/ConstantsService.php';
    $constants = ConstantsService::getInstance();
    $question_assignment = $input['question_assignment'] ?? $constants->getDefaultAssignmentType();
    
    if (!is_array($questions) || empty($questions)) {
        Response::validationError('Questions must be a non-empty array');
    }
    
    // Use DataManager for validation
    $data = DataManager::getInstance();
    
    // Validate all required fields
    if (!$data->isValidClassLevel($class_level)) {
        Response::validationError('Invalid class level');
    }
    
    if (!$data->isValidSubject($subject_id)) {
        Response::validationError('Invalid subject selected');
    }
    
    if (!$data->isValidTerm($term_id)) {
        Response::validationError('Invalid term selected');
    }
    
    if (!$data->isValidSession($session_id)) {
        Response::validationError('Invalid session selected');
    }
    
    if (!$data->isValidAssignment($question_assignment)) {
        Response::validationError('Invalid assignment type selected');
    }

    // Get valid question types from ConstantsService
    require_once __DIR__ . '/../../../services/ConstantsService.php';
    $constants = ConstantsService::getInstance();
    $validQuestionTypes = array_values($constants->getQuestionTypes());
    $defaultQuestionType = $constants->getDefaultQuestionType();

    // Validate questions
    $valid_questions = [];
    $errors = [];
    
    foreach ($questions as $index => $question) {
        $question_errors = [];
        
        // Determine question type (default from ConstantsService if not specified)
        $question_type = $question['question_type'] ?? $defaultQuestionType;
        
        if (!in_array($question_type, $validQuestionTypes)) {
            $validTypesString = implode(', ', $validQuestionTypes);
            $question_errors[] = "Question " . ($index + 1) . ": Question type must be one of: {$validTypesString}";
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
                $valid_answers = $constants->getAnswerOptions();
                if (!in_array($correct_answer, $valid_answers)) {
                    $answer_options = implode(', ', $valid_answers);
                    $question_errors[] = "Question " . ($index + 1) . ": For Multiple Choice questions, correct answer must be one of: $answer_options";
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
                correct_answer, question_type, subject_id, class_level, term_id, session_id, teacher_id, question_assignment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                $user['id'],
                $question_assignment
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