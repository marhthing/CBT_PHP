<?php
session_start();
require_once '../config/db.php';
require_once '../includes/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit;
}

// Only allow admins to activate/deactivate codes
if ($_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit;
}

$action = $_POST['action'] ?? '';
$codeId = (int)($_POST['code_id'] ?? 0);

if (empty($action) || $codeId <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
    exit;
}

try {
    switch ($action) {
        case 'activate':
            handleActivateCode($codeId);
            break;
        case 'deactivate':
            handleDeactivateCode($codeId);
            break;
        case 'toggle':
            handleToggleCode($codeId);
            break;
        case 'batch_activate':
            handleBatchActivate();
            break;
        case 'batch_deactivate':
            handleBatchDeactivate();
            break;
        case 'batch_toggle':
            handleBatchToggle();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    error_log("Code activation error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error occurred']);
}

/**
 * Handle activating a single test code
 */
function handleActivateCode($codeId) {
    global $db;
    
    // Get code details
    $codeQuery = "SELECT id, code, active, class_name, subject_name, test_type FROM test_codes WHERE id = ?";
    $code = $db->fetch($codeQuery, [$codeId]);
    
    if (!$code) {
        echo json_encode(['success' => false, 'message' => 'Test code not found']);
        return;
    }
    
    if ($code['active']) {
        echo json_encode(['success' => false, 'message' => 'Test code is already active']);
        return;
    }
    
    try {
        $db->getConnection()->beginTransaction();
        
        // Update code status
        $updateQuery = "UPDATE test_codes SET active = true, activated_at = NOW() WHERE id = ?";
        $db->execute($updateQuery, [$codeId]);
        
        // Log activity
        logActivity($_SESSION['user_id'], 'Test Code Activated', 
                   "Activated code {$code['code']} for {$code['class_name']} - {$code['subject_name']} ({$code['test_type']})");
        
        $db->getConnection()->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Test code activated successfully',
            'code' => $code['code'],
            'status' => 'active'
        ]);
        
    } catch (Exception $e) {
        $db->getConnection()->rollback();
        throw $e;
    }
}

/**
 * Handle deactivating a single test code
 */
function handleDeactivateCode($codeId) {
    global $db;
    
    // Get code details
    $codeQuery = "SELECT id, code, active, class_name, subject_name, test_type FROM test_codes WHERE id = ?";
    $code = $db->fetch($codeQuery, [$codeId]);
    
    if (!$code) {
        echo json_encode(['success' => false, 'message' => 'Test code not found']);
        return;
    }
    
    if (!$code['active']) {
        echo json_encode(['success' => false, 'message' => 'Test code is already inactive']);
        return;
    }
    
    // Check if any students have taken the test
    $resultsQuery = "SELECT COUNT(*) as count FROM test_results WHERE test_code_id = ?";
    $resultsCount = $db->fetch($resultsQuery, [$codeId])['count'];
    
    if ($resultsCount > 0) {
        echo json_encode([
            'success' => false, 
            'message' => "Cannot deactivate code - {$resultsCount} students have already taken this test",
            'students_count' => $resultsCount
        ]);
        return;
    }
    
    try {
        $db->getConnection()->beginTransaction();
        
        // Update code status
        $updateQuery = "UPDATE test_codes SET active = false, deactivated_at = NOW() WHERE id = ?";
        $db->execute($updateQuery, [$codeId]);
        
        // Log activity
        logActivity($_SESSION['user_id'], 'Test Code Deactivated', 
                   "Deactivated code {$code['code']} for {$code['class_name']} - {$code['subject_name']} ({$code['test_type']})");
        
        $db->getConnection()->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Test code deactivated successfully',
            'code' => $code['code'],
            'status' => 'inactive'
        ]);
        
    } catch (Exception $e) {
        $db->getConnection()->rollback();
        throw $e;
    }
}

/**
 * Handle toggling a single test code status
 */
function handleToggleCode($codeId) {
    global $db;
    
    // Get code details
    $codeQuery = "SELECT id, code, active, class_name, subject_name, test_type FROM test_codes WHERE id = ?";
    $code = $db->fetch($codeQuery, [$codeId]);
    
    if (!$code) {
        echo json_encode(['success' => false, 'message' => 'Test code not found']);
        return;
    }
    
    if ($code['active']) {
        // Deactivate
        handleDeactivateCode($codeId);
    } else {
        // Activate
        handleActivateCode($codeId);
    }
}

/**
 * Handle batch activation of multiple test codes
 */
function handleBatchActivate() {
    $codeIds = $_POST['code_ids'] ?? [];
    
    if (empty($codeIds) || !is_array($codeIds)) {
        echo json_encode(['success' => false, 'message' => 'No codes selected']);
        return;
    }
    
    handleBatchOperation($codeIds, 'activate');
}

