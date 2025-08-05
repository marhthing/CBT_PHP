<?php
// Simple login test for InfinityFree debugging
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Load database configuration
    require_once __DIR__ . '/config/database.php';
    
    // Test database connection
    $conn = getDatabaseConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input', 'debug' => 'JSON decode failed']);
            exit;
        }
        
        $identifier = $input['identifier'] ?? '';
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? '';
        
        if (!$identifier || !$password || !$role) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields', 'debug' => compact('identifier', 'password', 'role')]);
            exit;
        }
        
        // Simple authentication test
        if ($role === 'admin') {
            $stmt = $conn->prepare("SELECT id, username, email, password, role, full_name FROM users WHERE email = ? AND role = 'admin' AND is_active = 1");
            $stmt->execute([$identifier]);
        } elseif ($role === 'teacher') {
            $stmt = $conn->prepare("SELECT id, username, email, password, role, full_name FROM users WHERE email = ? AND role = 'teacher' AND is_active = 1");
            $stmt->execute([$identifier]);
        } else {
            $stmt = $conn->prepare("SELECT id, username, email, reg_number, password, role, full_name FROM users WHERE reg_number = ? AND role = 'student' AND is_active = 1");
            $stmt->execute([$identifier]);
        }
        
        $user = $stmt->fetch();
        
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User not found', 'debug' => "No user found for $identifier with role $role"]);
            exit;
        }
        
        // Check password
        if (password_verify($password, $user['password'])) {
            unset($user['password']);
            echo json_encode(['success' => true, 'message' => 'Login successful', 'user' => $user]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid password', 'debug' => 'Password verification failed']);
        }
        
    } else {
        echo json_encode(['success' => true, 'message' => 'Test endpoint ready', 'method' => $_SERVER['REQUEST_METHOD']]);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]);
}
?>