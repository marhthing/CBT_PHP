<?php
/**
 * Debug Authentication Headers for InfinityFree
 * Use this to test if headers are being received properly
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

echo json_encode([
    'success' => true,
    'debug_info' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'Not found',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'Not found',
        'HTTP_X_AUTHORIZATION' => $_SERVER['HTTP_X_AUTHORIZATION'] ?? 'Not found',
        'all_headers' => function_exists('getallheaders') ? getallheaders() : 'getallheaders() not available',
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'],
        'CONTENT_TYPE' => $_SERVER['CONTENT_TYPE'] ?? 'Not set',
        'PHP_INPUT' => file_get_contents('php://input'),
        'GET_params' => $_GET,
        'POST_params' => $_POST
    ],
    'message' => 'Use this endpoint to debug JWT header issues on InfinityFree'
]);
?>