/**
 * Handle batch deactivation of multiple test codes
 */
function handleBatchDeactivate() {
    $codeIds = $_POST['code_ids'] ?? [];
    
    if (empty($codeIds) || !is_array($codeIds)) {
        echo json_encode(['success' => false, 'message' => 'No codes selected']);
        return;
    }
    
    handleBatchOperation($codeIds, 'deactivate');
}

/**
 * Handle batch toggle of multiple test codes
 */
function handleBatchToggle() {
    $codeIds = $_POST['code_ids'] ?? [];
    
    if (empty($codeIds) || !is_array($codeIds)) {
        echo json_encode(['success' => false, 'message' => 'No codes selected']);
        return;
    }
    
    handleBatchOperation($codeIds, 'toggle');
}

/**
 * Handle batch operations on test codes
 */
function handleBatchOperation($codeIds, $operation) {
    global $db;
    
    // Validate code IDs
    $codeIds = array_filter(array_map('intval', $codeIds), function($id) { return $id > 0; });
    
    if (empty($codeIds)) {
        echo json_encode(['success' => false, 'message' => 'Invalid code IDs']);
        return;
    }
    
    try {
        $db->getConnection()->beginTransaction();
        
        $successCount = 0;
        $errors = [];
        $results = [];
        
        foreach ($codeIds as $codeId) {
            // Get code details
            $codeQuery = "SELECT id, code, active, class_name, subject_name, test_type FROM test_codes WHERE id = ?";
            $code = $db->fetch($codeQuery, [$codeId]);
            
            if (!$code) {
                $errors[] = "Code ID {$codeId} not found";
                continue;
            }
            
            $shouldActivate = false;
            $shouldDeactivate = false;
            
            switch ($operation) {
                case 'activate':
                    if (!$code['active']) {
                        $shouldActivate = true;
                    } else {
                        $errors[] = "Code {$code['code']} is already active";
                    }
                    break;
                case 'deactivate':
                    if ($code['active']) {
                        // Check if any students have taken the test
                        $resultsQuery = "SELECT COUNT(*) as count FROM test_results WHERE test_code_id = ?";
                        $resultsCount = $db->fetch($resultsQuery, [$codeId])['count'];
                        
                        if ($resultsCount > 0) {
                            $errors[] = "Cannot deactivate code {$code['code']} - {$resultsCount} students have taken this test";
                            continue;
                        }
                        $shouldDeactivate = true;
                    } else {
                        $errors[] = "Code {$code['code']} is already inactive";
                    }
                    break;
                case 'toggle':
                    if ($code['active']) {
                        // Check if any students have taken the test before deactivating
                        $resultsQuery = "SELECT COUNT(*) as count FROM test_results WHERE test_code_id = ?";
                        $resultsCount = $db->fetch($resultsQuery, [$codeId])['count'];
                        
                        if ($resultsCount > 0) {
                            $errors[] = "Cannot deactivate code {$code['code']} - {$resultsCount} students have taken this test";
                            continue;
                        }
                        $shouldDeactivate = true;
                    } else {
                        $shouldActivate = true;
                    }
                    break;
            }
            
            if ($shouldActivate) {
                $updateQuery = "UPDATE test_codes SET active = true, activated_at = NOW() WHERE id = ?";
                $db->execute($updateQuery, [$codeId]);
                
                logActivity($_SESSION['user_id'], 'Test Code Activated (Batch)', 
                           "Activated code {$code['code']} for {$code['class_name']} - {$code['subject_name']}");
                
                $results[] = [
                    'code' => $code['code'],
                    'action' => 'activated',
                    'status' => 'active'
                ];
                $successCount++;
                
            } elseif ($shouldDeactivate) {
                $updateQuery = "UPDATE test_codes SET active = false, deactivated_at = NOW() WHERE id = ?";
                $db->execute($updateQuery, [$codeId]);
                
                logActivity($_SESSION['user_id'], 'Test Code Deactivated (Batch)', 
                           "Deactivated code {$code['code']} for {$code['class_name']} - {$code['subject_name']}");
                
                $results[] = [
                    'code' => $code['code'],
                    'action' => 'deactivated',
                    'status' => 'inactive'
                ];
                $successCount++;
            }
        }
        
        $db->getConnection()->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Successfully processed {$successCount} test codes",
            'results' => $results,
            'errors' => $errors,
            'total_processed' => $successCount,
            'total_errors' => count($errors)
        ]);
        
    } catch (Exception $e) {
        $db->getConnection()->rollback();
        throw $e;
    }
}
?>
