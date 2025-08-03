<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

$auth = new Auth();
$user = $auth->requireRole('teacher');

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGet($db, $user);
        break;
    case 'POST':
        handlePost($db, $user);
        break;
    case 'PUT':
        handlePut($db, $user);
        break;
    case 'DELETE':
        handleDelete($db, $user);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGet($db, $user) {
    try {
        // Check if requesting count only
        if (isset($_GET['count_only'])) {
            $where_conditions = [];
            $params = [];
            
            // Add filters for subject_id, class_level, term_id, session_id
            if (isset($_GET['subject_id']) && !empty($_GET['subject_id'])) {
                $where_conditions[] = 'subject_id = ?';
                $params[] = $_GET['subject_id'];
            }
            
            if (isset($_GET['class_level']) && !empty($_GET['class_level'])) {
                $where_conditions[] = 'class_level = ?';
                $params[] = $_GET['class_level'];
            }
            
            if (isset($_GET['term_id']) && !empty($_GET['term_id'])) {
                $where_conditions[] = 'term_id = ?';
                $params[] = $_GET['term_id'];
            }
            
            if (isset($_GET['session_id']) && !empty($_GET['session_id'])) {
                $where_conditions[] = 'session_id = ?';
                $params[] = $_GET['session_id'];
            }
            
            $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
            
            $count_stmt = $db->prepare("
                SELECT COUNT(*) as total 
                FROM questions 
                $where_clause
            ");
            $count_stmt->execute($params);
            $result = $count_stmt->fetch();
            
            Response::success('Question count retrieved', ['total' => (int)$result['total']]);
        }
        
        // Check if requesting stats
        if (isset($_GET['stats'])) {
            $stats_stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_questions,
                    COUNT(DISTINCT subject_id) as subjects_count,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week
                FROM questions 
                WHERE teacher_id = ?
            ");
            $stats_stmt->execute([$user['id']]);
            $stats = $stats_stmt->fetch();
            
            // Get recent questions
            $recent_stmt = $db->prepare("
                SELECT id, question_text, subject_id, class_level, created_at
                FROM questions 
                WHERE teacher_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            ");
            $recent_stmt->execute([$user['id']]);
            $recent_questions = $recent_stmt->fetchAll();
            
            $stats['recent_questions'] = $recent_questions;
            
            Response::success('Stats retrieved', $stats);
        }
        
        // Build query with filters
        $where_conditions = ['teacher_id = ?'];
        $params = [$user['id']];
        
        if (isset($_GET['search']) && !empty($_GET['search'])) {
            $where_conditions[] = 'question_text ILIKE ?';
            $params[] = '%' . $_GET['search'] . '%';
        }
        
        if (isset($_GET['subject']) && !empty($_GET['subject'])) {
            $where_conditions[] = 'subject = ?';
            $params[] = $_GET['subject'];
        }
        
        if (isset($_GET['class']) && !empty($_GET['class'])) {
            $where_conditions[] = 'class_level = ?';
            $params[] = $_GET['class'];
        }
        
        $sql = "
            SELECT id, question_text, option_a, option_b, option_c, option_d,
                   correct_answer, subject, class_level, difficulty, created_at
            FROM questions 
            WHERE " . implode(' AND ', $where_conditions) . "
            ORDER BY created_at DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $questions = $stmt->fetchAll();
        
        Response::logRequest('teacher/questions', 'GET', $user['id']);
        Response::success('Questions retrieved', ['questions' => $questions]);
        
    } catch (Exception $e) {
        error_log("Error getting teacher questions: " . $e->getMessage());
        Response::serverError('Failed to get questions');
    }
}

function handlePost($db, $user) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Validate required fields
        $required_fields = [
            'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'subject', 'class_level', 'difficulty'
        ];
        Response::validateRequired($input, $required_fields);
        
        // Validate correct answer
        if (!in_array(strtoupper($input['correct_answer']), ['A', 'B', 'C', 'D'])) {
            Response::validationError('Correct answer must be A, B, C, or D');
        }
        
        // Validate difficulty
        if (!in_array($input['difficulty'], ['easy', 'medium', 'hard'])) {
            Response::validationError('Difficulty must be easy, medium, or hard');
        }
        
        // Check if teacher is assigned to this subject/class
        $assignment_stmt = $db->prepare("
            SELECT id FROM teacher_assignments 
            WHERE teacher_id = ? AND subject = ? AND class_level = ?
        ");
        $assignment_stmt->execute([$user['id'], $input['subject'], $input['class_level']]);
        
        if (!$assignment_stmt->fetch()) {
            Response::forbidden('You are not assigned to teach this subject/class');
        }
        
        // Insert question
        $stmt = $db->prepare("
            INSERT INTO questions (
                question_text, option_a, option_b, option_c, option_d,
                correct_answer, subject, class_level, difficulty, teacher_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['question_text'],
            $input['option_a'],
            $input['option_b'],
            $input['option_c'],
            $input['option_d'],
            strtoupper($input['correct_answer']),
            $input['subject'],
            $input['class_level'],
            $input['difficulty'],
            $user['id']
        ]);
        
        Response::logRequest('teacher/questions', 'POST', $user['id']);
        Response::created('Question created successfully', ['id' => $db->lastInsertId()]);
        
    } catch (Exception $e) {
        error_log("Error creating question: " . $e->getMessage());
        Response::serverError('Failed to create question');
    }
}

function handlePut($db, $user) {
    try {
        $question_id = $_GET['id'] ?? null;
        
        if (!$question_id) {
            Response::validationError('Question ID is required');
        }
        
        // Check if question belongs to teacher
        $check_stmt = $db->prepare("SELECT id FROM questions WHERE id = ? AND teacher_id = ?");
        $check_stmt->execute([$question_id, $user['id']]);
        
        if (!$check_stmt->fetch()) {
            Response::forbidden('Question not found or access denied');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Build update query dynamically
        $update_fields = [];
        $params = [];
        
        $allowed_fields = [
            'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'subject', 'class_level', 'difficulty'
        ];
        
        foreach ($allowed_fields as $field) {
            if (isset($input[$field])) {
                if ($field === 'correct_answer') {
                    if (!in_array(strtoupper($input[$field]), ['A', 'B', 'C', 'D'])) {
                        Response::validationError('Correct answer must be A, B, C, or D');
                    }
                    $update_fields[] = "$field = ?";
                    $params[] = strtoupper($input[$field]);
                } elseif ($field === 'difficulty') {
                    if (!in_array($input[$field], ['easy', 'medium', 'hard'])) {
                        Response::validationError('Difficulty must be easy, medium, or hard');
                    }
                    $update_fields[] = "$field = ?";
                    $params[] = $input[$field];
                } else {
                    $update_fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
        }
        
        if (empty($update_fields)) {
            Response::validationError('No valid fields to update');
        }
        
        $params[] = $question_id;
        
        $sql = "UPDATE questions SET " . implode(', ', $update_fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        Response::logRequest('teacher/questions', 'PUT', $user['id']);
        Response::updated('Question updated successfully');
        
    } catch (Exception $e) {
        error_log("Error updating question: " . $e->getMessage());
        Response::serverError('Failed to update question');
    }
}

function handleDelete($db, $user) {
    try {
        $question_id = $_GET['id'] ?? null;
        
        if (!$question_id) {
            Response::validationError('Question ID is required');
        }
        
        // Check if question belongs to teacher
        $check_stmt = $db->prepare("SELECT id FROM questions WHERE id = ? AND teacher_id = ?");
        $check_stmt->execute([$question_id, $user['id']]);
        
        if (!$check_stmt->fetch()) {
            Response::forbidden('Question not found or access denied');
        }
        
        // Delete question
        $stmt = $db->prepare("DELETE FROM questions WHERE id = ?");
        $stmt->execute([$question_id]);
        
        Response::logRequest('teacher/questions', 'DELETE', $user['id']);
        Response::deleted('Question deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting question: " . $e->getMessage());
        Response::serverError('Failed to delete question');
    }
}

?>
