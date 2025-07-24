<?php
require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/config/config.php';

// Security functions
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function validateRole($allowedRoles) {
    if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], $allowedRoles)) {
        if (!headers_sent()) {
            header('Location: ../index.php?error=Access denied');
        } else {
            echo '<script>window.location.href = "../index.php?error=Access denied";</script>';
        }
        exit();
    }
}

// File upload functions
function uploadImage($file) {
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return false;
    }
    
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_IMAGE_TYPES)) {
        return false;
    }
    
    if ($file['size'] > MAX_FILE_SIZE) {
        return false;
    }
    
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $uploadPath = UPLOAD_PATH . $filename;
    
    if (!is_dir(UPLOAD_PATH)) {
        mkdir(UPLOAD_PATH, 0755, true);
    }
    
    if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
        return $filename;
    }
    
    return false;
}

// Question functions
function shuffleQuestions($questions) {
    shuffle($questions);
    return $questions;
}

function shuffleOptions($question) {
    $options = [
        'A' => $question['option_a'],
        'B' => $question['option_b'],
        'C' => $question['option_c'],
        'D' => $question['option_d']
    ];
    
    $correctOption = $question['correct_option'];
    $correctAnswer = $options[$correctOption];
    
    $shuffledOptions = $options;
    shuffle($shuffledOptions);
    
    // Find new position of correct answer
    $newCorrectOption = array_search($correctAnswer, $shuffledOptions);
    $optionKeys = ['A', 'B', 'C', 'D'];
    $newCorrectKey = $optionKeys[$newCorrectOption];
    
    return [
        'question' => $question,
        'options' => $shuffledOptions,
        'correct_option' => $newCorrectKey,
        'original_correct' => $correctOption
    ];
}

// CSRF Token functions
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Activity logging
function logActivity($userId, $action, $details = '') {
    try {
        $db = new Database();
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        
        $query = "INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent, timestamp) VALUES (?, ?, ?, ?, ?, NOW())";
        $db->execute($query, [$userId, $action, $details, $ipAddress, $userAgent]);
    } catch (Exception $e) {
        error_log("Failed to log activity: " . $e->getMessage());
    }
}

// Time formatting
function formatTime($seconds) {
    $hours = floor($seconds / 3600);
    $minutes = floor(($seconds % 3600) / 60);
    $seconds = $seconds % 60;
    
    if ($hours > 0) {
        return sprintf("%02d:%02d:%02d", $hours, $minutes, $seconds);
    } else {
        return sprintf("%02d:%02d", $minutes, $seconds);
    }
}

// Get classes and subjects
function getClasses() {
    $db = new Database();
    return $db->fetchAll("SELECT * FROM classes ORDER BY name");
}

function getSubjects() {
    $db = new Database();
    return $db->fetchAll("SELECT * FROM subjects ORDER BY name");
}

function getTeacherAssignments($teacherId) {
    $db = new Database();
    $query = "SELECT ta.*, c.name as class_name, s.name as subject_name 
              FROM teacher_assignments ta 
              JOIN classes c ON ta.class_id = c.id 
              JOIN subjects s ON ta.subject_id = s.id 
              WHERE ta.teacher_id = ?";
    return $db->fetchAll($query, [$teacherId]);
}

// Session and term management
function getSessions() {
    return [
        '2023/2024', '2024/2025', '2025/2026'
    ];
}

function getTerms() {
    return [
        'First Term', 'Second Term', 'Third Term'
    ];
}

function getTestTypes() {
    return [
        'CA' => 'Continuous Assessment',
        'Exam' => 'Examination'
    ];
}

// School settings functions
function getSchoolSetting($key, $default = '') {
    try {
        $db = new Database();
        $query = "SELECT setting_value FROM settings WHERE setting_key = ?";
        $result = $db->fetch($query, [$key]);
        return $result ? $result['setting_value'] : $default;
    } catch (Exception $e) {
        error_log("Failed to get school setting: " . $e->getMessage());
        return $default;
    }
}

function getSchoolName() {
    return getSchoolSetting('school_name', 'CBT Portal');
}

function getSchoolAbbreviation() {
    return getSchoolSetting('school_abbreviation', 'CBT');
}
?>
