<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('teacher');
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        Response::validationError('No file uploaded or upload error');
    }
    
    // Check file size (5MB max)
    $max_size = 5 * 1024 * 1024; // 5MB
    if ($_FILES['file']['size'] > $max_size) {
        Response::validationError('File size exceeds maximum limit (5MB)');
    }
    
    // Get form data
    $subject_id = $_POST['subject_id'] ?? '';
    $class_level = $_POST['class_level'] ?? '';
    $term_id = $_POST['term_id'] ?? '';
    $session_id = $_POST['session_id'] ?? '';
    
    if (empty($subject_id) || empty($class_level) || empty($term_id) || empty($session_id)) {
        Response::validationError('Subject, class level, term, and session are required');
    }
    
    // Check if teacher is assigned to this subject/class/term/session
    $assignment_stmt = $db->prepare("
        SELECT id FROM teacher_assignments 
        WHERE teacher_id = ? AND subject_id = ? AND class_level = ? AND term_id = ? AND session_id = ?
    ");
    $assignment_stmt->execute([(int)$user['id'], (int)$subject_id, (int)$class_level, (int)$term_id, (int)$session_id]);
    
    if (!$assignment_stmt->fetch()) {
        Response::forbidden('You are not assigned to teach this subject/class/term/session');
    }
    
    // Handle file upload
    $file_path = $_FILES['file']['tmp_name'];
    $file_extension = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
    
    // Parse file based on extension
    $questions_data = [];
    
    if ($file_extension === 'csv') {
        $questions_data = parseCsvFile($file_path);
    } elseif (in_array($file_extension, ['xls', 'xlsx'])) {
        // For Excel files, we'll convert to CSV first (simplified approach)
        // In production, you might want to use a library like PhpSpreadsheet
        Response::validationError('Excel files not supported in this version. Please use CSV format.');
    } else {
        Response::validationError('Unsupported file format. Please use CSV or Excel files.');
    }
    
    if (empty($questions_data)) {
        Response::validationError('No valid questions found in file');
    }
    
    // Validate and process questions
    $errors = [];
    $valid_questions = [];
    $row_number = 1; // Skip header row
    
    foreach ($questions_data as $row) {
        $row_number++;
        $validation_result = validateQuestionRow($row, $row_number);
        
        if ($validation_result['valid']) {
            $valid_questions[] = array_merge($validation_result['data'], [
                'subject_id' => $subject_id,
                'class_level' => $class_level,
                'term_id' => $term_id,
                'session_id' => $session_id,
                'teacher_id' => $user['id']
            ]);
        } else {
            $errors = array_merge($errors, $validation_result['errors']);
        }
    }
    
    if (empty($valid_questions)) {
        Response::validationError('No valid questions to import', $errors);
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Insert valid questions
        $stmt = $db->prepare("
            INSERT INTO questions (
                question_text, option_a, option_b, option_c, option_d,
                correct_answer, subject_id, class_level, term_id, session_id, teacher_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                $question['subject_id'],
                $question['class_level'],
                $question['term_id'],
                $question['session_id'],
                $question['teacher_id']
            ]);
            $created_count++;
        }
        
        $db->commit();
        
        Response::logRequest('teacher/bulk-upload', 'POST', $user['id']);
        
        $response_data = [
            'success' => true,
            'created_count' => $created_count,
            'skipped_count' => count($questions_data) - $created_count,
            'total_rows' => count($questions_data)
        ];
        
        if (!empty($errors)) {
            $response_data['errors'] = $errors;
        }
        
        Response::success('Bulk upload completed', $response_data);
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    Response::serverError('Bulk upload failed');
}

function parseCsvFile($file_path) {
    $questions = [];
    
    if (($handle = fopen($file_path, 'r')) !== FALSE) {
        // Skip header row
        $header = fgetcsv($handle);
        
        while (($data = fgetcsv($handle)) !== FALSE) {
            if (count($data) >= 6) {
                $questions[] = [
                    'question_text' => trim($data[0]),
                    'option_a' => trim($data[1]),
                    'option_b' => trim($data[2]),
                    'option_c' => trim($data[3]),
                    'option_d' => trim($data[4]),
                    'correct_answer' => strtoupper(trim($data[5]))
                ];
            }
        }
        fclose($handle);
    }
    
    return $questions;
}

function validateQuestionRow($row, $row_number) {
    $errors = [];
    
    // Check required fields
    $required_fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'];
    
    foreach ($required_fields as $field) {
        if (empty($row[$field])) {
            $errors[] = "Row $row_number: Missing $field";
        }
    }
    
    // Validate correct answer
    if (!empty($row['correct_answer']) && !in_array($row['correct_answer'], ['A', 'B', 'C', 'D'])) {
        $errors[] = "Row $row_number: Correct answer must be A, B, C, or D";
    }
    
    // Check minimum length for question and options
    if (!empty($row['question_text']) && strlen($row['question_text']) < 10) {
        $errors[] = "Row $row_number: Question text too short";
    }
    
    foreach (['option_a', 'option_b', 'option_c', 'option_d'] as $option) {
        if (!empty($row[$option]) && strlen($row[$option]) < 1) {
            $errors[] = "Row $row_number: Option $option is empty";
        }
    }
    
    return [
        'valid' => empty($errors),
        'data' => $row,
        'errors' => $errors
    ];
}

?>
