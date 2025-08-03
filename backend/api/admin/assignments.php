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
    case 'DELETE':
        handleDelete($db, $user);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGet($db, $user) {
    try {
        // Get all teacher assignments with teacher information
        $stmt = $db->prepare("
            SELECT 
                ta.id,
                ta.teacher_id,
                ta.subject_id,
                ta.class_level,
                ta.created_at,
                u.username,
                u.email,
                u.full_name,
                s.name as subject_name,
                t.name as term_name,
                sess.name as session_name
            FROM teacher_assignments ta
            JOIN users u ON ta.teacher_id = u.id
            JOIN subjects s ON ta.subject_id = s.id
            JOIN terms t ON ta.term_id = t.id
            JOIN sessions sess ON ta.session_id = sess.id
            ORDER BY ta.created_at DESC
        ");
        
        $stmt->execute();
        $assignments = $stmt->fetchAll();
        
        // Format assignments for frontend
        $formatted_assignments = [];
        foreach ($assignments as $assignment) {
            $formatted_assignments[] = [
                'id' => $assignment['id'],
                'teacher_id' => $assignment['teacher_id'],
                'teacher_name' => $assignment['full_name'],
                'teacher_email' => $assignment['email'],
                'subject_id' => $assignment['subject_id'],
                'subject_name' => $assignment['subject_name'],
                'class_level' => $assignment['class_level'],
                'created_at' => $assignment['created_at'],
                'assigned_by_name' => 'Administrator' // Default since we don't have this field
            ];
        }
        
        Response::logRequest('admin/assignments', 'GET', $user['id']);
        Response::success('Teacher assignments retrieved', $formatted_assignments);
        
    } catch (Exception $e) {
        error_log("Error getting teacher assignments: " . $e->getMessage());
        Response::serverError('Failed to get teacher assignments');
    }
}

function handlePost($db, $user) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Validate required fields
        Response::validateRequired($input, ['teacher_id', 'subject_id', 'class_level', 'term_id', 'session_id']);
        
        // Validate teacher exists and is a teacher
        $teacher_check = $db->prepare("SELECT id FROM users WHERE id = ? AND role = 'teacher'");
        $teacher_check->execute([$input['teacher_id']]);
        
        if (!$teacher_check->fetch()) {
            Response::validationError('Invalid teacher selected');
        }
        
        // Check if assignment already exists
        $existing_check = $db->prepare("
            SELECT id FROM teacher_assignments 
            WHERE teacher_id = ? AND subject_id = ? AND class_level = ? AND term_id = ? AND session_id = ?
        ");
        $existing_check->execute([$input['teacher_id'], $input['subject_id'], $input['class_level'], $input['term_id'], $input['session_id']]);
        
        if ($existing_check->fetch()) {
            Response::validationError('Teacher is already assigned to this subject and class');
        }
        
        // Validate subject exists in database
        $subject_check = $db->prepare("SELECT id FROM subjects WHERE id = ?");
        $subject_check->execute([$input['subject_id']]);
        
        if (!$subject_check->fetch()) {
            Response::validationError('Invalid subject selected');
        }
        
        $valid_classes = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
        
        if (!in_array($input['class_level'], $valid_classes)) {
            Response::validationError('Invalid class level selected');
        }
        
        // Create assignment
        $stmt = $db->prepare("
            INSERT INTO teacher_assignments (teacher_id, subject_id, class_level, term_id, session_id)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['teacher_id'],
            $input['subject_id'],
            $input['class_level'],
            $input['term_id'],
            $input['session_id']
        ]);
        
        $assignment_id = $db->lastInsertId();
        
        Response::logRequest('admin/assignments', 'POST', $user['id']);
        Response::created('Teacher assignment created successfully', ['assignment_id' => $assignment_id]);
        
    } catch (Exception $e) {
        error_log("Error creating teacher assignment: " . $e->getMessage());
        Response::serverError('Failed to create teacher assignment');
    }
}

function handleDelete($db, $user) {
    try {
        $assignment_id = $_GET['id'] ?? null;
        
        if (!$assignment_id) {
            Response::validationError('Assignment ID is required');
        }
        
        // Check if assignment exists
        $check_stmt = $db->prepare("SELECT id FROM teacher_assignments WHERE id = ?");
        $check_stmt->execute([$assignment_id]);
        $assignment = $check_stmt->fetch();
        
        if (!$assignment) {
            Response::notFound('Assignment not found');
        }
        
        // Delete assignment
        $stmt = $db->prepare("DELETE FROM teacher_assignments WHERE id = ?");
        $stmt->execute([$assignment_id]);
        
        Response::logRequest('admin/assignments', 'DELETE', $user['id']);
        Response::deleted('Teacher assignment removed successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting teacher assignment: " . $e->getMessage());
        Response::serverError('Failed to delete teacher assignment');
    }
}

?>
