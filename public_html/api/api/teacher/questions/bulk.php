<?php

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../includes/response.php';

$auth = new Auth();
$user = $auth->requireRole('teacher');

$database = new Database();
$db = $database->getConnection();

function validateTeacherAssignment($db, $user_id, $subject_id, $class_level, $term_id, $session_id) {
    $stmt = $db->prepare("
        SELECT COUNT(*) as count 
        FROM teacher_assignments 
        WHERE teacher_id = ? AND subject_id = ? AND class_level = ? AND term_id = ? AND session_id = ?
    ");
    $stmt->execute([$user_id, $subject_id, $class_level, $term_id, $session_id]);
    $result = $stmt->fetch();
    return $result['count'] > 0;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        Response::validationError('Invalid JSON input');
    }


    // Validate required fields
    Response::validateRequired($input, ['questions', 'subject_id', 'class_level', 'term_id', 'session_id']);

    $subject_id = (int)$input['subject_id'];
    $class_level = $input['class_level'];
    $term_id = (int)$input['term_id'];
    $session_id = (int)$input['session_id'];
    $questions = $input['questions'];

    if (!is_array($questions) || empty($questions)) {
        Response::validationError('Questions array is required and cannot be empty');
    }

    // Check if teacher is assigned to this subject/class/term/session
    if (!validateTeacherAssignment($db, $user['id'], $subject_id, $class_level, $term_id, $session_id)) {
        Response::forbidden('You are not assigned to teach this subject/class/term/session');
    }

    // Validate each question
    $errors = [];
    $valid_questions = [];

    foreach ($questions as $index => $question) {
        $question_errors = [];

        // Determine question type (default to multiple_choice if not specified)
        $question_type = $question['question_type'] ?? 'multiple_choice';

        if (!in_array($question_type, ['multiple_choice', 'true_false'])) {
            $question_errors[] = "Question " . ($index + 1) . ": Invalid question type";
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

        Response::logRequest('teacher/questions/bulk', 'POST', $user['id']);

        Response::success('Questions created successfully', [
            'created_count' => $created_count,
            'total_questions' => count($questions)
        ]);

    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }

} catch (Exception $e) {
    error_log("Teacher bulk questions error: " . $e->getMessage());
    Response::serverError('Failed to create questions: ' . $e->getMessage());
}

?>