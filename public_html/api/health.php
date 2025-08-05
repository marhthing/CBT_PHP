<?php
// Health check endpoint for InfinityFree
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';

try {
    // Test database connection
    $db_result = testDatabaseConnection();
    
    $health_data = [
        'status' => 'ok',
        'timestamp' => date('c'),
        'version' => '1.0.0',
        'platform' => 'infinityfree',
        'database' => $db_result['success'] ? 'connected' : 'disconnected',
        'php_version' => PHP_VERSION
    ];
    
    if (!$db_result['success']) {
        $health_data['status'] = 'degraded';
        $health_data['issues'] = ['database_connection_failed'];
    }
    
    $status_code = $health_data['status'] === 'ok' ? 200 : 503;
    Response::json($health_data, $status_code);
    
} catch (Exception $e) {
    Response::json([
        'status' => 'error',
        'message' => 'Health check failed',
        'timestamp' => date('c')
    ], 503);
}
?>