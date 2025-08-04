<?php

require_once __DIR__ . '/../../../con.php';
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