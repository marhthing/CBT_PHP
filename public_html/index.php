<?php

// Main entry point for InfinityFree hosting
// This file serves both the React frontend and API endpoints

// Load environment configuration
require_once __DIR__ . '/config/environment.php';

// Set CORS headers for InfinityFree compatibility
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load response helpers
require_once __DIR__ . '/includes/response.php';

// Get the request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query string from URI
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove any leading slashes and clean the path
$path = ltrim($path, '/');

// Handle API requests
if (strpos($path, 'api/') === 0) {
    // Remove 'api/' prefix and route to backend
    $api_path = substr($path, 4);
    
    // Define route mappings
    $routes = [
        // Authentication routes
        'auth/login' => 'api/auth/login.php',
        'auth/signup' => 'api/auth/signup.php',
        'auth/auto-login' => 'api/auth/auto-login.php',
        'auth/logout' => 'api/auth/logout.php',
        'auth/me' => 'api/auth/me.php',
        
        // Student routes
        'student/tests' => 'api/student/tests.php',
        'student/available-tests' => 'api/student/available-tests.php',
        'student/validate-test-code' => 'api/student/validate-test-code.php',
        'student/take-test' => 'api/student/take-test.php',
        'student/submit-test' => 'api/student/submit-test.php',
        'student/results' => 'api/student/results.php',
        
        // Teacher routes
        'teacher/questions/bulk' => 'api/teacher/questions/bulk.php',
        'teacher/questions' => 'api/teacher/questions.php',
        'teacher/assignments' => 'api/teacher/assignments.php',
        'teacher/bulk-upload' => 'api/teacher/bulk-upload.php',
        'teacher/classes' => 'api/teacher/classes.php',
        
        // Admin routes
        'admin/dashboard-stats' => 'api/admin/dashboard-stats.php',
        'admin/test-codes' => 'api/admin/test-codes.php',
        'admin/questions/bulk' => 'api/admin/questions/bulk.php',
        'admin/questions/count' => 'api/admin/questions/count.php',
        'admin/questions' => 'api/admin/questions.php',
        'admin/teachers' => 'api/admin/teachers.php',
        'admin/assignments' => 'api/admin/assignments.php',
        
        // System routes
        'system/lookup' => 'api/system/lookup.php',
        
        // Health check
        'health' => 'api/health.php'
    ];
    
    // Find matching route
    $route_file = null;
    foreach ($routes as $route => $file) {
        if ($api_path === $route || $api_path === "/$route") {
            $route_file = __DIR__ . "/$file";
            break;
        }
        // Handle routes with parameters
        if (preg_match("#^{$route}/\d+$#", $api_path) || 
            preg_match("#^{$route}/[a-zA-Z0-9\-_]+$#", $api_path) ||
            preg_match("#^{$route}/\d+/[a-zA-Z0-9\-_]+$#", $api_path) ||
            preg_match("#^{$route}/batch/[a-zA-Z0-9\-_.]+/[a-zA-Z0-9\-_]+$#", $api_path)) {
            $route_file = __DIR__ . "/$file";
            break;
        }
    }
    
    if ($route_file && file_exists($route_file)) {
        try {
            include $route_file;
        } catch (Throwable $e) {
            // Enhanced error reporting for debugging
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine(),
                'route' => $api_path
            ]);
        }
    } else {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'API endpoint not found',
            'requested_path' => $api_path,
            'available_routes' => array_keys($routes)
        ]);
    }
    exit();
}

// Handle static assets (CSS, JS, images)
if (preg_match('/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i', $path)) {
    $asset_path = __DIR__ . '/' . $path;
    if (file_exists($asset_path)) {
        // Set appropriate content type
        $mime_types = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject'
        ];
        
        $extension = strtolower(pathinfo($asset_path, PATHINFO_EXTENSION));
        $content_type = $mime_types[$extension] ?? 'application/octet-stream';
        
        header('Content-Type: ' . $content_type);
        header('Cache-Control: public, max-age=31536000');
        readfile($asset_path);
        exit();
    }
}

// Serve React frontend for all other routes
$index_html = __DIR__ . '/index.html';
if (file_exists($index_html)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($index_html);
} else {
    Response::serverError('Frontend build files not found');
}

?>