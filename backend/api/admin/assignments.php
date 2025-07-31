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
                ta.subject,
                ta.class_level,
                ta.created_at,
                u.username,
                u.email,
                u.full_name,
                admin_user.full_name as assigned_by_name
            FROM teacher_assignments ta
            JOIN users u ON ta.teacher_id = u.id
            LEFT JOIN users admin_user ON ta.assigned_by = admin_user.id
            ORDER BY ta.created_at DESC
        ");
        
        $stmt->execute();
        $assignments = $stmt->fetchAll();
        
        // Group assignments by teacher for easier frontend handling
        $grouped_assignments = [];
        foreach ($assignments as $assignment) {
            $assignment['teacher'] = [
                'id' => $assignment['teacher_id'],
                'username' => $assignment['username'],
                'email' => $assignment['email'],
                'full_name' => $assignment['full_name']
            ];
            
            // Remove redundant fields
            unset($assignment['teacher_id'], $assignment['username'], 
                  $assignment['email'], $assignment['full_name']);
            
            $grouped_assignments[] = $assignment;
        }
        
        Response::logRequest('admin/assignments', 'GET', $user['id']);
        Response::success('Teacher assignments retrieved', ['assignments' => $grouped_assignments]);
        
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
        Response::validateRequired($input, ['teacher_id', 'subject', 'class_level']);
        
        // Validate teacher exists and is a teacher
        $teacher_check = $db->prepare("SELECT id FROM users WHERE id = ? AND role = 'teacher'");
        $teacher_check->execute([$input['teacher_id']]);
        
        if (!$teacher_check->fetch()) {
            Response::validationError('Invalid teacher selected');
        }
        
        // Check if assignment already exists
        $existing_check = $db->prepare("
            SELECT id FROM teacher_assignments 
            WHERE teacher_id = ? AND subject = ? AND class_level = ?
        ");
        $existing_check->execute([$input['teacher_id'], $input['subject'], $input['class_level']]);
        
        if ($existing_check->fetch()) {
            Response::validationError('Teacher is already assigned to this subject and class');
        }
        
        // Validate subject and class level (basic validation)
        $valid_subjects = [
            'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
            'Geography', 'History', 'Economics', 'Government', 'Literature',
            'Agricultural Science', 'Computer Science', 'Further Mathematics',
            'Civic Education', 'Trade/Business Studies'
        ];
        
        $valid_classes = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
        
        if (!in_array($input['subject'], $valid_subjects)) {
            Response::validationError('Invalid subject selected');
        }
        
        if (!in_array($input['class_level'], $valid_classes)) {
            Response::validationError('Invalid class level selected');
        }
        
        // Create assignment
        $stmt = $db->prepare("
            INSERT INTO teacher_assignments (teacher_id, subject, class_level, assigned_by)
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['teacher_id'],
            $input['subject'],
            $input['class_level'],
            $user['id']
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
        $check_stmt = $db->prepare("SELECT teacher_id, subject, class_level FROM teacher_assignments WHERE id = ?");
        $check_stmt->execute([$assignment_id]);
        $assignment = $check_stmt->fetch();
        
        if (!$assignment) {
            Response::notFound('Assignment not found');
        }
        
        // Check if teacher has questions for this subject/class
        $question_check = $db->prepare("
            SELECT COUNT(*) as question_count 
            FROM questions 
            WHERE teacher_id = ? AND subject = ? AND class_level = ?
        ");
        $question_check->execute([$assignment['teacher_id'], $assignment['subject'], $assignment['class_level']]);
        $question_result = $question_check->fetch();
        
        if ($question_result['question_count'] > 0) {
            Response::error('Cannot remove assignment. Teacher has existing questions for this subject/class.');
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
