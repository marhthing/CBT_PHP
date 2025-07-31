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
    case 'PATCH':
        handlePatch($db, $user);
        break;
    case 'DELETE':
        handleDelete($db, $user);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGet($db, $user) {
    try {
        // Check if requesting recent test codes
        if (isset($_GET['recent'])) {
            $stmt = $db->prepare("
                SELECT id, code, title, subject, class_level, question_count, is_active, created_at
                FROM test_codes 
                ORDER BY created_at DESC 
                LIMIT 10
            ");
            $stmt->execute();
            $test_codes = $stmt->fetchAll();
            
            Response::success('Recent test codes retrieved', ['test_codes' => $test_codes]);
        }
        
        // Get all test codes
        $stmt = $db->prepare("
            SELECT 
                tc.id,
                tc.code,
                tc.title,
                tc.subject,
                tc.class_level,
                tc.duration_minutes,
                tc.question_count,
                tc.is_active,
                tc.expires_at,
                tc.created_at,
                u.full_name as created_by_name,
                COUNT(tr.id) as submission_count
            FROM test_codes tc
            LEFT JOIN users u ON tc.created_by = u.id
            LEFT JOIN test_results tr ON tc.id = tr.test_code_id
            GROUP BY tc.id, u.full_name
            ORDER BY tc.created_at DESC
        ");
        
        $stmt->execute();
        $test_codes = $stmt->fetchAll();
        
        Response::logRequest('admin/test-codes', 'GET', $user['id']);
        Response::success('Test codes retrieved', ['test_codes' => $test_codes]);
        
    } catch (Exception $e) {
        error_log("Error getting test codes: " . $e->getMessage());
        Response::serverError('Failed to get test codes');
    }
}

function handlePost($db, $user) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Validate required fields
        $required_fields = ['title', 'subject', 'class_level', 'duration_minutes', 'question_count', 'expires_at'];
        Response::validateRequired($input, $required_fields);
        
        // Validate numeric fields
        if ($input['duration_minutes'] < 5 || $input['duration_minutes'] > 180) {
            Response::validationError('Duration must be between 5 and 180 minutes');
        }
        
        if ($input['question_count'] < 1 || $input['question_count'] > 100) {
            Response::validationError('Question count must be between 1 and 100');
        }
        
        // Validate expiry date
        $expires_at = $input['expires_at'] . ' 23:59:59'; // End of day
        if (strtotime($expires_at) <= time()) {
            Response::validationError('Expiry date must be in the future');
        }
        
        // Check if enough questions are available
        $count_stmt = $db->prepare("
            SELECT COUNT(*) as available_questions
            FROM questions 
            WHERE subject = ? AND class_level = ?
        ");
        $count_stmt->execute([$input['subject'], $input['class_level']]);
        $available = $count_stmt->fetch();
        
        if ($available['available_questions'] < $input['question_count']) {
            Response::validationError(
                "Not enough questions available. Found {$available['available_questions']}, need {$input['question_count']}"
            );
        }
        
        // Generate unique test code
        do {
            $code = generateTestCode();
            $check_stmt = $db->prepare("SELECT id FROM test_codes WHERE code = ?");
            $check_stmt->execute([$code]);
        } while ($check_stmt->fetch());
        
        // Insert test code
        $stmt = $db->prepare("
            INSERT INTO test_codes (
                code, title, subject, class_level, duration_minutes, 
                question_count, expires_at, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $code,
            $input['title'],
            $input['subject'],
            $input['class_level'],
            $input['duration_minutes'],
            $input['question_count'],
            $expires_at,
            $user['id']
        ]);
        
        $test_code_id = $db->lastInsertId();
        
        Response::logRequest('admin/test-codes', 'POST', $user['id']);
        Response::created('Test code created successfully', [
            'id' => $test_code_id,
            'code' => $code
        ]);
        
    } catch (Exception $e) {
        error_log("Error creating test code: " . $e->getMessage());
        Response::serverError('Failed to create test code');
    }
}

function handlePut($db, $user) {
    try {
        $test_code_id = $_GET['id'] ?? null;
        
        if (!$test_code_id) {
            Response::validationError('Test code ID is required');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Build update query dynamically
        $update_fields = [];
        $params = [];
        
        $allowed_fields = ['title', 'subject', 'class_level', 'duration_minutes', 'question_count', 'expires_at'];
        
        foreach ($allowed_fields as $field) {
            if (isset($input[$field])) {
                if ($field === 'expires_at') {
                    $expires_at = $input[$field] . ' 23:59:59';
                    if (strtotime($expires_at) <= time()) {
                        Response::validationError('Expiry date must be in the future');
                    }
                    $update_fields[] = "$field = ?";
                    $params[] = $expires_at;
                } else {
                    $update_fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
        }
        
        if (empty($update_fields)) {
            Response::validationError('No valid fields to update');
        }
        
        $params[] = $test_code_id;
        
        $sql = "UPDATE test_codes SET " . implode(', ', $update_fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        Response::logRequest('admin/test-codes', 'PUT', $user['id']);
        Response::updated('Test code updated successfully');
        
    } catch (Exception $e) {
        error_log("Error updating test code: " . $e->getMessage());
        Response::serverError('Failed to update test code');
    }
}

function handlePatch($db, $user) {
    try {
        $test_code_id = $_GET['id'] ?? null;
        
        if (!$test_code_id) {
            Response::validationError('Test code ID is required');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['is_active'])) {
            Response::validationError('is_active field is required');
        }
        
        $is_active = $input['is_active'] ? 'true' : 'false';
        
        $stmt = $db->prepare("UPDATE test_codes SET is_active = ? WHERE id = ?");
        $stmt->execute([$is_active, $test_code_id]);
        
        Response::logRequest('admin/test-codes', 'PATCH', $user['id']);
        Response::updated('Test code status updated successfully');
        
    } catch (Exception $e) {
        error_log("Error updating test code status: " . $e->getMessage());
        Response::serverError('Failed to update test code status');
    }
}

function handleDelete($db, $user) {
    try {
        $test_code_id = $_GET['id'] ?? null;
        
        if (!$test_code_id) {
            Response::validationError('Test code ID is required');
        }
        
        // Check if test has any submissions
        $check_stmt = $db->prepare("SELECT COUNT(*) as submission_count FROM test_results WHERE test_code_id = ?");
        $check_stmt->execute([$test_code_id]);
        $result = $check_stmt->fetch();
        
        if ($result['submission_count'] > 0) {
            Response::error('Cannot delete test code with existing submissions');
        }
        
        // Delete test code
        $stmt = $db->prepare("DELETE FROM test_codes WHERE id = ?");
        $stmt->execute([$test_code_id]);
        
        Response::logRequest('admin/test-codes', 'DELETE', $user['id']);
        Response::deleted('Test code deleted successfully');
        
    } catch (Exception $e) {
        error_log("Error deleting test code: " . $e->getMessage());
        Response::serverError('Failed to delete test code');
    }
}

function generateTestCode() {
    return strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6));
}

?>
