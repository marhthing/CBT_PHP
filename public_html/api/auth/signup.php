<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::methodNotAllowed();
}

try {
    // Get database connection
    $conn = getDatabaseConnection();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        Response::validationError('Invalid JSON input');
    }
    
    // Validate required fields
    $required_fields = ['username', 'password', 'role', 'full_name'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            Response::validationError("Field '$field' is required");
        }
    }
    
    // Sanitize input
    $username = trim($input['username']);
    $email = isset($input['email']) ? trim($input['email']) : null;
    $reg_number = isset($input['reg_number']) ? trim($input['reg_number']) : null;
    $password = $input['password']; // Don't trim password
    $role = trim($input['role']);
    $full_name = trim($input['full_name']);
    $class_level = isset($input['class_level']) ? trim($input['class_level']) : null;
    
    // Validate role
    $allowed_roles = ['student', 'teacher', 'admin'];
    if (!in_array($role, $allowed_roles)) {
        Response::validationError('Invalid role specified');
    }
    
    // Role-specific validation
    if ($role === 'student' && !$reg_number) {
        Response::validationError('Registration number is required for students');
    }
    
    if (($role === 'teacher' || $role === 'admin') && !$email) {
        Response::validationError('Email is required for teachers and admins');
    }
    
    // Validate password strength
    if (strlen($password) < 6) {
        Response::validationError('Password must be at least 6 characters long');
    }
    
    // Validate email format if provided
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::validationError('Invalid email format');
    }
    
    // Check for duplicate username
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        Response::validationError('Username already exists');
    }
    
    // Check for duplicate email if provided
    if ($email) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            Response::validationError('Email already exists');
        }
    }
    
    // Check for duplicate registration number if provided
    if ($reg_number) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE reg_number = ?");
        $stmt->execute([$reg_number]);
        if ($stmt->fetch()) {
            Response::validationError('Registration number already exists');
        }
    }
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user
    $stmt = $conn->prepare("
        INSERT INTO users (username, email, reg_number, password, role, full_name, class_level, is_active, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
    ");
    
    $success = $stmt->execute([
        $username,
        $email,
        $reg_number,
        $password_hash,
        $role,
        $full_name,
        $class_level
    ]);
    
    if (!$success) {
        Response::serverError('Failed to create user account');
    }
    
    // Get the new user ID
    $user_id = $conn->lastInsertId();
    
    // Log the registration
    Response::logRequest('auth/signup', 'POST', $user_id);
    
    Response::success('User account created successfully', [
        'user_id' => $user_id,
        'username' => $username,
        'role' => $role,
        'full_name' => $full_name
    ]);
    
} catch (Exception $e) {
    Response::serverError('An error occurred during registration: ' . $e->getMessage());
}
?>