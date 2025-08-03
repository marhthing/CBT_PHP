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
    $user = $auth->requireRole('teacher');
    
    $database = new Database();
    $db = $database->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::validationError('Invalid JSON input');
    }
    
    // Validate required fields
    $required_fields = ['questions', 'subject_id', 'class_level', 'term_id', 'session_id'];
    Response::validateRequired($input, $required_fields);
    
    if (!is_array($input['questions']) || empty($input['questions'])) {
        Response::validationError('Questions array is required and cannot be empty');
    }
    
    // Check if teacher is assigned to this subject/class/term/session
    $assignment_stmt = $db->prepare("
        SELECT id FROM teacher_assignments 
        WHERE teacher_id = ? AND subject_id = ? AND class_level = ? AND term_id = ? AND session_id = ?
    ");
    $assignment_stmt->execute([$user['id'], $input['subject_id'], $input['class_level'], $input['term_id'], $input['session_id']]);
    
    if (!$assignment_stmt->fetch()) {
        Response::forbidden('You are not assigned to teach this subject/class/term/session');
    }
    
    $db->beginTransaction();
    
    try {
        $created_count = 0;
        $errors = [];
        
        $stmt = $db->prepare("
            INSERT INTO questions (
                question_text, question_type, option_a, option_b, option_c, option_d,
                correct_answer, subject_id, class_level, term_id, session_id, teacher_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($input['questions'] as $index => $question) {
            try {
                // Validate question fields
                $required_question_fields = ['question_text', 'question_type', 'option_a', 'option_b', 'correct_answer'];
                
                foreach ($required_question_fields as $field) {
                    if (!isset($question[$field]) || empty(trim($question[$field]))) {
                        $errors[] = "Question " . ($index + 1) . ": Missing required field '$field'";
                        continue 2;
                    }
                }
                
                // Validate question type
                if (!in_array($question['question_type'], ['multiple_choice', 'true_false'])) {
                    $errors[] = "Question " . ($index + 1) . ": Invalid question type";
                    continue;
                }
                

                
                // Validate correct answer
                if (!in_array(strtoupper($question['correct_answer']), ['A', 'B', 'C', 'D'])) {
                    $errors[] = "Question " . ($index + 1) . ": Correct answer must be A, B, C, or D";
                    continue;
                }
                
                // For multiple choice, validate options C and D
                if ($question['question_type'] === 'multiple_choice') {
                    if (empty(trim($question['option_c'] ?? '')) || empty(trim($question['option_d'] ?? ''))) {
                        $errors[] = "Question " . ($index + 1) . ": Multiple choice questions require options C and D";
                        continue;
                    }
                }
                
                // For true/false, validate correct answer is A or B
                if ($question['question_type'] === 'true_false') {
                    if (!in_array(strtoupper($question['correct_answer']), ['A', 'B'])) {
                        $errors[] = "Question " . ($index + 1) . ": True/False correct answer must be A or B";
                        continue;
                    }
                }
                
                $stmt->execute([
                    $question['question_text'],
                    $question['question_type'],
                    $question['option_a'],
                    $question['option_b'],
                    $question['option_c'] ?? '',
                    $question['option_d'] ?? '',
                    strtoupper($question['correct_answer']),
                    $input['subject_id'],
                    $input['class_level'],
                    $input['term_id'],
                    $input['session_id'],
                    $user['id']
                ]);
                
                $created_count++;
                
            } catch (Exception $e) {
                $errors[] = "Question " . ($index + 1) . ": " . $e->getMessage();
                continue;
            }
        }
        
        if ($created_count > 0) {
            $db->commit();
            
            $response_data = [
                'created_count' => $created_count,
                'total_submitted' => count($input['questions'])
            ];
            
            if (!empty($errors)) {
                $response_data['warnings'] = $errors;
            }
            
            Response::logRequest('teacher/questions/bulk', 'POST', $user['id']);
            Response::created(
                "Successfully created $created_count out of " . count($input['questions']) . " questions",
                $response_data
            );
        } else {
            $db->rollback();
            Response::validationError('No valid questions were created', ['errors' => $errors]);
        }
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error in bulk question creation: " . $e->getMessage());
    Response::serverError('Failed to create questions');
}