<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

$auth = new Auth();
$user = $auth->requireRole('admin');

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGet($db, $user);
        break;
    case 'POST':
        handlePost($db, $user);
        break;
    case 'DELETE':
        handleDelete($db, $user);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGet($db, $user) {
    try {
        // Check if requesting stats
        if (isset($_GET['stats'])) {
            $stats_stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_questions,
                    COUNT(DISTINCT s.name) as subjects_count,
                    COUNT(CASE WHEN q.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week
                FROM questions q
                JOIN subjects s ON q.subject_id = s.id
            ");
            $stats_stmt->execute();
            $stats = $stats_stmt->fetch();
            
            // Get questions by subject
            $subject_stmt = $db->prepare("
                SELECT s.name as subject_name, COUNT(*) as question_count
                FROM questions q
                JOIN subjects s ON q.subject_id = s.id
                GROUP BY s.id, s.name
                ORDER BY question_count DESC
            ");
            $subject_stmt->execute();
            $by_subject = $subject_stmt->fetchAll();
            
            $stats['by_subject'] = array_column($by_subject, 'question_count', 'subject_name');
            $stats['subjects_count'] = count($by_subject);
            
            Response::success('Question stats retrieved', $stats);
            return;
        }
        
        // Build query with filters for getting questions
        $where_conditions = ['1 = 1'];
        $params = [];
        
        if (isset($_GET['search']) && !empty($_GET['search'])) {
            $where_conditions[] = 'q.question_text ILIKE ?';
            $params[] = '%' . $_GET['search'] . '%';
        }
        
        if (isset($_GET['subject']) && !empty($_GET['subject'])) {
            $where_conditions[] = 'q.subject_id = ?';
            $params[] = $_GET['subject'];
        }
        
        if (isset($_GET['class']) && !empty($_GET['class'])) {
            $where_conditions[] = 'q.class_level = ?';
            $params[] = $_GET['class'];
        }
        
        if (isset($_GET['type']) && !empty($_GET['type'])) {
            $where_conditions[] = 'q.question_type = ?';
            $params[] = $_GET['type'];
        }
        
        $limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
        $offset = max(0, intval($_GET['offset'] ?? 0));
        
        $where_clause = implode(' AND ', $where_conditions);
        
        $stmt = $db->prepare("
            SELECT 
                q.id,
                q.question_text,
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
                q.correct_answer,
                q.class_level,
                q.created_at,
                s.name as subject_name,
                s.id as subject_id,
                u.full_name as created_by_name,
                'multiple_choice' as question_type
            FROM questions q
            JOIN subjects s ON q.subject_id = s.id
            JOIN users u ON q.teacher_id = u.id
            WHERE {$where_clause}
            ORDER BY q.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt->execute($params);
        $questions = $stmt->fetchAll();
        
        // Format options for each question
        foreach ($questions as &$question) {
            $question['options'] = [
                ['label' => 'A', 'text' => $question['option_a']],
                ['label' => 'B', 'text' => $question['option_b']],
                ['label' => 'C', 'text' => $question['option_c']],
                ['label' => 'D', 'text' => $question['option_d']]
            ];
        }
        
        Response::logRequest('admin/questions', 'GET', $user['id']);
        Response::success('Questions retrieved', ['questions' => $questions]);
        
    } catch (Exception $e) {
        error_log("Error getting questions: " . $e->getMessage());
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
        Response::validateRequired($input, [
            'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'subject_id', 'class_level', 'term_id', 'session_id'
        ]);
        
        // Validate correct answer
        if (!in_array($input['correct_answer'], ['A', 'B', 'C', 'D'])) {
            Response::validationError('Correct answer must be A, B, C, or D');
        }
        
        // Validate class level
        $valid_classes = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
        if (!in_array($input['class_level'], $valid_classes)) {
            Response::validationError('Invalid class level');
        }
        
        // Validate foreign keys exist
        $checks = [
            ['subjects', 'id', $input['subject_id'], 'Subject'],
            ['terms', 'id', $input['term_id'], 'Term'],
            ['sessions', 'id', $input['session_id'], 'Session']
        ];
        
        foreach ($checks as [$table, $column, $value, $name]) {
            $check_stmt = $db->prepare("SELECT id FROM {$table} WHERE {$column} = ? AND is_active = true");
            $check_stmt->execute([$value]);
            if (!$check_stmt->fetch()) {
                Response::validationError("Invalid {$name} selected");
            }
        }
        
        // Create question (using admin as teacher_id since admin is creating it)
        $stmt = $db->prepare("
            INSERT INTO questions (
                question_text, option_a, option_b, option_c, option_d,
                correct_answer, subject_id, class_level, term_id, session_id, teacher_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['question_text'],
            $input['option_a'],
            $input['option_b'],
            $input['option_c'],
            $input['option_d'],
            $input['correct_answer'],
            $input['subject_id'],
            $input['class_level'],
            $input['term_id'],
            $input['session_id'],
            $user['id'] // Admin as teacher_id
        ]);
        
        $question_id = $db->lastInsertId();
        
        Response::logRequest('admin/questions', 'POST', $user['id']);
        Response::created('Question created successfully', ['question_id' => $question_id]);
        
    } catch (Exception $e) {
        error_log("Error creating question: " . $e->getMessage());
        Response::serverError('Failed to create question');
    }
}

function handleDelete($db, $user) {
    try {
        $question_id = $_GET['id'] ?? null;
        
        if (!$question_id) {
            Response::validationError('Question ID is required');
        }
        
        // Check if question exists
        $check_stmt = $db->prepare("SELECT id FROM questions WHERE id = ?");
        $check_stmt->execute([$question_id]);
        
        if (!$check_stmt->fetch()) {
            Response::notFound('Question not found');
        }
        
        // Check if question is used in any test results
        $usage_check = $db->prepare("
            SELECT COUNT(*) as usage_count 
            FROM test_answers 
            WHERE question_id = ?
        ");
        $usage_check->execute([$question_id]);
        $usage_result = $usage_check->fetch();
        
        if ($usage_result['usage_count'] > 0) {
            Response::error('Cannot delete question. It has been used in tests.');
        }
        
        // Delete question
        $stmt = $db->prepare("DELETE FROM questions WHERE id = ?");
        $stmt->execute([$question_id]);
        
        Response::logRequest('admin/questions', 'DELETE', $user['id']);
        Response::deleted('Question deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting question: " . $e->getMessage());
        Response::serverError('Failed to delete question');
    }
}

?>