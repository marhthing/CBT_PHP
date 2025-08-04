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
Response::checkRateLimit('auto_login_' . $ip, 10, 300); // 10 attempts per 5 minutes

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::validationError('Invalid JSON input');
    }
    
    // Validate required fields
    Response::validateRequired($input, ['identifier', 'password']);
    
    // Sanitize input
    $identifier = Response::sanitizeInput($input['identifier']);
    $password = $input['password']; // Don't sanitize password
    
    // Try to authenticate with each role in order: student, teacher, admin
    $auth = new Auth();
    $user = null;
    $detected_role = null;
    
    // First try student (using reg_number)
    $user = $auth->authenticate($identifier, $password, 'student');
    if ($user) {
        $detected_role = 'student';
    } else {
        // Try teacher (using email/username)
        $user = $auth->authenticate($identifier, $password, 'teacher');
        if ($user) {
            $detected_role = 'teacher';
        } else {
            // Try admin (using email/username)
            $user = $auth->authenticate($identifier, $password, 'admin');
            if ($user) {
                $detected_role = 'admin';
            }
        }
    }
    
    if (!$user) {
        // Log failed login attempt
        Response::unauthorized('Invalid credentials');
    }
    
    // Generate JWT token
    $token_identifier = ($detected_role === 'student' && $user['reg_number']) ? $user['reg_number'] : $user['username'];
    $token = $auth->generateToken($user['id'], $token_identifier, $user['role']);
    
    // Log successful login
    Response::logRequest('auth/auto-login', 'POST', $user['id']);
    
    Response::success('Login successful', [
        'token' => $token,
        'user' => $user,
        'detected_role' => $detected_role
    ]);
    
} catch (Exception $e) {
    Response::serverError('Login failed');
}

?>