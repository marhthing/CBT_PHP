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
require_once __DIR__ . '/../../services/QuestionService.php';
require_once __DIR__ . '/../../services/DataManager.php';

$auth = new Auth();
$user = $auth->requireRole('admin');

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
        handleGet($user);
        break;
    case 'POST':
        handlePost($user);
        break;
    case 'PUT':
        handlePut($user);
        break;
    case 'DELETE':
        handleDelete($user);
        break;
    default:
        Response::methodNotAllowed();
}

function handleGet($user) {
    try {
        $questionService = QuestionService::getInstance();
        
        // Parse URL path to handle different endpoints
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path_parts = explode('/', trim($path, '/'));
        
        // Check if requesting question count by subject
        if (end($path_parts) === 'count' && isset($_GET['subject_id'])) {
            $filters = [
                'subject_id' => $_GET['subject_id']
            ];
            
            if (!empty($_GET['class_level'])) {
                $filters['class_level'] = $_GET['class_level'];
            }
            
            $count = $questionService->countQuestions($filters);
            
            Response::success('Question count retrieved', [
                'count' => $count,
                'subject_id' => $_GET['subject_id'],
                'class_level' => $_GET['class_level'] ?? null
            ]);
            return;
        }
        
        // Check if requesting stats
        if (isset($_GET['stats'])) {
            $filters = [];
            
            // Allow filtering stats by teacher if admin wants specific teacher stats
            if (!empty($_GET['teacher_id'])) {
                $filters['teacher_id'] = $_GET['teacher_id'];
            }
            
            $stats = $questionService->getQuestionStats($filters);
            
            $stats_data = [
                'total_questions' => (int)$stats['stats']['total_questions'],
                'subjects_count' => (int)$stats['stats']['subjects_count'],
                'class_levels_count' => (int)$stats['stats']['class_levels_count'],
                'question_types_count' => (int)$stats['stats']['question_types_count'],
                'by_subject' => array_column($stats['by_subject'], 'question_count', 'subject_name'),
                'by_class' => array_column($stats['by_class'], 'question_count', 'class_level'),
                'by_type' => array_column($stats['by_type'], 'question_count', 'question_type'),
                'by_assignment' => array_column($stats['by_assignment'], 'question_count', 'question_assignment')
            ];
            
            Response::success('Question stats retrieved', $stats_data);
            return;
        }
        
        // Build filters for getting questions
        $filters = [];
        
        if (isset($_GET['search']) && !empty($_GET['search'])) {
            $filters['search'] = $_GET['search'];
        }
        
        if (isset($_GET['subject']) && !empty($_GET['subject'])) {
            $filters['subject_id'] = $_GET['subject'];
        }
        
        if (isset($_GET['class']) && !empty($_GET['class'])) {
            $filters['class_level'] = $_GET['class'];
        }
        
        if (isset($_GET['type']) && !empty($_GET['type'])) {
            $filters['question_type'] = $_GET['type'];
        }
        
        if (isset($_GET['assignment']) && !empty($_GET['assignment'])) {
            $filters['question_assignment'] = $_GET['assignment'];
        }
        
        if (isset($_GET['term']) && !empty($_GET['term'])) {
            $filters['term_id'] = $_GET['term'];
        }
        
        if (isset($_GET['session']) && !empty($_GET['session'])) {
            $filters['session_id'] = $_GET['session'];
        }
        
        $limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
        $page = max(1, intval($_GET['page'] ?? 1));
        $offset = ($page - 1) * $limit;
        
        // Get questions and total count
        $questions = $questionService->getQuestions($filters, $limit, $offset);
        $total = $questionService->countQuestions($filters);
        
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

function handlePost($user) {
    try {
        $questionService = QuestionService::getInstance();
        $dataManager = DataManager::getInstance();
        
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
            
            // Validate using DataManager
            if (!$dataManager->isValidSubject($_POST['subject_id'])) {
                Response::validationError('Invalid subject selected');
            }
            
            if (!$dataManager->isValidClassLevel($_POST['class_level'])) {
                Response::validationError('Invalid class level');
            }
            
            if (!$dataManager->isValidTerm($_POST['term_id'])) {
                Response::validationError('Invalid term selected');
            }
            
            if (!$dataManager->isValidSession($_POST['session_id'])) {
                Response::validationError('Invalid session selected');
            }
            
            $file_content = file_get_contents($file['tmp_name']);
            
            if (empty($file_content)) {
                Response::validationError('File is empty');
            }
            
            // Process the SQL file - parse INSERT statements
            $questions = [];
            $statements = preg_split('/INSERT\s+INTO/i', $file_content);
            
            foreach ($statements as $index => $statement) {
                if ($index === 0 && trim($statement) === '') continue;
                
                $statement = 'INSERT INTO' . $statement;
                $statement = trim($statement);
                
                if (empty($statement)) continue;
                
                try {
                    // Parse INSERT statement to extract values
                    if (preg_match('/INSERT\s+INTO\s+questions\s*\([^)]+\)\s*VALUES\s*\(([^)]+)\)/i', $statement, $matches)) {
                        $values_string = $matches[1];
                        
                        // Parse values (simplified parser)
                        $values = explode(',', $values_string);
                        $values = array_map(function($v) {
                            return trim($v, " '\"`");
                        }, $values);
                        
                        if (count($values) >= 7) {
                            $question_data = [
                                'question_text' => $values[0],
                                'option_a' => $values[1],
                                'option_b' => $values[2],
                                'option_c' => $values[3] !== 'NULL' ? $values[3] : null,
                                'option_d' => $values[4] !== 'NULL' ? $values[4] : null,
                                'correct_answer' => $values[5],
                                'question_type' => $values[6] ?? 'multiple_choice',
                                'subject_id' => $_POST['subject_id'],
                                'class_level' => $_POST['class_level'],
                                'term_id' => $_POST['term_id'],
                                'session_id' => $_POST['session_id'],
                                'question_assignment' => $_POST['question_assignment'] ?? 'First CA'
                            ];
                            
                            $questions[] = $question_data;
                        }
                    }
                } catch (Exception $e) {
                    // Skip invalid statements
                    continue;
                }
            }
            
            if (empty($questions)) {
                Response::validationError('No valid questions found in file');
            }
            
            // Bulk create questions using service
            $result = $questionService->bulkCreateQuestions($questions, $user['id']);
            
            if ($result['success']) {
                Response::logRequest('admin/questions', 'POST_BULK', $user['id']);
                Response::created("Successfully created {$result['created']} out of {$result['total']} questions", [
                    'created' => $result['created'],
                    'total' => $result['total'],
                    'errors' => $result['errors']
                ]);
            } else {
                Response::validationError('Failed to create questions: ' . implode(', ', $result['errors']));
            }
        } else {
            // Handle single question creation
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                Response::validationError('Invalid JSON input');
            }
            
            // Create question using service
            $result = $questionService->createQuestion($input, $user['id']);
            
            if ($result['success']) {
                Response::logRequest('admin/questions', 'POST', $user['id']);
                Response::created('Question created successfully', ['question_id' => $result['id']]);
            } else {
                Response::validationError($result['message']);
            }
        }
        
    } catch (Exception $e) {
        Response::serverError('Failed to create question: ' . $e->getMessage());
    }
}

function handleDelete($user) {
    try {
        $questionService = QuestionService::getInstance();
        
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
        
        // Check if question is used in any test results (using direct query for safety)
        $database = new Database();
        $db = $database->getConnection();
        
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
        
        // Delete question using service
        $result = $questionService->deleteQuestion($question_id);
        
        if ($result['success']) {
            Response::logRequest('admin/questions', 'DELETE', $user['id']);
            Response::deleted('Question deleted successfully');
        } else {
            Response::notFound($result['message']);
        }
        
    } catch (Exception $e) {
        Response::serverError('Failed to delete question: ' . $e->getMessage());
    }
}

function handlePut($user) {
    try {
        $questionService = QuestionService::getInstance();
        
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
        
        // Update question using service
        $result = $questionService->updateQuestion($question_id, $input);
        
        if ($result['success']) {
            Response::logRequest('admin/questions', 'PUT', $user['id']);
            Response::success('Question updated successfully');
        } else {
            if (strpos($result['message'], 'not found') !== false) {
                Response::notFound($result['message']);
            } else {
                Response::validationError($result['message']);
            }
        }
        
    } catch (Exception $e) {
        Response::serverError('Failed to update question: ' . $e->getMessage());
    }
}

?>