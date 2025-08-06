<?php
// Prevent any output before JSON
ob_start();

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->getCurrentUser();

    if (!$user) {
        Response::unauthorized('Invalid or expired token');
    }

    // Log request
    Response::logRequest('auth/me', 'GET', $user['id']);

    Response::success('User data retrieved', [
        'user' => $user
    ]);

} catch (Exception $e) {
    // Ensure any buffered output is cleaned before sending a server error response
    ob_end_clean();
    Response::serverError('Failed to get user data');
}

// Flush the output buffer
ob_end_flush();

?>