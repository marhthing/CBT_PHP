<?php
// Multi-platform CORS configuration - InfinityFree priority
$allowed_origins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'https://*.infinityfreeapp.com',
    'https://*.infinityfree.net',
    'https://*.infinityfree.com',
    'https://*.000webhostapp.com',
    'https://*.netlify.app',
    'https://*.vercel.app',
    'https://*.herokuapp.com',
    'https://*.render.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$frontend_url = '*';

// Check if origin matches allowed patterns
foreach ($allowed_origins as $allowed) {
    if (fnmatch($allowed, $origin)) {
        $frontend_url = $origin;
        break;
    }
}

// If no specific match and origin exists, use it (for flexibility)
if ($frontend_url === '*' && !empty($origin)) {
    $frontend_url = $origin;
}

header("Access-Control-Allow-Origin: " . $frontend_url);
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json; charset=utf-8");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>