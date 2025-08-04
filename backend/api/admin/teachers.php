<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

$auth = new Auth();
$user = $auth->requireRole('admin');

$database = new Database();
$db = $database->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGet($db, $user);
        break;
    case 'POST':
        handlePost($db, $user);
        break;
    case 'PUT':
        handlePut($db, $user);
        break;
    case 'DELETE':
        handleDelete($db, $user);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGet($db, $user) {
    try {
        // Get all teachers
        $stmt = $db->prepare("
            SELECT 
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.created_at,
                u.last_login,
                COUNT(DISTINCT ta.id) as assignment_count,
                COUNT(DISTINCT q.id) as question_count
            FROM users u
            LEFT JOIN teacher_assignments ta ON u.id = ta.teacher_id
            LEFT JOIN questions q ON u.id = q.teacher_id
            WHERE u.role = 'teacher'
            GROUP BY u.id, u.username, u.email, u.full_name, u.created_at, u.last_login
            ORDER BY u.created_at DESC
        ");
        
        $stmt->execute();
        $teachers = $stmt->fetchAll();
        
        Response::logRequest('admin/teachers', 'GET', $user['id']);
        Response::success('Teachers retrieved', ['teachers' => $teachers]);
        
    } catch (Exception $e) {
        Response::serverError('Failed to get teachers');
    }
}

function handlePost($db, $user) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Validate required fields
        Response::validateRequired($input, ['username', 'email', 'password', 'full_name']);
        
        // Validate email format
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            Response::validationError('Invalid email format');
        }
        
        // Validate password strength
        if (strlen($input['password']) < 6) {
            Response::validationError('Password must be at least 6 characters long');
        }
        
        // Check if username or email already exists
        $check_stmt = $db->prepare("
            SELECT id, username, email 
            FROM users 
            WHERE username = ? OR email = ?
        ");
        $check_stmt->execute([$input['username'], $input['email']]);
        $existing = $check_stmt->fetch();
        
        if ($existing) {
            if ($existing['username'] === $input['username']) {
                Response::validationError('Username already exists');
            }
            if ($existing['email'] === $input['email']) {
                Response::validationError('Email already exists');
            }
        }
        
        // Hash password
        $auth_helper = new Auth();
        $hashed_password = $auth_helper->hashPassword($input['password']);
        
        // Insert new teacher
        $stmt = $db->prepare("
            INSERT INTO users (username, email, password, role, full_name)
            VALUES (?, ?, ?, 'teacher', ?)
        ");
        
        $stmt->execute([
            $input['username'],
            $input['email'],
            $hashed_password,
            $input['full_name']
        ]);
        
        $teacher_id = $db->lastInsertId();
        
        Response::logRequest('admin/teachers', 'POST', $user['id']);
        Response::created('Teacher created successfully', ['teacher_id' => $teacher_id]);
        
    } catch (Exception $e) {
        Response::serverError('Failed to create teacher');
    }
}

function handlePut($db, $user) {
    try {
        $teacher_id = $_GET['id'] ?? null;
        
        if (!$teacher_id) {
            Response::validationError('Teacher ID is required');
        }
        
        // Check if teacher exists
        $check_stmt = $db->prepare("SELECT id FROM users WHERE id = ? AND role = 'teacher'");
        $check_stmt->execute([$teacher_id]);
        
        if (!$check_stmt->fetch()) {
            Response::notFound('Teacher not found');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Build update query dynamically
        $update_fields = [];
        $params = [];
        
        $allowed_fields = ['username', 'email', 'full_name', 'password'];
        
        foreach ($allowed_fields as $field) {
            if (isset($input[$field]) && !empty($input[$field])) {
                if ($field === 'email') {
                    if (!filter_var($input[$field], FILTER_VALIDATE_EMAIL)) {
                        Response::validationError('Invalid email format');
                    }
                    
                    // Check if email is already used by another user
                    $email_check = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                    $email_check->execute([$input[$field], $teacher_id]);
                    if ($email_check->fetch()) {
                        Response::validationError('Email already exists');
                    }
                } elseif ($field === 'username') {
                    // Check if username is already used by another user
                    $username_check = $db->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
                    $username_check->execute([$input[$field], $teacher_id]);
                    if ($username_check->fetch()) {
                        Response::validationError('Username already exists');
                    }
                } elseif ($field === 'password') {
                    if (strlen($input[$field]) < 6) {
                        Response::validationError('Password must be at least 6 characters long');
                    }
                    $auth_helper = new Auth();
                    $input[$field] = $auth_helper->hashPassword($input[$field]);
                }
                
                $update_fields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (empty($update_fields)) {
            Response::validationError('No valid fields to update');
        }
        
        $params[] = $teacher_id;
        
        $sql = "UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        Response::logRequest('admin/teachers', 'PUT', $user['id']);
        Response::updated('Teacher updated successfully');
        
    } catch (Exception $e) {
        Response::serverError('Failed to update teacher');
    }
}

function handleDelete($db, $user) {
    try {
        $teacher_id = $_GET['id'] ?? null;
        
        if (!$teacher_id) {
            Response::validationError('Teacher ID is required');
        }
        
        // Check if teacher exists
        $check_stmt = $db->prepare("SELECT id FROM users WHERE id = ? AND role = 'teacher'");
        $check_stmt->execute([$teacher_id]);
        
        if (!$check_stmt->fetch()) {
            Response::notFound('Teacher not found');
        }
        
        // Check if teacher has questions
        $question_check = $db->prepare("SELECT COUNT(*) as question_count FROM questions WHERE teacher_id = ?");
        $question_check->execute([$teacher_id]);
        $question_result = $question_check->fetch();
        
        if ($question_result['question_count'] > 0) {
            Response::error('Cannot delete teacher with existing questions. Please reassign or delete questions first.');
        }
        
        // Begin transaction
        $db->beginTransaction();
        
        try {
            // Delete teacher assignments first
            $delete_assignments = $db->prepare("DELETE FROM teacher_assignments WHERE teacher_id = ?");
            $delete_assignments->execute([$teacher_id]);
            
            // Delete teacher
            $delete_teacher = $db->prepare("DELETE FROM users WHERE id = ?");
            $delete_teacher->execute([$teacher_id]);
            
            $db->commit();
            
            Response::logRequest('admin/teachers', 'DELETE', $user['id']);
            Response::deleted('Teacher deleted successfully');
            
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        Response::serverError('Failed to delete teacher');
    }
}

?>
