<?php

require_once __DIR__ . '/config/cors.php';

echo json_encode([
    'getallheaders' => function_exists('getallheaders') ? getallheaders() : 'Not available',
    'server_vars' => [
        'HTTP_AUTHORIZATION' => $_SERVER['HTTP_AUTHORIZATION'] ?? 'Not set',
        'REDIRECT_HTTP_AUTHORIZATION' => $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? 'Not set',
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? 'Not set',
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'Not set'
    ],
    'all_server_vars' => array_filter($_SERVER, function($key) {
        return strpos($key, 'HTTP_') === 0 || strpos($key, 'REDIRECT_') === 0;
    }, ARRAY_FILTER_USE_KEY)
], JSON_PRETTY_PRINT);

?>