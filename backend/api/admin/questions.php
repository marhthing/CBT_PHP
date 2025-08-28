
<?php

// Extra CORS headers for InfinityFree compatibility
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Authorization, Bearer");
header("Access-Control-Max-Age: 3600");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

$auth = new Auth();
$user = $auth->requireRole('admin');

$database = new Database();
$db = $database->getConnection();

// Handle method override for InfinityFree compatibility
$request_method = $_SERVER['REQUEST_METHOD'];

// Check for method override in POST requests (InfinityFree workaround)
if ($request_method === 'POST') {
    // Check query parameter first (from .htaccess rewrite)
    if (isset($_GET['_method'])) {
        $request_method = strtoupper($_GET['_method']);
    } else {
        // Check JSON body for method override
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['_method'])) {
            $request_method = strtoupper($input['_method']);
        }
        // Also check headers for method override
        if (isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
            $request_method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
        }
    }
}

switch ($request_method) {
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
        // Parse URL path to handle different endpoints
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path_parts = explode('/', trim($path, '/'));
        
        // Check if requesting question count by subject
        if (end($path_parts) === 'count' && isset($_GET['subject_id'])) {
            $subject_id = $_GET['subject_id'];
            $class_level = $_GET['class_level'] ?? null;
            
            $where_conditions = ['q.subject_id = ?'];
            $params = [$subject_id];
            
            if ($class_level) {
                $where_conditions[] = 'q.class_level = ?';
                $params[] = $class_level;
            }
            
            $where_clause = implode(' AND ', $where_conditions);
            
            $count_stmt = $db->prepare("
                SELECT COUNT(*) as question_count
                FROM questions q
                WHERE {$where_clause}
            ");
            $count_stmt->execute($params);
            $result = $count_stmt->fetch();
            
            Response::success('Question count retrieved', [
                'count' => (int)$result['question_count'],
                'subject_id' => $subject_id,
                'class_level' => $class_level
            ]);
            return;
        }
        
        // Check if requesting stats
        if (isset($_GET['stats'])) {
            $stats_stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_questions,
                    COUNT(DISTINCT s.name) as subjects_count,
                    COUNT(DISTINCT q.class_level) as class_levels_count,
                    COUNT(DISTINCT q.question_type) as question_types_count
                FROM questions q
                JOIN subjects s ON q.subject_id = s.id
            ");
            $stats_stmt->execute();
            $stats = $stats_stmt->fetch();
            
            // Get questions by subject
            $subject_stmt = $db->prepare("
                SELECT s.name as subject_name, COUNT(*) as question_count
                FROM questions q
                JOIN subjects s ON q.subject_id = s.id
                GROUP BY s.id, s.name
                ORDER BY question_count DESC
            ");
            $subject_stmt->execute();
            $by_subject = $subject_stmt->fetchAll();
            
            // Get questions by class level
            $class_stmt = $db->prepare("
                SELECT q.class_level, COUNT(*) as question_count
                FROM questions q
                GROUP BY q.class_level
                ORDER BY q.class_level
            ");
            $class_stmt->execute();
            $by_class = $class_stmt->fetchAll();
            
            // Get questions by type
            $type_stmt = $db->prepare("
                SELECT q.question_type, COUNT(*) as question_count
                FROM questions q
                GROUP BY q.question_type
                ORDER BY q.question_type
            ");
            $type_stmt->execute();
            $by_type = $type_stmt->fetchAll();
            
            $stats_data = [
                'total_questions' => (int)$stats['total_questions'],
                'subjects_count' => (int)$stats['subjects_count'],
                'class_levels_count' => (int)$stats['class_levels_count'],
                'question_types_count' => (int)$stats['question_types_count'],
                'by_subject' => array_column($by_subject, 'question_count', 'subject_name'),
                'by_class' => array_column($by_class, 'question_count', 'class_level'),
                'by_type' => array_column($by_type, 'question_count', 'question_type')
            ];
            
            Response::success('Question stats retrieved', $stats_data);
            return;
        }
        
        // Build query with filters for getting questions
        $where_conditions = ['1 = 1'];
        $params = [];
        
        if (isset($_GET['search']) && !empty($_GET['search'])) {
            $where_conditions[] = 'q.question_text LIKE ?';
            $params[] = '%' . $_GET['search'] . '%';
        }
        
        if (isset($_GET['subject']) && !empty($_GET['subject'])) {
            $where_conditions[] = 'q.subject_id = ?';
            $params[] = $_GET['subject'];
        }
        
        if (isset($_GET['class']) && !empty($_GET['class'])) {
            $where_conditions[] = 'q.class_level = ?';
            $params[] = $_GET['class'];
        }
        
        if (isset($_GET['type']) && !empty($_GET['type'])) {
            $where_conditions[] = 'q.question_type = ?';
            $params[] = $_GET['type'];
        }
        
        $limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
        $page = max(1, intval($_GET['page'] ?? 1));
        $offset = ($page - 1) * $limit;
        
        $where_clause = implode(' AND ', $where_conditions);
        
        $base_query = "
            SELECT 
                q.id,
                q.question_text,
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
                q.correct_answer,
                q.class_level,
                q.question_type,
                q.created_at,
                s.name as subject_name,
                s.id as subject_id,
                u.full_name as created_by_name
            FROM questions q
            JOIN subjects s ON q.subject_id = s.id
            JOIN users u ON q.teacher_id = u.id
            WHERE {$where_clause}
            ORDER BY q.created_at DESC
        ";
        
        // Use database-specific LIMIT syntax  
        $database = new Database();
        $full_query = $database->limitQuery($base_query, $limit, $offset);
        $stmt = $db->prepare($full_query);
        
        $stmt->execute($params);
        $questions = $stmt->fetchAll();
        
        // Get total count for pagination (use the same params since no limit/offset in $params)
        $count_stmt = $db->prepare("
            SELECT COUNT(*) as total
            FROM questions q
            JOIN subjects s ON q.subject_id = s.id
            JOIN users u ON q.teacher_id = u.id
            WHERE {$where_clause}
        ");
        $count_stmt->execute($params);
        $total_result = $count_stmt->fetch();
        $total = (int)$total_result['total'];
        
        // Format options for each question based on type
        foreach ($questions as &$question) {
            if ($question['question_type'] === 'true_false') {
                $question['options'] = [
                    ['label' => 'A', 'text' => $question['option_a']],
                    ['label' => 'B', 'text' => $question['option_b']]
                ];
            } else {
                $question['options'] = [
                    ['label' => 'A', 'text' => $question['option_a']],
                    ['label' => 'B', 'text' => $question['option_b']],
                    ['label' => 'C', 'text' => $question['option_c']],
                    ['label' => 'D', 'text' => $question['option_d']]
                ];
            }
        }
        
        Response::logRequest('admin/questions', 'GET', $user['id']);
        Response::success('Questions retrieved', [
            'questions' => $questions,
            'total' => $total,
            'page' => $page,
            'limit' => $limit
        ]);
        
    } catch (Exception $e) {
        Response::serverError('Failed to get questions: ' . $e->getMessage());
    }
}

function handlePost($db, $user) {
    try {
        // Check if this is a bulk upload request
        $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
        
        if (strpos($content_type, 'multipart/form-data') !== false) {
            // Handle file upload for SQL import
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                Response::validationError('No file uploaded or upload error');
            }
            
            $file = $_FILES['file'];
            $allowed_types = ['sql', 'txt'];
            $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            
            if (!in_array($file_extension, $allowed_types)) {
                Response::validationError('Only SQL and TXT files are allowed');
            }
            
            // Validate required bulk upload fields
            if (!isset($_POST['subject_id']) || !isset($_POST['class_level']) || 
                !isset($_POST['term_id']) || !isset($_POST['session_id'])) {
                Response::validationError('Subject, class level, term, and session are required for bulk upload');
            }
            
            $subject_id = $_POST['subject_id'];
            $class_level = $_POST['class_level'];
            $term_id = $_POST['term_id'];
            $session_id = $_POST['session_id'];
            
            // Validate foreign keys exist
            $checks = [
                ['subjects', 'id', $subject_id, 'Subject'],
                ['terms', 'id', $term_id, 'Term'],
                ['sessions', 'id', $session_id, 'Session']
            ];
            
            foreach ($checks as [$table, $column, $value, $name]) {
                $check_stmt = $db->prepare("SELECT id FROM {$table} WHERE {$column} = ? AND is_active = true");
                $check_stmt->execute([$value]);
                if (!$check_stmt->fetch()) {
                    Response::validationError("Invalid {$name} selected");
                }
            }
            
            // Validate class level
            $check_stmt = $db->prepare("SELECT name FROM class_levels WHERE name = ? AND is_active = true");
            $check_stmt->execute([$class_level]);
            if (!$check_stmt->fetch()) {
                Response::validationError('Invalid class level');
            }
            
            $file_content = file_get_contents($file['tmp_name']);
            
            if (empty($file_content)) {
                Response::validationError('File is empty');
            }
            
            // Process the SQL file
            $success_count = 0;
            $error_count = 0;
            $errors = [];
            
            // Split by INSERT statements
            $statements = preg_split('/INSERT\s+INTO/i', $file_content);
            
            foreach ($statements as $index => $statement) {
                if ($index === 0 && trim($statement) === '') continue; // Skip empty first part
                
                $statement = 'INSERT INTO' . $statement;
                $statement = trim($statement);
                
                if (empty($statement)) continue;
                
                try {
                    // Parse INSERT statement to extract values
                    if (preg_match('/INSERT\s+INTO\s+questions\s*\([^)]+\)\s*VALUES\s*\(([^)]+)\)/i', $statement, $matches)) {
                        $values_string = $matches[1];
                        
                        // Parse values - this is a simple parser, might need improvement for complex cases
                        $values = [];
                        $current_value = '';
                        $in_quotes = false;
                        $quote_char = '';
                        
                        for ($i = 0; $i < strlen($values_string); $i++) {
                            $char = $values_string[$i];
                            
                            if (!$in_quotes && ($char === '"' || $char === "'")) {
                                $in_quotes = true;
                                $quote_char = $char;
                                $current_value .= $char;
                            } elseif ($in_quotes && $char === $quote_char) {
                                $in_quotes = false;
                                $quote_char = '';
                                $current_value .= $char;
                            } elseif (!$in_quotes && $char === ',') {
                                $values[] = trim($current_value);
                                $current_value = '';
                            } else {
                                $current_value .= $char;
                            }
                        }
                        
                        if (!empty($current_value)) {
                            $values[] = trim($current_value);
                        }
                        
                        // Clean up values by removing quotes
                        $clean_values = [];
                        foreach ($values as $value) {
                            $value = trim($value);
                            if (($value[0] === '"' || $value[0] === "'") && 
                                ($value[strlen($value)-1] === '"' || $value[strlen($value)-1] === "'")) {
                                $value = substr($value, 1, -1);
                            }
                            $clean_values[] = $value;
                        }
                        
                        // Ensure we have enough values (at least question_text, options, correct_answer)
                        if (count($clean_values) >= 6) {
                            $question_text = $clean_values[0];
                            $option_a = $clean_values[1];
                            $option_b = $clean_values[2];
                            $option_c = $clean_values[3];
                            $option_d = $clean_values[4];
                            $correct_answer = $clean_values[5];
                            
                            // Determine question type based on options
                            $question_type = 'multiple_choice';
                            if (empty($option_c) && empty($option_d)) {
                                $question_type = 'true_false';
                            }
                            
                            // Validate correct answer
                            if ($question_type === 'true_false') {
                                if (!in_array($correct_answer, ['A', 'B'])) {
                                    throw new Exception("Invalid correct answer for true/false question");
                                }
                            } else {
                                if (!in_array($correct_answer, ['A', 'B', 'C', 'D'])) {
                                    throw new Exception("Invalid correct answer for multiple choice question");
                                }
                            }
                            
                            // Insert question
                            $insert_stmt = $db->prepare("
                                INSERT INTO questions (
                                    question_text, option_a, option_b, option_c, option_d,
                                    correct_answer, question_type, subject_id, class_level, 
                                    term_id, session_id, teacher_id
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ");
                            
                            $insert_stmt->execute([
                                $question_text,
                                $option_a,
                                $option_b,
                                $question_type === 'true_false' ? null : $option_c,
                                $question_type === 'true_false' ? null : $option_d,
                                $correct_answer,
                                $question_type,
                                $subject_id,
                                $class_level,
                                $term_id,
                                $session_id,
                                $user['id'] // Admin as teacher_id
                            ]);
                            
                            $success_count++;
                        } else {
                            throw new Exception("Insufficient values in INSERT statement");
                        }
                    } else {
                        throw new Exception("Could not parse INSERT statement");
                    }
                    
                } catch (Exception $e) {
                    $error_count++;
                    $errors[] = "Statement " . ($index + 1) . ": " . $e->getMessage();
                }
            }
            
            Response::logRequest('admin/questions/bulk', 'POST', $user['id']);
            Response::success('Bulk upload completed', [
                'success_count' => $success_count,
                'error_count' => $error_count,
                'errors' => $errors
            ]);
        } else {
            // Handle single question creation
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                Response::validationError('Invalid JSON input');
            }
            
            // Determine question type (default to multiple_choice if not specified)
            $question_type = $input['question_type'] ?? 'multiple_choice';
            
            if (!in_array($question_type, ['multiple_choice', 'true_false'])) {
                Response::validationError('Question type must be multiple_choice or true_false');
            }
            
            // Validate required fields based on question type
            if ($question_type === 'true_false') {
                Response::validateRequired($input, [
                    'question_text', 'option_a', 'option_b',
                    'correct_answer', 'subject_id', 'class_level', 'term_id', 'session_id'
                ]);
                
                // For true/false, correct answer must be A or B
                if (!in_array($input['correct_answer'], ['A', 'B'])) {
                    Response::validationError('For True/False questions, correct answer must be A or B');
                }
            } else {
                Response::validateRequired($input, [
                    'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
                    'correct_answer', 'subject_id', 'class_level', 'term_id', 'session_id'
                ]);
                
                // For multiple choice, correct answer must be A, B, C, or D
                if (!in_array($input['correct_answer'], ['A', 'B', 'C', 'D'])) {
                    Response::validationError('For Multiple Choice questions, correct answer must be A, B, C, or D');
                }
            }
            
            // Validate class level
            $check_stmt = $db->prepare("SELECT name FROM class_levels WHERE name = ? AND is_active = true");
            $check_stmt->execute([$input['class_level']]);
            if (!$check_stmt->fetch()) {
                Response::validationError('Invalid class level');
            }
            
            // Validate foreign keys exist
            $checks = [
                ['subjects', 'id', $input['subject_id'], 'Subject'],
                ['terms', 'id', $input['term_id'], 'Term'],
                ['sessions', 'id', $input['session_id'], 'Session']
            ];
            
            foreach ($checks as [$table, $column, $value, $name]) {
                $check_stmt = $db->prepare("SELECT id FROM {$table} WHERE {$column} = ? AND is_active = true");
                $check_stmt->execute([$value]);
                if (!$check_stmt->fetch()) {
                    Response::validationError("Invalid {$name} selected");
                }
            }
            
            // Create question (using admin as teacher_id since admin is creating it)
            $stmt = $db->prepare("
                INSERT INTO questions (
                    question_text, option_a, option_b, option_c, option_d,
                    correct_answer, question_type, subject_id, class_level, term_id, session_id, teacher_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $input['question_text'],
                $input['option_a'],
                $input['option_b'],
                $question_type === 'true_false' ? null : $input['option_c'],
                $question_type === 'true_false' ? null : $input['option_d'],
                $input['correct_answer'],
                $question_type,
                $input['subject_id'],
                $input['class_level'],
                $input['term_id'],
                $input['session_id'],
                $user['id'] // Admin as teacher_id
            ]);
            
            $question_id = $db->lastInsertId();
            
            Response::logRequest('admin/questions', 'POST', $user['id']);
            Response::created('Question created successfully', ['question_id' => $question_id]);
        }
        
    } catch (Exception $e) {
        Response::serverError('Failed to create question: ' . $e->getMessage());
    }
}

function handleDelete($db, $user) {
    try {
        // For InfinityFree compatibility, allow ID in request body
        $question_id = null;
        
        // Try to get ID from URL path first
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path_parts = explode('/', trim($path, '/'));
        $last_part = end($path_parts);
        
        if (is_numeric($last_part)) {
            $question_id = $last_part;
        } elseif (isset($_GET['id'])) {
            $question_id = $_GET['id'];
        } else {
            // InfinityFree compatibility - get ID from request body
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['id'])) {
                $question_id = $input['id'];
            }
        }
        
        if (!$question_id) {
            Response::validationError('Question ID is required');
        }
        
        // Check if question exists
        $check_stmt = $db->prepare("SELECT id FROM questions WHERE id = ?");
        $check_stmt->execute([$question_id]);
        
        if (!$check_stmt->fetch()) {
            Response::notFound('Question not found');
        }
        
        // Check if question is used in any test results
        $usage_check = $db->prepare("
            SELECT COUNT(*) as usage_count 
            FROM test_answers 
            WHERE question_id = ?
        ");
        $usage_check->execute([$question_id]);
        $usage_result = $usage_check->fetch();
        
        if ($usage_result['usage_count'] > 0) {
            Response::error('Cannot delete question. It has been used in tests.');
        }
        
        // Delete question
        $stmt = $db->prepare("DELETE FROM questions WHERE id = ?");
        $stmt->execute([$question_id]);
        
        Response::logRequest('admin/questions', 'DELETE', $user['id']);
        Response::deleted('Question deleted successfully');
        
    } catch (Exception $e) {
        Response::serverError('Failed to delete question: ' . $e->getMessage());
    }
}

function handlePut($db, $user) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // For InfinityFree compatibility, allow ID in request body
        $question_id = null;
        
        // Try to get ID from URL path first
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path_parts = explode('/', trim($path, '/'));
        $last_part = end($path_parts);
        
        if (is_numeric($last_part)) {
            $question_id = $last_part;
        } elseif (isset($_GET['id'])) {
            $question_id = $_GET['id'];
        } elseif (isset($input['id'])) {
            // InfinityFree compatibility - get ID from request body
            $question_id = $input['id'];
        }
        
        if (!$question_id) {
            Response::validationError('Question ID is required');
        }
        
        if (!$input) {
            Response::validationError('Invalid JSON input');
        }
        
        // Check if question exists and get current data
        $check_stmt = $db->prepare("SELECT id, question_type FROM questions WHERE id = ?");
        $check_stmt->execute([$question_id]);
        $current_question = $check_stmt->fetch();
        
        if (!$current_question) {
            Response::notFound('Question not found');
        }
        
        // Determine question type (use current if not changing)
        $question_type = $input['question_type'] ?? $current_question['question_type'];
        
        if (!in_array($question_type, ['multiple_choice', 'true_false'])) {
            Response::validationError('Question type must be multiple_choice or true_false');
        }
        
        // Validate required fields based on question type
        if ($question_type === 'true_false') {
            Response::validateRequired($input, [
                'question_text', 'option_a', 'option_b', 'correct_answer'
            ]);
            
            // For true/false, correct answer must be A or B
            if (!in_array($input['correct_answer'], ['A', 'B'])) {
                Response::validationError('For True/False questions, correct answer must be A or B');
            }
        } else {
            Response::validateRequired($input, [
                'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'
            ]);
            
            // For multiple choice, correct answer must be A, B, C, or D
            if (!in_array($input['correct_answer'], ['A', 'B', 'C', 'D'])) {
                Response::validationError('For Multiple Choice questions, correct answer must be A, B, C, or D');
            }
        }
        
        // Update question
        $stmt = $db->prepare("
            UPDATE questions SET 
                question_text = ?,
                option_a = ?,
                option_b = ?,
                option_c = ?,
                option_d = ?,
                correct_answer = ?,
                question_type = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['question_text'],
            $input['option_a'],
            $input['option_b'],
            $question_type === 'true_false' ? null : $input['option_c'],
            $question_type === 'true_false' ? null : $input['option_d'],
            $input['correct_answer'],
            $question_type,
            $question_id
        ]);
        
        Response::logRequest('admin/questions', 'PUT', $user['id']);
        Response::success('Question updated successfully');
        
    } catch (Exception $e) {
        Response::serverError('Failed to update question: ' . $e->getMessage());
    }
}

?>
