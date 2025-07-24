<?php
session_start();
require_once '../config/config.php';
require_once '../config/db.php';
require_once '../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../index.php');
    exit();
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$role = $_POST['role'] ?? '';

if (empty($username) || empty($password) || empty($role)) {
    header('Location: ../index.php?error=All fields are required');
    exit();
}

try {
    // Check user credentials based on role
    $query = "SELECT * FROM users WHERE username = ? AND role = ? AND active = true";
    $user = $db->fetch($query, [$username, $role]);
    
    if ($user && password_verify($password, $user['password'])) {
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];
        
        // Additional session data based on role
        if ($role === 'student') {
            $_SESSION['matric_number'] = $user['matric_number'];
            $_SESSION['class_id'] = $user['class_id'];
        }
        
        // Redirect to appropriate dashboard
        switch ($role) {
            case 'student':
                header('Location: ../student/dashboard.php');
                break;
            case 'teacher':
                header('Location: ../teacher/dashboard.php');
                break;
            case 'admin':
                header('Location: ../admin/dashboard.php');
                break;
        }
        exit();
    } else {
        header('Location: ../index.php?error=Invalid credentials');
        exit();
    }
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    header('Location: ../index.php?error=Login failed. Please try again.');
    exit();
}
?>
