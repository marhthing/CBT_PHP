<?php

require_once __DIR__ . '/../../../cors.php';
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../includes/response.php';

// Get the request method
$request_method = $_SERVER['REQUEST_METHOD'];

// Initialize auth and verify admin role
$auth = new Auth();
$user = $auth->getCurrentUser();

if (!$user || $user['role'] !== 'admin') {
    Response::unauthorized('Admin access required');
}

try {
    if ($request_method === 'GET') {
        $subject_id = $_GET['subject_id'] ?? null;
        
        if (!$subject_id) {
            Response::badRequest('Subject ID is required');
        }
        
        // Get database connection
        require_once __DIR__ . '/../../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        
        // Count questions for the subject
        $stmt = $db->prepare("
            SELECT COUNT(*) as count 
            FROM questions 
            WHERE subject_id = ?
        ");
        $stmt->execute([$subject_id]);
        $result = $stmt->fetch();
        
        Response::success('Question count retrieved', [
            'count' => (int)$result['count'],
            'subject_id' => $subject_id
        ]);
    } else {
        Response::methodNotAllowed('Only GET method is allowed');
    }
} catch (Exception $e) {
    Response::error('Failed to get question count', 500);
}
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
    $session_id = $_GET['session_id'] ?? null;

    if (!$subject_id || !$class_level || !$term_id || !$session_id) {
        Response::validationError('subject_id, class_level, term_id, and session_id are required');
    }

    // Build query with filters
    $where_conditions = [
        'q.subject_id = ?',
        'q.class_level = ?',
        'q.term_id = ?',
        'q.session_id = ?'
    ];
    $params = [$subject_id, $class_level, $term_id, $session_id];

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
        'session_id' => (int)$session_id
    ]);

} catch (Exception $e) {
    Response::serverError('Failed to get question count: ' . $e->getMessage());
}

?>
