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
                    COUNT(CASE WHEN q.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as questions_this_week,
                    COUNT(DISTINCT q.teacher_id) as active_teachers,
                    ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT q.teacher_id), 0), 1) as avg_questions_per_teacher,
                    COUNT(DISTINCT tc.id) as total_tests,
                    COUNT(DISTINCT CASE WHEN tc.is_active = true AND tc.expires_at > CURRENT_TIMESTAMP THEN tc.id END) as active_tests,
                    COUNT(DISTINCT u.id) as total_teachers,
                    COUNT(DISTINCT ta.teacher_id) as assigned_teachers,
                    COUNT(DISTINCT tr.id) as total_submissions,
                    COUNT(CASE WHEN tr.submitted_at >= CURRENT_DATE THEN 1 END) as submissions_today
                FROM questions q
                LEFT JOIN users u ON u.role = 'teacher'
                LEFT JOIN teacher_assignments ta ON ta.teacher_id = u.id
                LEFT JOIN test_codes tc ON 1=1
                LEFT JOIN test_results tr ON 1=1
            ");
            $stats_stmt->execute();
            $stats = $stats_stmt->fetch();
            
            // Get subject statistics
            $subject_stats_stmt = $db->prepare("
                SELECT subject, COUNT(*) as question_count
                FROM questions 
                GROUP BY subject
                ORDER BY question_count DESC
            ");
            $subject_stats_stmt->execute();
            $subject_stats = $subject_stats_stmt->fetchAll();
            
            // Get class statistics
            $class_stats_stmt = $db->prepare("
                SELECT class_level, COUNT(*) as question_count
                FROM questions 
                GROUP BY class_level
                ORDER BY class_level
            ");
            $class_stats_stmt->execute();
            $class_stats = $class_stats_stmt->fetchAll();
            
            $stats['subject_stats'] = $subject_stats;
            $stats['class_stats'] = $class_stats;
            
            Response::success('Admin stats retrieved', $stats);
        }
        
        // Check if requesting subjects only
        if (isset($_GET['subjects'])) {
            $subjects_stmt = $db->prepare("
                SELECT DISTINCT subject
                FROM questions 
                ORDER BY subject
            ");
            $subjects_stmt->execute();
            $subjects = $subjects_stmt->fetchAll(PDO::FETCH_COLUMN);
            
            Response::success('Subjects retrieved', ['subjects' => $subjects]);
        }
        
        // Build query with filters
        $where_conditions = ['1=1'];
        $params = [];
        
        if (isset($_GET['search']) && !empty($_GET['search'])) {
            $where_conditions[] = 'q.question_text ILIKE ?';
            $params[] = '%' . $_GET['search'] . '%';
        }
        
        if (isset($_GET['subject']) && !empty($_GET['subject'])) {
            $where_conditions[] = 'q.subject = ?';
            $params[] = $_GET['subject'];
        }
        
        if (isset($_GET['class']) && !empty($_GET['class'])) {
            $where_conditions[] = 'q.class_level = ?';
            $params[] = $_GET['class'];
        }
        
        if (isset($_GET['teacher']) && !empty($_GET['teacher'])) {
            $where_conditions[] = 'q.teacher_id = ?';
            $params[] = $_GET['teacher'];
        }
        
        if (isset($_GET['difficulty']) && !empty($_GET['difficulty'])) {
            $where_conditions[] = 'q.difficulty = ?';
            $params[] = $_GET['difficulty'];
        }
        
        // Get all questions with teacher information
        $sql = "
            SELECT 
                q.id,
                q.question_text,
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
                q.correct_answer,
                q.subject,
                q.class_level,
                q.difficulty,
                q.created_at,
                u.full_name as teacher_name,
                u.username as teacher_username
            FROM questions q
            LEFT JOIN users u ON q.teacher_id = u.id
            WHERE " . implode(' AND ', $where_conditions) . "
            ORDER BY q.created_at DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $questions = $stmt->fetchAll();
        
        Response::logRequest('admin/questions', 'GET', $user['id']);
        Response::success('Questions retrieved', ['questions' => $questions]);
        
    } catch (Exception $e) {
        error_log("Error getting admin questions: " . $e->getMessage());
        Response::serverError('Failed to get questions');
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
        $usage_stmt = $db->prepare("
            SELECT COUNT(*) as usage_count 
            FROM test_answers ta
            JOIN test_results tr ON ta.result_id = tr.id
            WHERE ta.question_id = ?
        ");
        $usage_stmt->execute([$question_id]);
        $usage = $usage_stmt->fetch();
        
        if ($usage['usage_count'] > 0) {
            Response::error('Cannot delete question that has been used in tests');
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
