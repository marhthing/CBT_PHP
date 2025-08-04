<?php

require_once __DIR__ . '/../../con.php';
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
    Response::validateRequired($input, ['identifier', 'password', 'role']);
    
    // Sanitize input
    $identifier = Response::sanitizeInput($input['identifier']); // Can be reg_number, email, or username
    $password = $input['password']; // Don't sanitize password
    $role = Response::sanitizeInput($input['role']);
    
    // Validate role
    $allowed_roles = ['student', 'teacher', 'admin'];
    if (!in_array($role, $allowed_roles)) {
        Response::validationError('Invalid role specified');
    }
    
    // Authenticate user
    $auth = new Auth();
    $user = $auth->authenticate($identifier, $password, $role);
    
    if (!$user) {
        // Log failed login attempt
        Response::unauthorized('Invalid credentials');
    }
    
    // Generate JWT token - use reg_number for students, username for others
    $token_identifier = ($role === 'student' && $user['reg_number']) ? $user['reg_number'] : $user['username'];
    $token = $auth->generateToken($user['id'], $token_identifier, $user['role']);
    
    // Log successful login
    Response::logRequest('auth/login', 'POST', $user['id']);
    
    Response::success('Login successful', [
        'token' => $token,
        'user' => $user
    ]);
    
} catch (Exception $e) {
    Response::serverError('Login failed');
}

?>
