<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Initialize auth and verify admin role
$auth = new Auth();
$user = $auth->getCurrentUser();

if (!$user || $user['role'] !== 'admin') {
    Response::unauthorized('Admin access required');
}

try {
    // Parse the path to get batch ID and action
    $request_uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($request_uri, PHP_URL_PATH);
    $path_parts = explode('/', trim($path, '/'));
    
    $batch_id = null;
    $action = null;
    
    // Find batch ID and action in path
    for ($i = 0; $i < count($path_parts); $i++) {
        if ($path_parts[$i] === 'test-code-batches' && isset($path_parts[$i + 1]) && is_numeric($path_parts[$i + 1])) {
            $batch_id = (int)$path_parts[$i + 1];
            if (isset($path_parts[$i + 2])) {
                $action = $path_parts[$i + 2];
            }
            break;
        }
    }

    // Get database connection
    require_once __DIR__ . '/../../config/database.php';
    $database = new Database();
    $db = $database->getConnection();

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if ($batch_id && $action === 'codes') {
                // Get individual codes for a batch
                $stmt = $db->prepare("
                    SELECT tc.*, tr.id as result_id
                    FROM test_codes tc
                    LEFT JOIN test_results tr ON tc.id = tr.test_code_id
                    WHERE tc.batch_id = ?
                    ORDER BY tc.created_at ASC
                ");
                $stmt->execute([$batch_id]);
                $codes = $stmt->fetchAll();
                
                Response::success('Batch codes retrieved', $codes);
            } elseif ($batch_id) {
                // Get specific batch
                $stmt = $db->prepare("
                    SELECT tcb.*, s.name as subject_name, t.name as term_name, 
                           sess.name as session_name, u.full_name as created_by_name,
                           COUNT(tc.id) as total_codes,
                           COUNT(CASE WHEN tc.is_used THEN 1 END) as used_codes
                    FROM test_code_batches tcb
                    LEFT JOIN subjects s ON tcb.subject_id = s.id
                    LEFT JOIN terms t ON tcb.term_id = t.id
                    LEFT JOIN sessions sess ON tcb.session_id = sess.id
                    LEFT JOIN users u ON tcb.created_by = u.id
                    LEFT JOIN test_codes tc ON tcb.id = tc.batch_id
                    WHERE tcb.id = ?
                    GROUP BY tcb.id, s.name, t.name, sess.name, u.full_name
                ");
                $stmt->execute([$batch_id]);
                $batch = $stmt->fetch();
                
                if (!$batch) {
                    Response::notFound('Test code batch not found');
                }
                
                Response::success('Test code batch retrieved', $batch);
            } else {
                // Get all batches with filters
                $limit = $_GET['limit'] ?? 50;
                $offset = $_GET['offset'] ?? 0;
                $subject_id = $_GET['subject_id'] ?? null;
                $class_level = $_GET['class_level'] ?? null;
                
                $where_conditions = [];
                $params = [];
                
                if ($subject_id) {
                    $where_conditions[] = "tcb.subject_id = ?";
                    $params[] = $subject_id;
                }
                
                if ($class_level) {
                    $where_conditions[] = "tcb.class_level = ?";
                    $params[] = $class_level;
                }
                
                $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
                
                $stmt = $db->prepare("
                    SELECT tcb.*, s.name as subject_name, t.name as term_name, 
                           sess.name as session_name, u.full_name as created_by_name,
                           COUNT(tc.id) as total_codes,
                           COUNT(CASE WHEN tc.is_used THEN 1 END) as used_codes
                    FROM test_code_batches tcb
                    LEFT JOIN subjects s ON tcb.subject_id = s.id
                    LEFT JOIN terms t ON tcb.term_id = t.id
                    LEFT JOIN sessions sess ON tcb.session_id = sess.id
                    LEFT JOIN users u ON tcb.created_by = u.id
                    LEFT JOIN test_codes tc ON tcb.id = tc.batch_id
                    $where_clause
                    GROUP BY tcb.id, s.name, t.name, sess.name, u.full_name
                    ORDER BY tcb.created_at DESC
                    LIMIT ? OFFSET ?
                ");
                
                $params[] = (int)$limit;
                $params[] = (int)$offset;
                $stmt->execute($params);
                $batches = $stmt->fetchAll();
                
                Response::success('Test code batches retrieved', $batches);
            }
            break;

        case 'POST':
            // Create new test code batch
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                Response::badRequest('Invalid JSON data');
            }
            
            Response::validateRequired($input, [
                'title', 'subject_id', 'class_level', 'duration_minutes', 
                'total_questions', 'term_id', 'session_id', 'code_count'
            ]);
            
            $code_count = (int)($input['code_count'] ?? 1);
            if ($code_count < 1 || $code_count > 100) {
                Response::badRequest('Code count must be between 1 and 100');
            }
            
            // Verify there are enough questions
            $question_check = $db->prepare("
                SELECT COUNT(*) as count 
                FROM questions 
                WHERE subject_id = ? AND class_level = ?
            ");
            $question_check->execute([$input['subject_id'], $input['class_level']]);
            $available_questions = $question_check->fetch()['count'];
            
            if ($input['total_questions'] > $available_questions) {
                Response::badRequest("Not enough questions available. Requested: {$input['total_questions']}, Available: {$available_questions}");
            }
            
            $db->beginTransaction();
            
            try {
                // Create the batch
                $batch_stmt = $db->prepare("
                    INSERT INTO test_code_batches (
                        title, subject_id, class_level, term_id, session_id,
                        duration_minutes, total_questions, pass_score, code_count,
                        expires_at, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $batch_stmt->execute([
                    $input['title'],
                    $input['subject_id'],
                    $input['class_level'],
                    $input['term_id'],
                    $input['session_id'],
                    $input['duration_minutes'],
                    $input['total_questions'],
                    $input['pass_score'] ?? 50,
                    $code_count,
                    $input['expires_at'] ?: null,
                    $user['id']
                ]);
                
                $batch_id = $db->lastInsertId();
                
                // Generate individual test codes
                $created_codes = [];
                for ($i = 0; $i < $code_count; $i++) {
                    // Generate unique test code
                    do {
                        $code = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 8));
                        $check_stmt = $db->prepare("SELECT id FROM test_codes WHERE code = ?");
                        $check_stmt->execute([$code]);
                    } while ($check_stmt->fetch());
                    
                    $code_stmt = $db->prepare("
                        INSERT INTO test_codes (
                            batch_id, code, title, subject_id, class_level, duration_minutes,
                            total_questions, term_id, session_id, expires_at, created_by,
                            is_active, is_activated, pass_score
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, false, ?)
                    ");
                    
                    $code_stmt->execute([
                        $batch_id,
                        $code,
                        $input['title'] . " - Code " . ($i + 1),
                        $input['subject_id'],
                        $input['class_level'],
                        $input['duration_minutes'],
                        $input['total_questions'],
                        $input['term_id'],
                        $input['session_id'],
                        $input['expires_at'] ?: null,
                        $user['id'],
                        $input['pass_score'] ?? 50
                    ]);
                    
                    $created_codes[] = [
                        'id' => $db->lastInsertId(),
                        'code' => $code
                    ];
                }
                
                $db->commit();
                
                Response::created('Test code batch created successfully', [
                    'batch_id' => $batch_id,
                    'code_count' => $code_count,
                    'codes' => $created_codes
                ]);
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;

        case 'PATCH':
            if (!$batch_id) {
                Response::badRequest('Batch ID required');
            }
            
            if ($action === 'activate') {
                // Activate/deactivate all codes in batch
                $input = json_decode(file_get_contents('php://input'), true);
                $is_active = $input['is_active'] ?? true;
                
                $stmt = $db->prepare("
                    UPDATE test_codes 
                    SET is_activated = ?, is_active = ?
                    WHERE batch_id = ?
                ");
                $stmt->execute([$is_active, $is_active, $batch_id]);
                
                // Update batch status
                $batch_stmt = $db->prepare("
                    UPDATE test_code_batches 
                    SET is_active = ?
                    WHERE id = ?
                ");
                $batch_stmt->execute([$is_active, $batch_id]);
                
                Response::success('Batch activation updated', [
                    'batch_id' => $batch_id,
                    'is_active' => $is_active,
                    'codes_updated' => $stmt->rowCount()
                ]);
            }
            break;

        case 'DELETE':
            if (!$batch_id) {
                Response::badRequest('Batch ID required');
            }
            
            // Check if any codes have been used
            $check_stmt = $db->prepare("
                SELECT COUNT(*) as used_count 
                FROM test_codes 
                WHERE batch_id = ? AND is_used = true
            ");
            $check_stmt->execute([$batch_id]);
            $used_count = $check_stmt->fetch()['used_count'];
            
            if ($used_count > 0) {
                Response::badRequest("Cannot delete batch: $used_count codes have been used");
            }
            
            $db->beginTransaction();
            
            try {
                // Delete all codes in batch
                $codes_stmt = $db->prepare("DELETE FROM test_codes WHERE batch_id = ?");
                $codes_stmt->execute([$batch_id]);
                
                // Delete the batch
                $batch_stmt = $db->prepare("DELETE FROM test_code_batches WHERE id = ?");
                $batch_stmt->execute([$batch_id]);
                
                if ($batch_stmt->rowCount() > 0) {
                    $db->commit();
                    Response::success('Test code batch deleted successfully');
                } else {
                    $db->rollback();
                    Response::notFound('Test code batch not found');
                }
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;

        default:
            Response::methodNotAllowed();
    }

} catch (Exception $e) {
    error_log("Error in test-code-batches API: " . $e->getMessage());
    Response::serverError('An error occurred while processing your request');
}

?>