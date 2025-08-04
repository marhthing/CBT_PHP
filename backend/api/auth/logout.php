<?php

require_once __DIR__ . '/../../con.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->getCurrentUser();
    
    if ($user) {
        // Log logout
        Response::logRequest('auth/logout', 'POST', $user['id']);
        
        // In a JWT-based system, logout is mainly handled client-side
        // But we can log the event and potentially blacklist the token
        // For now, we'll just return success
        
        Response::success('Logged out successfully');
    } else {
        Response::success('Already logged out');
    }
    
} catch (Exception $e) {
    Response::serverError('Logout failed');
}

?>
