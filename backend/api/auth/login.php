<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

// Rate limiting
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
Response::checkRateLimit('login_' . $ip, 10, 300); // 10 attempts per 5 minutes

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::validationError('Invalid JSON input');
    }
    
    // Validate required fields
    Response::validateRequired($input, ['username', 'password', 'role']);
    
    // Sanitize input
    $username = Response::sanitizeInput($input['username']);
    $password = $input['password']; // Don't sanitize password
    $role = Response::sanitizeInput($input['role']);
    
    // Validate role
    $allowed_roles = ['student', 'teacher', 'admin'];
    if (!in_array($role, $allowed_roles)) {
        Response::validationError('Invalid role specified');
    }
    
    // Authenticate user
    $auth = new Auth();
    $user = $auth->authenticate($username, $password, $role);
    
    if (!$user) {
        // Log failed login attempt
        error_log("Failed login attempt for username: $username, role: $role, IP: $ip");
        Response::unauthorized('Invalid credentials');
    }
    
    // Generate JWT token
    $token = $auth->generateToken($user['id'], $user['username'], $user['role']);
    
    // Log successful login
    Response::logRequest('auth/login', 'POST', $user['id']);
    
    Response::success('Login successful', [
        'token' => $token,
        'user' => $user
    ]);
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    Response::serverError('Login failed');
}

?>
