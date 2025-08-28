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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

$auth = new Auth();
$user = $auth->requireRole('admin');

$database = new Database();
$db = $database->getConnection();

try {
    // Get parameters
    $subject_id = $_GET['subject_id'] ?? null;
    $class_level = $_GET['class_level'] ?? null;
    $term_id = $_GET['term_id'] ?? null;
    $test_type = $_GET['test_type'] ?? null;

    if (!$subject_id || !$class_level || !$term_id || !$test_type) {
        Response::validationError('subject_id, class_level, term_id, and test_type are required');
    }

    // Build query based on test type
    $where_conditions = [
        'q.subject_id = ?',
        'q.class_level = ?',
        'q.term_id = ?'
    ];
    $params = [$subject_id, $class_level, $term_id];

    // Filter by question_assignment based on test_type
    if ($test_type === 'First CA') {
        $where_conditions[] = 'q.question_assignment = ?';
        $params[] = 'First CA';
    } elseif ($test_type === 'Second CA') {
        $where_conditions[] = 'q.question_assignment = ?';
        $params[] = 'Second CA';
    }
    // For 'Examination' test_type, include all questions (no additional filter)

    $where_clause = implode(' AND ', $where_conditions);
    
    $count_stmt = $db->prepare("
        SELECT COUNT(*) as question_count
        FROM questions q
        WHERE {$where_clause}
    ");
    $count_stmt->execute($params);
    $result = $count_stmt->fetch();
    
    Response::logRequest('admin/questions/count', 'GET', $user['id']);
    Response::success('Question count retrieved', [
        'count' => (int)$result['question_count'],
        'subject_id' => (int)$subject_id,
        'class_level' => $class_level,
        'term_id' => (int)$term_id,
        'test_type' => $test_type
    ]);

} catch (Exception $e) {
    Response::serverError('Failed to get question count: ' . $e->getMessage());
}

?>