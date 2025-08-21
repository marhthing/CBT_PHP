<?php

// Dedicated delete endpoint for InfinityFree compatibility
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

// Only allow POST requests (using method override)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('admin');
    
    $database = new Database();
    $db = $database->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        Response::validationError('Question ID is required');
    }
    
    $question_id = $input['id'];
    
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
    
    Response::logRequest('admin/questions/delete', 'POST', $user['id']);
    Response::success('Question deleted successfully');
    
} catch (Exception $e) {
    Response::serverError('Failed to delete question: ' . $e->getMessage());
}

?>