<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Get the request method and path
$request_method = $_SERVER['REQUEST_METHOD'];
$path_info = $_SERVER['PATH_INFO'] ?? '';

// If PATH_INFO is empty, try to get path from REQUEST_URI (for direct routing through index.php)
if (empty($path_info)) {
    $request_uri = $_SERVER['REQUEST_URI'] ?? '';
    $path = parse_url($request_uri, PHP_URL_PATH);
    
    // Remove the base path and extract the admin/test-codes part
    if (strpos($path, '/admin/test-codes') !== false) {
        $path_info = $path;
    }
}

// Initialize auth and verify admin role
$auth = new Auth();
$user = $auth->getCurrentUser();

if (!$user || $user['role'] !== 'admin') {
    Response::unauthorized('Admin access required');
}

try {
    // Parse the path to get test code ID if provided
    $path_parts = explode('/', trim($path_info, '/'));
    
    // Remove admin/test-codes prefix if present (when called via index.php routing)
    if (count($path_parts) >= 2 && $path_parts[0] === 'admin' && $path_parts[1] === 'test-codes') {
        $path_parts = array_slice($path_parts, 2);
    }
    
    // Filter out empty parts
    $path_parts = array_values(array_filter($path_parts, function($part) {
        return $part !== '';
    }));
    
    // Handle special cases first (bulk, etc.)
    $is_bulk = isset($path_parts[0]) && $path_parts[0] === 'bulk';
    $is_batch = isset($path_parts[0]) && $path_parts[0] === 'batch';
    $test_code_id = null;
    $action = null;
    
    if ($is_bulk) {
        // For bulk operations: /admin/test-codes/bulk
        $action = 'bulk';
    } elseif ($is_batch) {
        // For batch operations: /admin/test-codes/batch/{batch_id}/{action}
        $action = 'batch';
    } elseif (isset($path_parts[0]) && is_numeric($path_parts[0])) {
        // For ID-based operations: /admin/test-codes/{id} or /admin/test-codes/{id}/action
        $test_code_id = (int)$path_parts[0];
        $action = isset($path_parts[1]) ? $path_parts[1] : null;
    }

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
                
                $base_query = "
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
                             tc.duration_minutes, tc.total_questions, tc.score_per_question, tc.term_id, 
                             tc.session_id, tc.is_active, tc.is_activated, tc.expires_at,
                             tc.created_by, tc.created_at, tc.description,
                             tc.pass_score, tc.activated_at, tc.batch_id, tc.test_type,
                             s.name, t.name, sess.name, u.full_name
                    ORDER BY tc.created_at DESC
                ";
                
                // Use database-specific LIMIT syntax
                $full_query = $database->limitQuery($base_query, (int)$limit, (int)$offset);
                $stmt = $db->prepare($full_query);
                $stmt->execute($params);
                $test_codes = $stmt->fetchAll();
                
                Response::success('Test codes retrieved', $test_codes);
            }
            break;

        case 'POST':
            if ($action === 'bulk') {
                // Bulk creation
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input) {
                    Response::badRequest('Invalid JSON data');
                }
                
                Response::validateRequired($input, [
                    'title', 'subject_id', 'class_level', 'duration_minutes', 
                    'total_questions', 'score_per_question', 'term_id', 'session_id', 'count'
                ]);
                
                $count = (int)($input['count'] ?? 1);
                if ($count < 1 || $count > 100) {
                    Response::badRequest('Count must be between 1 and 100');
                }
                
                // First verify there are enough questions for the specific subject, class, term, and session
                $question_check = $db->prepare("
                    SELECT COUNT(*) as count 
                    FROM questions 
                    WHERE subject_id = ? AND class_level = ? AND term_id = ? AND session_id = ?
                ");
                $question_check->execute([$input['subject_id'], $input['class_level'], $input['term_id'], $input['session_id']]);
                $available_questions = $question_check->fetch()['count'];
                
                if ($input['total_questions'] > $available_questions) {
                    Response::badRequest("Not enough questions available. Requested: {$input['total_questions']}, Available: {$available_questions}");
                }
                
                $created_codes = [];
                // Always assign a batch_id for organization, even for single codes
                $batch_id = uniqid('batch_', true);
                $db->beginTransaction();
                
                try {
                    for ($i = 0; $i < $count; $i++) {
                        // Generate unique test code
                        do {
                            $code = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6));
                            $check_stmt = $db->prepare("SELECT id FROM test_codes WHERE code = ?");
                            $check_stmt->execute([$code]);
                        } while ($check_stmt->fetch());
                        
                        // For single code, keep original title; for multiple codes, add numbering
                        $title = $count > 1 ? $input['title'] . " (" . ($i + 1) . ")" : $input['title'];
                        
                        $stmt = $db->prepare("
                            INSERT INTO test_codes (
                                code, title, subject_id, class_level, duration_minutes,
                                total_questions, score_per_question, term_id, session_id, expires_at, created_by,
                                is_active, is_activated, batch_id, test_type
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, false, ?, ?)
                        ");
                        
                        $stmt->execute([
                            $code,
                            $title,
                            $input['subject_id'],
                            $input['class_level'],
                            $input['duration_minutes'],
                            $input['total_questions'],
                            $input['score_per_question'],
                            $input['term_id'],
                            $input['session_id'],
                            $input['expires_at'] ?: null,
                            $user['id'],
                            $batch_id,
                            $input['test_type'] ?? 'test'
                        ]);
                        
                        $created_codes[] = [
                            'id' => $db->lastInsertId(),
                            'code' => $code,
                            'title' => $title
                        ];
                    }
                    
                    $db->commit();
                    
                    $message = $count === 1 
                        ? "Test code batch created successfully (1 code)"
                        : "$count test codes created successfully";
                    
                    Response::created($message, [
                        'count' => $count,
                        'batch_id' => $batch_id,
                        'codes' => $created_codes
                    ]);
                } catch (Exception $e) {
                    $db->rollback();
                    throw $e;
                }
            } else {
                // Fallback for non-bulk requests - redirect to bulk logic
                Response::badRequest('Please use the bulk endpoint (/admin/test-codes/bulk) for all test code creation to maintain proper organization');
            }
            break;

        case 'PATCH':
            // Check if this is a batch activation request
            $path_segments = explode('/', trim($path_info, '/'));
            
            // Remove admin/test-codes prefix if present
            if (count($path_segments) >= 2 && $path_segments[0] === 'admin' && $path_segments[1] === 'test-codes') {
                $path_segments = array_slice($path_segments, 2);
            }
            
            if (count($path_segments) >= 3 && $path_segments[0] === 'batch' && $path_segments[2] === 'toggle-activation') {
                // Batch activation
                $batch_id = $path_segments[1];
                
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!isset($input['is_activated'])) {
                    Response::badRequest('is_activated field is required');
                }
                
                // Ensure boolean conversion - handle various input types
                if ($input['is_activated'] === '' || $input['is_activated'] === null) {
                    Response::badRequest('is_activated cannot be empty');
                }
                
                // Handle proper boolean conversion
                $is_activated = false; // default
                if (is_bool($input['is_activated'])) {
                    $is_activated = $input['is_activated'];
                } elseif (is_string($input['is_activated'])) {
                    if (strtolower($input['is_activated']) === 'true' || $input['is_activated'] === '1') {
                        $is_activated = true;
                    } elseif (strtolower($input['is_activated']) === 'false' || $input['is_activated'] === '0') {
                        $is_activated = false;
                    } else {
                        Response::badRequest('is_activated must be a valid boolean value (true/false)');
                    }
                } else {
                    $is_activated = (bool)$input['is_activated'];
                }
                
                // Check if any codes in this batch have been used
                $check_stmt = $db->prepare("
                    SELECT COUNT(*) as used_count 
                    FROM test_codes tc
                    LEFT JOIN test_results tr ON tc.id = tr.test_code_id
                    WHERE tc.batch_id = ? AND tr.id IS NOT NULL
                ");
                $check_stmt->execute([$batch_id]);
                $used_check = $check_stmt->fetch();
                
                if ($used_check['used_count'] > 0 && $is_activated) {
                    Response::badRequest('Cannot activate batch with used codes. Once a code is used, the batch cannot be reactivated.');
                }
                
                // Update all codes in the batch
                $stmt = $db->prepare("
                    UPDATE test_codes 
                    SET is_activated = ?, activated_at = ? 
                    WHERE batch_id = ?
                ");
                $activated_at = $is_activated ? date('Y-m-d H:i:s') : null;
                
                // Use database-specific boolean values
                $is_activated_db = $is_activated ? $database->getBooleanTrue() : $database->getBooleanFalse();
                $stmt->execute([$is_activated_db, $activated_at, $batch_id]);
                
                if ($stmt->rowCount() > 0) {
                    Response::success('Test code batch activation updated', [
                        'batch_id' => $batch_id,
                        'is_activated' => $is_activated,
                        'updated_codes' => $stmt->rowCount()
                    ]);
                } else {
                    Response::notFound('Test code batch not found');
                }
            } elseif ($test_code_id && $action === 'toggle-activation') {
                // Individual activation is not allowed
                Response::badRequest('Individual code activation is not allowed. Use batch activation instead.');
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
                
                // Remove updated_at since column doesn't exist yet
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
            if ($action === 'bulk' && isset($_GET['empty_table'])) {
                // Empty the entire test_codes table - database compatible way
                if ($database->getDatabaseType() === 'mysql') {
                    $stmt = $db->prepare("TRUNCATE TABLE test_codes");
                } else {
                    $stmt = $db->prepare("TRUNCATE TABLE test_codes RESTART IDENTITY CASCADE");
                }
                $stmt->execute();
                
                Response::success('All test codes have been deleted successfully');
            } elseif ($is_batch && isset($path_parts[1])) {
                // Delete entire batch: /admin/test-codes/batch/{batch_id}
                $batch_id = $path_parts[1];
                
                // Check if any codes in the batch have been used
                $check_stmt = $db->prepare("
                    SELECT COUNT(*) as used_count 
                    FROM test_codes tc 
                    LEFT JOIN test_results tr ON tc.id = tr.test_code_id 
                    WHERE tc.batch_id = ? AND tr.id IS NOT NULL
                ");
                $check_stmt->execute([$batch_id]);
                $used_check = $check_stmt->fetch();
                
                if ($used_check['used_count'] > 0) {
                    Response::badRequest('Cannot delete batch with used codes');
                }
                
                // Delete all codes in the batch
                $stmt = $db->prepare("DELETE FROM test_codes WHERE batch_id = ?");
                $stmt->execute([$batch_id]);
                
                if ($stmt->rowCount() > 0) {
                    Response::success('Test code batch deleted successfully', [
                        'batch_id' => $batch_id,
                        'deleted_codes' => $stmt->rowCount()
                    ]);
                } else {
                    Response::notFound('Test code batch not found');
                }
            } elseif ($test_code_id) {
                // Individual code deletion - not allowed per requirements
                Response::badRequest('Individual code deletion is not allowed. Delete the entire batch instead.');
            } else {
                Response::badRequest('Invalid delete request');
            }
            break;

        default:
            Response::methodNotAllowed();
    }

} catch (Exception $e) {
    Response::serverError('An error occurred while processing your request');
}

?>