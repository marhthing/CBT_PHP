<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('student');
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::validationError('Invalid JSON input');
    }
    
    // Validate required fields
    Response::validateRequired($input, ['test_code']);
    
    $test_code = strtoupper(trim($input['test_code']));
    
    // Revert test code from "using" back to "active" status
    // Only allow if the current user is the one who put it in "using" status
    $stmt = $db->prepare("
        UPDATE test_codes 
        SET status = 'active', used_by = NULL, used_at = NULL
        WHERE code = ? AND status = 'using' AND used_by = ?
    ");
    
    $stmt->execute([$test_code, $user['id']]);
    
    if ($stmt->rowCount() > 0) {
        Response::logRequest('student/cancel-test-code', 'POST', $user['id']);
        Response::success('Test code cancelled successfully');
    } else {
        Response::badRequest('Test code not found or cannot be cancelled');
    }

} catch (Exception $e) {
    error_log("Cancel test code error: " . $e->getMessage());
    Response::serverError('Failed to cancel test code');
}

?>