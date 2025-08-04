<?php

require_once __DIR__ . '/../../cors.php';

// Debug endpoint to check headers
header('Content-Type: application/json');
echo json_encode([
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'request_uri' => $_SERVER['REQUEST_URI'],
    'getallheaders' => function_exists('getallheaders') ? getallheaders() : 'Not available',
    'server_auth_vars' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'Not set',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'Not set',
    ],
    'all_http_vars' => array_filter($_SERVER, function($key) {
        return strpos($key, 'HTTP_') === 0 || strpos($key, 'REDIRECT_') === 0;
    }, ARRAY_FILTER_USE_KEY)
], JSON_PRETTY_PRINT);

?>