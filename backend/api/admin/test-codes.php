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
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../services/TestCodeService.php';
require_once __DIR__ . '/../../services/DataManager.php';
require_once __DIR__ . '/../../services/SubjectService.php';
require_once __DIR__ . '/../../services/TermService.php';

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

    // Enhanced bulk detection logic
    if (!$is_bulk && !$is_batch && !$test_code_id) {
        $request_uri = $_SERVER['REQUEST_URI'] ?? '';
        
        // Check if the URL contains bulk anywhere
        if (strpos($request_uri, 'bulk') !== false || strpos($path_info, 'bulk') !== false) {
            $action = 'bulk';
            $is_bulk = true;
        }
        // Fallback: if this is a POST to test-codes endpoint with no specific ID, treat as bulk
        elseif ($request_method === 'POST') {
            $action = 'bulk';
            $is_bulk = true;
        }
    }
    
    // Debug logging
    error_log("DEBUG: Request Method: $request_method");
    error_log("DEBUG: Path Info: $path_info");
    error_log("DEBUG: Request URI: " . ($_SERVER['REQUEST_URI'] ?? 'N/A'));
    error_log("DEBUG: Action: $action");
    error_log("DEBUG: Is Bulk: " . ($is_bulk ? 'true' : 'false'));
    error_log("DEBUG: Is Batch: " . ($is_batch ? 'true' : 'false'));
    error_log("DEBUG: Test Code ID: " . ($test_code_id ?? 'N/A'));

    // Get service instances
    $testCodeService = TestCodeService::getInstance();

    // Define helper functions
    function handlePatchOperation($testCodeService, $path_info, $path_parts, $input) {
        // Check if this is a batch activation request
        $path_segments = explode('/', trim($path_info, '/'));

        // Remove admin/test-codes prefix if present
        if (count($path_segments) >= 2 && $path_segments[0] === 'admin' && $path_segments[1] === 'test-codes') {
            $path_segments = array_slice($path_segments, 2);
        }

        if (count($path_segments) >= 3 && $path_segments[0] === 'batch' && $path_segments[2] === 'toggle-activation') {
            // Batch activation using service
            $batch_id = $path_segments[1];

            if (!isset($input['is_activated'])) {
                Response::badRequest('is_activated field is required');
            }

            // Handle proper boolean conversion
            $is_activated = false;
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

            // Get all test code IDs in the batch
            $batch_codes = $testCodeService->getTestCodes(['batch_id' => $batch_id], 1000, 0);
            $test_code_ids = array_column($batch_codes, 'id');

            if (empty($test_code_ids)) {
                Response::notFound('No test codes found for this batch');
            }

            // Use service to toggle activation
            $result = $testCodeService->toggleActivation($test_code_ids, $is_activated);

            if ($result['success']) {
                Response::success("Test codes {$result['action']} successfully", [
                    'batch_id' => $batch_id,
                    'updated' => $result['updated'],
                    'total' => $result['total'],
                    'errors' => $result['errors']
                ]);
            } else {
                Response::serverError('Failed to update test codes');
            }
        } elseif (isset($path_parts[0]) && is_numeric($path_parts[0])) {
            // Individual test code update
            $test_code_id = (int)$path_parts[0];

            $result = $testCodeService->updateTestCode($test_code_id, $input);

            if ($result['success']) {
                Response::success('Test code updated successfully');
            } else {
                if (strpos($result['message'], 'not found') !== false) {
                    Response::notFound($result['message']);
                } else {
                    Response::badRequest($result['message']);
                }
            }
        } else {
            Response::badRequest('Invalid patch request');
        }
    }

    function handleDeleteOperation($testCodeService, $path_info, $action, $is_bulk, $is_batch, $path_parts) {
        if ($action === 'bulk' && isset($_GET['empty_table'])) {
            // Empty the entire test_codes table using direct database operation
            // This is a special admin operation that bypasses the service layer for safety
            require_once __DIR__ . '/../../config/database.php';
            $database = new Database();
            $db = $database->getConnection();

            if ($database->getDatabaseType() === 'mysql') {
                $stmt = $db->prepare("TRUNCATE TABLE test_codes");
            } else {
                $stmt = $db->prepare("TRUNCATE TABLE test_codes RESTART IDENTITY CASCADE");
            }
            $stmt->execute();

            Response::success('All test codes have been deleted successfully');
        } elseif ($is_batch && isset($path_parts[1])) {
            // Delete entire batch using service
            $batch_id = $path_parts[1];

            // Get all test codes in the batch
            $batch_codes = $testCodeService->getTestCodes(['batch_id' => $batch_id], 1000, 0);

            if (empty($batch_codes)) {
                Response::notFound('Test code batch not found');
            }

            // Check if any codes in the batch have been used
            $used_codes = array_filter($batch_codes, function($code) {
                return $code['times_taken'] > 0;
            });

            if (!empty($used_codes)) {
                Response::badRequest('Cannot delete batch with used codes');
            }

            // Delete all codes in the batch
            $deleted_count = 0;
            $errors = [];

            foreach ($batch_codes as $code) {
                $result = $testCodeService->deleteTestCode($code['id']);
                if ($result['success']) {
                    $deleted_count++;
                } else {
                    $errors[] = "Failed to delete code {$code['code']}: {$result['message']}";
                }
            }

            if ($deleted_count > 0) {
                Response::success('Test code batch deleted successfully', [
                    'batch_id' => $batch_id,
                    'deleted_codes' => $deleted_count,
                    'errors' => $errors
                ]);
            } else {
                Response::serverError('Failed to delete batch: ' . implode(', ', $errors));
            }
        } elseif (isset($path_parts[0]) && is_numeric($path_parts[0])) {
            // Individual code deletion - not allowed per requirements
            Response::badRequest('Individual code deletion is not allowed. Delete the entire batch instead.');
        } else {
            Response::badRequest('Invalid delete request');
        }
    }

    switch ($request_method) {
        case 'GET':
            if ($test_code_id) {
                // Get specific test code using service
                $test_codes = $testCodeService->getTestCodes(['id' => $test_code_id], 1, 0);

                if (empty($test_codes)) {
                    Response::notFound('Test code not found');
                }

                $test_code = $test_codes[0];
                Response::success('Test code retrieved', $test_code);
            } else {
                // Get all test codes with filters using service
                $filters = [];

                if (!empty($_GET['subject_id'])) {
                    $filters['subject_id'] = $_GET['subject_id'];
                }

                if (!empty($_GET['class_level'])) {
                    $filters['class_level'] = $_GET['class_level'];
                }

                if (!empty($_GET['term_id'])) {
                    $filters['term_id'] = $_GET['term_id'];
                }

                if (!empty($_GET['session_id'])) {
                    $filters['session_id'] = $_GET['session_id'];
                }

                if (isset($_GET['is_active'])) {
                    $filters['is_active'] = $_GET['is_active'] === 'true' || $_GET['is_active'] === '1';
                }

                if (!empty($_GET['batch_id'])) {
                    $filters['batch_id'] = $_GET['batch_id'];
                }

                if (!empty($_GET['search'])) {
                    $filters['search'] = $_GET['search'];
                }

                $limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
                $offset = intval($_GET['offset'] ?? 0);

                $test_codes = $testCodeService->getTestCodes($filters, $limit, $offset);

                Response::success('Test codes retrieved', $test_codes);
            }
            break;

        case 'POST':
            // Check for method override first (for InfinityFree compatibility)
            $input = json_decode(file_get_contents('php://input'), true);
            if ($input && isset($input['_method'])) {
                if ($input['_method'] === 'DELETE') {
                    // Handle DELETE operations via POST method override
                    handleDeleteOperation($testCodeService, $path_info, $action, $is_bulk, $is_batch, $path_parts);
                    break;
                } elseif ($input['_method'] === 'PATCH') {
                    // Handle PATCH operations via POST method override
                    handlePatchOperation($testCodeService, $path_info, $path_parts, $input);
                    break;
                }
            }

            // Handle actual POST - bulk creation
            if ($action === 'bulk' || $is_bulk) {
                // Bulk creation using service
                if (!$input) {
                    Response::badRequest('Invalid JSON data');
                }

                // Validate required fields with better error handling
                $required_fields = [
                    'title', 'subject_id', 'class_level', 'duration_minutes',
                    'total_questions', 'score_per_question', 'term_id', 'session_id', 'count'
                ];
                
                $missing_fields = [];
                foreach ($required_fields as $field) {
                    if (!isset($input[$field]) || $input[$field] === '' || $input[$field] === null) {
                        $missing_fields[] = $field;
                    }
                }
                
                if (!empty($missing_fields)) {
                    error_log("Missing required fields: " . implode(', ', $missing_fields));
                    error_log("Input data received: " . json_encode($input, JSON_PRETTY_PRINT));
                    Response::badRequest('Missing required fields: ' . implode(', ', $missing_fields));
                }
                
                // Log successful validation
                error_log("All required fields present, proceeding with bulk creation");

                $count = (int)($input['count'] ?? 1);
                if ($count < 1 || $count > 100) {
                    Response::badRequest('Count must be between 1 and 100');
                }

                // Map test_type to assignment for validation
                $test_type = $input['test_type'] ?? 'first_ca';

                // Log input data before service call
                error_log("Calling TestCodeService::bulkCreateTestCodes with data: " . json_encode([
                    'input' => $input,
                    'count' => $count,
                    'user_id' => $user['id']
                ]));

                // Create test codes using service
                try {
                    $result = $testCodeService->bulkCreateTestCodes($input, $count, $user['id']);
                    
                    error_log("TestCodeService result: " . json_encode($result));

                    if ($result['success']) {
                        Response::created('Test codes created successfully', [
                            'batch_id' => $result['batch_id'],
                            'codes' => $result['created'],
                            'total_created' => $result['total_created'],
                            'total_requested' => $result['total_requested'],
                            'errors' => $result['errors']
                        ]);
                    } else {
                        // Create a detailed error message with context
                        $errorMessage = 'Failed to create test codes';
                        if (!empty($result['errors'])) {
                            // Get the first error and clean it up for display
                            $firstError = $result['errors'][0];
                            // Extract the meaningful part (everything after "Code X: ")
                            if (strpos($firstError, ': ') !== false) {
                                $baseError = substr($firstError, strpos($firstError, ': ') + 2);
                                
                                // Add context information with actual names for better UX
                                $contextInfo = [];
                                
                                // Get subject name
                                if (!empty($input['subject_id'])) {
                                    try {
                                        $subjectService = SubjectService::getInstance();
                                        $subjectName = $subjectService->getSubjectName($input['subject_id']);
                                        $contextInfo[] = $subjectName ? $subjectName : "Subject ID: {$input['subject_id']}";
                                    } catch (Exception $e) {
                                        $contextInfo[] = "Subject ID: {$input['subject_id']}";
                                    }
                                }
                                
                                // Get term name
                                if (!empty($input['term_id'])) {
                                    try {
                                        $termService = TermService::getInstance();
                                        $termName = $termService->getTermName($input['term_id']);
                                        $contextInfo[] = $termName ? $termName : "Term ID: {$input['term_id']}";
                                    } catch (Exception $e) {
                                        $contextInfo[] = "Term ID: {$input['term_id']}";
                                    }
                                }
                                
                                // Add class level
                                if (!empty($input['class_level'])) {
                                    $contextInfo[] = "Class: {$input['class_level']}";
                                }
                                
                                // Add test type/assignment
                                if (!empty($input['test_type'])) {
                                    $contextInfo[] = "Assignment: {$input['test_type']}";
                                }
                                
                                if (!empty($contextInfo)) {
                                    $errorMessage = $baseError . ' for ' . implode(', ', $contextInfo);
                                } else {
                                    $errorMessage = $baseError;
                                }
                            } else {
                                $errorMessage = $firstError;
                            }
                        }
                        
                        error_log("TestCodeService failed: " . $errorMessage);
                        error_log("All errors: " . json_encode($result['errors']));
                        Response::badRequest($errorMessage);
                    }
                } catch (Exception $serviceException) {
                    error_log("TestCodeService threw exception: " . $serviceException->getMessage());
                    error_log("Exception trace: " . $serviceException->getTraceAsString());
                    Response::serverError('Failed to create test codes: ' . $serviceException->getMessage());
                }
            } else {
                // Single test code creation
                $result = $testCodeService->createTestCode($input, $user['id']);

                if ($result['success']) {
                    Response::created('Test code created successfully', [
                        'id' => $result['id'],
                        'code' => $result['code']
                    ]);
                } else {
                    Response::badRequest($result['message']);
                }
            }
            break;

        case 'PATCH':
            handlePatchOperation($testCodeService, $path_info, $path_parts, json_decode(file_get_contents('php://input'), true));
            break;

        case 'DELETE':
            handleDeleteOperation($testCodeService, $path_info, $action, $is_bulk, $is_batch, $path_parts);
            break;

        default:
            Response::methodNotAllowed();
    }

} catch (Exception $e) {
    Response::serverError('An error occurred: ' . $e->getMessage());
}

?>