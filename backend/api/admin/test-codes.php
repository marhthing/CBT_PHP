<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Get the request method and path
$request_method = $_SERVER['REQUEST_METHOD'];
$path_info = $_SERVER['PATH_INFO'] ?? '';

// Initialize auth and verify admin role
$auth = new Auth();
$user = $auth->getCurrentUser();

if (!$user || $user['role'] !== 'admin') {
    Response::unauthorized('Admin access required');
}

try {
    // Parse the path to get test code ID if provided
    $path_parts = explode('/', trim($path_info, '/'));
    $test_code_id = isset($path_parts[0]) && is_numeric($path_parts[0]) ? (int)$path_parts[0] : null;
    $action = isset($path_parts[1]) ? $path_parts[1] : null;

    // Get database connection
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    switch ($request_method) {
        case 'GET':
            if ($test_code_id) {
                // Get specific test code
                $stmt = $db->prepare("
                    SELECT tc.*, s.name as subject_name, 
                           COUNT(tr.id) as usage_count
                    FROM test_codes tc
                    LEFT JOIN subjects s ON tc.subject_id = s.id
                    LEFT JOIN test_results tr ON tc.id = tr.test_code_id
                    WHERE tc.id = ?
                    GROUP BY tc.id, tc.code, tc.title, tc.subject_id, tc.class_level, 
                             tc.duration_minutes, tc.total_questions, tc.term_id, 
                             tc.session_id, tc.is_active, tc.is_activated, tc.expires_at,
                             tc.created_by, tc.created_at, tc.description,
                             tc.pass_score, tc.activated_at, tc.batch_id, s.name
                ");
                $stmt->execute([$test_code_id]);
                $test_code = $stmt->fetch();
                
                if (!$test_code) {
                    Response::notFound('Test code not found');
                }
                
                Response::success('Test code retrieved', $test_code);
            } else {
                // Get all test codes with filters
                $limit = $_GET['limit'] ?? 50;
                $offset = $_GET['offset'] ?? 0;
                $subject_id = $_GET['subject_id'] ?? null;
                $class_level = $_GET['class_level'] ?? null;
                $term_id = $_GET['term_id'] ?? null;
                $session_id = $_GET['session_id'] ?? null;
                
                $where_conditions = [];
                $params = [];
                
                if ($subject_id) {
                    $where_conditions[] = "tc.subject_id = ?";
                    $params[] = $subject_id;
                }
                
                if ($class_level) {
                    $where_conditions[] = "tc.class_level = ?";
                    $params[] = $class_level;
                }
                
                if ($term_id) {
                    $where_conditions[] = "tc.term_id = ?";
                    $params[] = $term_id;
                }
                
                if ($session_id) {
                    $where_conditions[] = "tc.session_id = ?";
                    $params[] = $session_id;
                }
                
                $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
                
                $stmt = $db->prepare("
                    SELECT tc.*, s.name as subject_name, t.name as term_name, 
                           sess.name as session_name, u.full_name as created_by_name,
                           COUNT(tr.id) as usage_count
                    FROM test_codes tc
                    LEFT JOIN subjects s ON tc.subject_id = s.id
                    LEFT JOIN terms t ON tc.term_id = t.id
                    LEFT JOIN sessions sess ON tc.session_id = sess.id
                    LEFT JOIN users u ON tc.created_by = u.id
                    LEFT JOIN test_results tr ON tc.id = tr.test_code_id
                    $where_clause
                    GROUP BY tc.id, tc.code, tc.title, tc.subject_id, tc.class_level, 
                             tc.duration_minutes, tc.total_questions, tc.term_id, 
                             tc.session_id, tc.is_active, tc.is_activated, tc.expires_at,
                             tc.created_by, tc.created_at, tc.description,
                             tc.pass_score, tc.activated_at, tc.batch_id,
                             s.name, t.name, sess.name, u.full_name
                    ORDER BY tc.created_at DESC
                    LIMIT ? OFFSET ?
                ");
                
                $params[] = (int)$limit;
                $params[] = (int)$offset;
                $stmt->execute($params);
                $test_codes = $stmt->fetchAll();
                
                Response::success('Test codes retrieved', $test_codes);
            }
            break;

        case 'POST':
            // Handle both single and bulk creation based on path
            $path_parts = explode('/', trim($path_info, '/'));
            $is_bulk = isset($path_parts[0]) && $path_parts[0] === 'bulk';
            
            if ($is_bulk) {
                // Bulk creation
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input) {
                    Response::badRequest('Invalid JSON data');
                }
                
                Response::validateRequired($input, [
                    'title', 'subject_id', 'class_level', 'duration_minutes', 
                    'total_questions', 'term_id', 'session_id', 'count'
                ]);
                
                $count = (int)($input['count'] ?? 1);
                if ($count < 1 || $count > 100) {
                    Response::badRequest('Count must be between 1 and 100');
                }
                
                // First verify there are enough questions
                $question_check = $db->prepare("
                    SELECT COUNT(*) as count 
                    FROM questions 
                    WHERE subject_id = ?
                ");
                $question_check->execute([$input['subject_id']]);
                $available_questions = $question_check->fetch()['count'];
                
                if ($input['total_questions'] > $available_questions) {
                    Response::badRequest("Not enough questions available. Requested: {$input['total_questions']}, Available: {$available_questions}");
                }
                
                $created_codes = [];
                $batch_id = $count > 1 ? uniqid('batch_', true) : null;
                $db->beginTransaction();
                
                try {
                    for ($i = 0; $i < $count; $i++) {
                        // Generate unique test code
                        do {
                            $code = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6));
                            $check_stmt = $db->prepare("SELECT id FROM test_codes WHERE code = ?");
                            $check_stmt->execute([$code]);
                        } while ($check_stmt->fetch());
                        
                        $title = $count > 1 ? $input['title'] . " (" . ($i + 1) . ")" : $input['title'];
                        
                        $stmt = $db->prepare("
                            INSERT INTO test_codes (
                                code, title, subject_id, class_level, duration_minutes,
                                total_questions, term_id, session_id, expires_at, created_by,
                                is_active, is_activated, batch_id
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, false, ?)
                        ");
                        
                        $stmt->execute([
                            $code,
                            $title,
                            $input['subject_id'],
                            $input['class_level'],
                            $input['duration_minutes'],
                            $input['total_questions'],
                            $input['term_id'],
                            $input['session_id'],
                            $input['expires_at'] ?: null,
                            $user['id'],
                            $batch_id
                        ]);
                        
                        $created_codes[] = [
                            'id' => $db->lastInsertId(),
                            'code' => $code,
                            'title' => $title
                        ];
                    }
                    
                    $db->commit();
                    
                    Response::created("$count test codes created successfully", [
                        'count' => $count,
                        'codes' => $created_codes
                    ]);
                } catch (Exception $e) {
                    $db->rollback();
                    throw $e;
                }
            } else {
                // Single creation
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input) {
                    Response::badRequest('Invalid JSON data');
                }
                
                Response::validateRequired($input, [
                    'title', 'subject_id', 'class_level', 'duration_minutes', 
                    'total_questions', 'term_id', 'session_id'
                ]);
                
                // Generate unique test code
                do {
                    $code = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6));
                    $check_stmt = $db->prepare("SELECT id FROM test_codes WHERE code = ?");
                    $check_stmt->execute([$code]);
                } while ($check_stmt->fetch());
                
                $stmt = $db->prepare("
                    INSERT INTO test_codes (
                        code, title, subject_id, class_level, duration_minutes,
                        total_questions, term_id, session_id, expires_at, created_by,
                        is_active, is_activated, batch_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, false, NULL)
                ");
                
                $stmt->execute([
                    $code,
                    $input['title'],
                    $input['subject_id'],
                    $input['class_level'],
                    $input['duration_minutes'],
                    $input['total_questions'],
                    $input['term_id'],
                    $input['session_id'],
                    $input['expires_at'] ?: null,
                    $user['id']
                ]);
                
                $test_code_id = $db->lastInsertId();
                
                Response::created('Test code created successfully', [
                    'id' => $test_code_id,
                    'code' => $code
                ]);
            }
            break;

        case 'PATCH':
            if (!$test_code_id) {
                Response::badRequest('Test code ID required');
            }
            
            if ($action === 'toggle-activation') {
                // Toggle test code activation
                $input = json_decode(file_get_contents('php://input'), true);
                $is_activated = $input['is_activated'] ?? false;
                
                $stmt = $db->prepare("
                    UPDATE test_codes 
                    SET is_activated = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                $stmt->execute([$is_activated, $test_code_id]);
                
                Response::success('Test code activation updated', [
                    'id' => $test_code_id,
                    'is_activated' => $is_activated
                ]);
            } else {
                // Update test code
                $input = json_decode(file_get_contents('php://input'), true);
                
                $allowed_fields = [
                    'title', 'subject_id', 'class_level', 'duration_minutes',
                    'total_questions', 'term_id', 'session_id', 'expires_at',
                    'is_active', 'is_activated'
                ];
                
                $update_fields = [];
                $params = [];
                
                foreach ($allowed_fields as $field) {
                    if (isset($input[$field])) {
                        $update_fields[] = "$field = ?";
                        $params[] = $input[$field];
                    }
                }
                
                if (empty($update_fields)) {
                    Response::badRequest('No valid fields to update');
                }
                
                $update_fields[] = "updated_at = CURRENT_TIMESTAMP";
                $params[] = $test_code_id;
                
                $stmt = $db->prepare("
                    UPDATE test_codes 
                    SET " . implode(', ', $update_fields) . "
                    WHERE id = ?
                ");
                $stmt->execute($params);
                
                Response::success('Test code updated successfully');
            }
            break;

        case 'DELETE':
            if (!$test_code_id) {
                Response::badRequest('Test code ID required');
            }
            
            // Check if test code has been used
            $check_stmt = $db->prepare("SELECT COUNT(*) as usage_count FROM test_results WHERE test_code_id = ?");
            $check_stmt->execute([$test_code_id]);
            $usage = $check_stmt->fetch();
            
            if ($usage['usage_count'] > 0) {
                Response::badRequest('Cannot delete test code that has been used');
            }
            
            // Delete the test code
            $stmt = $db->prepare("DELETE FROM test_codes WHERE id = ?");
            $stmt->execute([$test_code_id]);
            
            if ($stmt->rowCount() > 0) {
                Response::success('Test code deleted successfully');
            } else {
                Response::notFound('Test code not found');
            }
            break;

        default:
            Response::methodNotAllowed();
    }

} catch (Exception $e) {
    error_log("Error in test-codes API: " . $e->getMessage());
    Response::serverError('An error occurred while processing your request');
}

?>
            
            if ($usage['usage_count'] > 0) {
                Response::badRequest('Cannot delete test code that has been used');
            }
            
            $stmt = $db->prepare("DELETE FROM test_codes WHERE id = ?");
            $stmt->execute([$test_code_id]);
            
            Response::success('Test code deleted successfully');
            break;

        default:
            Response::methodNotAllowed();
    }

} catch (Exception $e) {
    error_log("Test codes API error: " . $e->getMessage());
    Response::serverError('An error occurred while processing the request');
}

?>