<?php
session_start();
require_once '../config/db.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

// Only allow teachers and admins to fetch questions
if (!in_array($_SESSION['role'], ['teacher', 'admin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Insufficient permissions']);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list':
            handleListQuestions();
            break;
        case 'search':
            handleSearchQuestions();
            break;
        case 'count':
            handleCountQuestions();
            break;
        case 'by_criteria':
            handleQuestionsByCriteria();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Get questions error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error occurred']);
}

/**
 * Handle listing questions with pagination
 */
function handleListQuestions() {
    global $db;
    
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(50, max(10, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    
    // Build WHERE clause based on user role
    $whereConditions = ['1=1'];
    $params = [];
    
    if ($_SESSION['role'] === 'teacher') {
        $whereConditions[] = 'q.created_by = ?';
        $params[] = $_SESSION['user_id'];
    }
    
    // Add filters
    if (!empty($_GET['class_id'])) {
        $whereConditions[] = 'q.class_id = ?';
        $params[] = $_GET['class_id'];
    }
    
    if (!empty($_GET['subject_id'])) {
        $whereConditions[] = 'q.subject_id = ?';
        $params[] = $_GET['subject_id'];
    }
    
    if (!empty($_GET['session'])) {
        $whereConditions[] = 'q.session = ?';
        $params[] = $_GET['session'];
    }
    
    if (!empty($_GET['term'])) {
        $whereConditions[] = 'q.term = ?';
        $params[] = $_GET['term'];
    }
    
    if (!empty($_GET['test_type'])) {
        $whereConditions[] = 'q.test_type = ?';
        $params[] = $_GET['test_type'];
    }
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total 
                   FROM questions q 
                   WHERE " . implode(' AND ', $whereConditions);
    $totalCount = $db->fetch($countQuery, $params)['total'];
    
    // Get questions with details
    $query = "SELECT q.*, c.name as class_name, s.name as subject_name, 
              u.full_name as creator_name, u.role as creator_role
              FROM questions q
              JOIN classes c ON q.class_id = c.id
              JOIN subjects s ON q.subject_id = s.id
              JOIN users u ON q.created_by = u.id
              WHERE " . implode(' AND ', $whereConditions) . "
              ORDER BY q.created_at DESC
              LIMIT ? OFFSET ?";
    
    $questions = $db->fetchAll($query, array_merge($params, [$limit, $offset]));
    
    // Format questions for response
    $formattedQuestions = [];
    foreach ($questions as $question) {
        $formattedQuestions[] = [
            'id' => $question['id'],
            'question_text' => $question['question_text'],
            'class_name' => $question['class_name'],
            'subject_name' => $question['subject_name'],
            'session' => $question['session'],
            'term' => $question['term'],
            'test_type' => $question['test_type'],
            'correct_option' => $question['correct_option'],
            'has_image' => !empty($question['image']),
            'image' => $question['image'],
            'creator_name' => $question['creator_name'],
            'creator_role' => $question['creator_role'],
            'created_at' => $question['created_at'],
            'options' => [
                'A' => $question['option_a'],
                'B' => $question['option_b'],
                'C' => $question['option_c'],
                'D' => $question['option_d']
            ]
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $formattedQuestions,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => ceil($totalCount / $limit),
            'total_items' => $totalCount,
            'items_per_page' => $limit,
            'has_next' => $page < ceil($totalCount / $limit),
            'has_prev' => $page > 1
        ]
    ]);
}

/**
 * Handle searching questions by text
 */
function handleSearchQuestions() {
    global $db;
    
    $searchTerm = trim($_GET['q'] ?? '');
    if (empty($searchTerm)) {
        echo json_encode(['success' => false, 'message' => 'Search term required']);
        return;
    }
    
    $limit = min(50, max(10, (int)($_GET['limit'] ?? 20)));
    
    // Build WHERE clause
    $whereConditions = ['(q.question_text ILIKE ? OR q.option_a ILIKE ? OR q.option_b ILIKE ? OR q.option_c ILIKE ? OR q.option_d ILIKE ?)'];
    $searchPattern = '%' . $searchTerm . '%';
    $params = [$searchPattern, $searchPattern, $searchPattern, $searchPattern, $searchPattern];
    
    if ($_SESSION['role'] === 'teacher') {
        $whereConditions[] = 'q.created_by = ?';
        $params[] = $_SESSION['user_id'];
    }
    
    $query = "SELECT q.*, c.name as class_name, s.name as subject_name, 
              u.full_name as creator_name
              FROM questions q
              JOIN classes c ON q.class_id = c.id
              JOIN subjects s ON q.subject_id = s.id
              JOIN users u ON q.created_by = u.id
              WHERE " . implode(' AND ', $whereConditions) . "
              ORDER BY q.created_at DESC
              LIMIT ?";
    
    $questions = $db->fetchAll($query, array_merge($params, [$limit]));
    
    $formattedQuestions = [];
    foreach ($questions as $question) {
        $formattedQuestions[] = [
            'id' => $question['id'],
            'question_text' => $question['question_text'],
            'class_name' => $question['class_name'],
            'subject_name' => $question['subject_name'],
            'session' => $question['session'],
            'term' => $question['term'],
            'test_type' => $question['test_type'],
            'creator_name' => $question['creator_name'],
            'created_at' => $question['created_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $formattedQuestions,
        'search_term' => $searchTerm,
        'total_found' => count($formattedQuestions)
    ]);
}

/**
 * Handle counting questions by criteria
 */
function handleCountQuestions() {
    global $db;
    
    $classId = $_GET['class_id'] ?? '';
    $subjectId = $_GET['subject_id'] ?? '';
    $session = $_GET['session'] ?? '';
    $term = $_GET['term'] ?? '';
    $testType = $_GET['test_type'] ?? '';
    
    if (empty($classId) || empty($subjectId) || empty($session) || empty($term) || empty($testType)) {
        echo json_encode(['success' => false, 'message' => 'All criteria required']);
        return;
    }
    
    $whereConditions = ['class_id = ?', 'subject_id = ?', 'session = ?', 'term = ?', 'test_type = ?'];
    $params = [$classId, $subjectId, $session, $term, $testType];
    
    if ($_SESSION['role'] === 'teacher') {
        $whereConditions[] = 'created_by = ?';
        $params[] = $_SESSION['user_id'];
    }
    
    $query = "SELECT COUNT(*) as total FROM questions WHERE " . implode(' AND ', $whereConditions);
    $result = $db->fetch($query, $params);
    
    // Get breakdown by creator
    $creatorQuery = "SELECT u.full_name, u.role, COUNT(q.id) as question_count
                     FROM questions q
                     JOIN users u ON q.created_by = u.id
                     WHERE " . implode(' AND ', $whereConditions) . "
                     GROUP BY u.id, u.full_name, u.role
                     ORDER BY question_count DESC";
    $creators = $db->fetchAll($creatorQuery, $params);
    
    echo json_encode([
        'success' => true,
        'total' => (int)$result['total'],
        'criteria' => [
            'class_id' => $classId,
            'subject_id' => $subjectId,
            'session' => $session,
            'term' => $term,
            'test_type' => $testType
        ],
        'breakdown_by_creator' => $creators
    ]);
}

/**
 * Handle getting questions by specific criteria for test generation
 */
function handleQuestionsByCriteria() {
    global $db;
    
    $classId = $_GET['class_id'] ?? '';
    $subjectId = $_GET['subject_id'] ?? '';
    $session = $_GET['session'] ?? '';
    $term = $_GET['term'] ?? '';
    $testType = $_GET['test_type'] ?? '';
    $randomize = filter_var($_GET['randomize'] ?? true, FILTER_VALIDATE_BOOLEAN);
    $limit = (int)($_GET['limit'] ?? 0);
    
    if (empty($classId) || empty($subjectId) || empty($session) || empty($term) || empty($testType)) {
        echo json_encode(['success' => false, 'message' => 'All criteria required']);
        return;
    }
    
    $whereConditions = ['class_id = ?', 'subject_id = ?', 'session = ?', 'term = ?', 'test_type = ?'];
    $params = [$classId, $subjectId, $session, $term, $testType];
    
    if ($_SESSION['role'] === 'teacher') {
        $whereConditions[] = 'created_by = ?';
        $params[] = $_SESSION['user_id'];
    }
    
    $query = "SELECT id, question_text, option_a, option_b, option_c, option_d, 
              correct_option, image, difficulty
              FROM questions 
              WHERE " . implode(' AND ', $whereConditions);
    
    if ($randomize) {
        $query .= " ORDER BY RANDOM()";
    } else {
        $query .= " ORDER BY created_at ASC";
    }
    
    if ($limit > 0) {
        $query .= " LIMIT ?";
        $params[] = $limit;
    }
    
    $questions = $db->fetchAll($query, $params);
    
    $formattedQuestions = [];
    foreach ($questions as $question) {
        $formattedQuestions[] = [
            'id' => $question['id'],
            'question_text' => $question['question_text'],
            'options' => [
                'A' => $question['option_a'],
                'B' => $question['option_b'],
                'C' => $question['option_c'],
                'D' => $question['option_d']
            ],
            'correct_option' => $question['correct_option'],
            'image' => $question['image'],
            'difficulty' => $question['difficulty'] ?? 'medium'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $formattedQuestions,
        'total' => count($formattedQuestions),
        'criteria' => [
            'class_id' => $classId,
            'subject_id' => $subjectId,
            'session' => $session,
            'term' => $term,
            'test_type' => $testType
        ],
        'randomized' => $randomize
    ]);
}
?>
