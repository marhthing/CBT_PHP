<?php

// Main entry point for the CBT Portal PHP Backend
// This file serves as the central router for all API endpoints

// Load environment variables from .env file and system environment
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value, '"\'');
        }
    }
}

// Load system environment variables for database
$system_env_vars = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGPORT', 'DATABASE_URL'];
foreach ($system_env_vars as $var) {
    if (getenv($var) !== false) {
        $_ENV[$var] = getenv($var);
    }
}

// Set error reporting based on environment
if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Set timezone
date_default_timezone_set($_ENV['TIMEZONE'] ?? 'UTC');

// Include necessary files
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/includes/response.php';

// Get the request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove query string from URI
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove any trailing slashes and leading path components
$path = rtrim($path, '/');
if (strpos($path, '/api/') === 0) {
    $path = substr($path, 4); // Remove '/api' prefix
}

// Log the request for debugging
if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
}

// Handle root path - redirect to frontend
if ($path === '' || $path === '/') {
    // Get the current host
    $host = $_SERVER['HTTP_HOST'];
    
    // Check if we're running on a Replit domain
    if (strpos($host, '.replit.dev') !== false || strpos($host, '.replit.app') !== false) {
        // Redirect to port 5000 on the same domain
        $frontend_url = 'https://' . $host . ':5000';
        header('Location: ' . $frontend_url);
        exit();
    } else {
        // For local development, redirect to localhost:5000
        header('Location: http://localhost:5000');
        exit();
    }
}

// Handle health check endpoint
if ($path === '/health' || $path === 'health') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: *');
    handleHealthCheck();
    exit();
}

// Handle API documentation endpoint
if ($path === '/docs' || $path === 'docs') {
    handleApiDocs();
    exit();
}

// Define route mappings
$routes = [
    // Authentication routes
    'auth/login' => 'auth/login.php',
    'auth/auto-login' => 'auth/auto-login.php',
    'auth/logout' => 'auth/logout.php',
    'auth/me' => 'auth/me.php',
    
    // Student routes
    'student/tests' => 'student/tests.php',
    'student/available-tests' => 'student/available-tests.php',
    'student/validate-test-code' => 'student/validate-test-code.php',
    'student/take-test' => 'student/take-test.php',
    'student/submit-test' => 'student/submit-test.php',
    'student/results' => 'student/results.php',
    
    // Teacher routes
    'teacher/questions/bulk' => 'teacher/questions/bulk.php',
    'teacher/questions' => 'teacher/questions.php',
    'teacher/assignments' => 'teacher/assignments.php',
    'teacher/bulk-upload' => 'teacher/bulk-upload.php',
    'teacher/classes' => 'teacher/classes.php',
    
    // Admin routes
    'admin/dashboard-stats' => 'admin/dashboard-stats.php',
    'admin/test-codes' => 'admin/test-codes.php',
    'admin/questions/bulk' => 'admin/questions/bulk.php',
    'admin/questions/count' => 'admin/questions/count.php',
    'admin/questions' => 'admin/questions.php',
    'admin/teachers' => 'admin/teachers.php',
    'admin/assignments' => 'admin/assignments.php',
    
    // System routes
    'system/lookup' => 'system/lookup.php',
    
    // Debug routes (development only)
    'debug/headers' => 'debug/headers.php',
];

// Find matching route - handle both exact matches and patterns with IDs
$route_file = null;
foreach ($routes as $route => $file) {
    if ($path === $route || $path === "/$route") {
        $route_file = __DIR__ . "/api/$file";
        break;
    }
    // Check for routes with ID parameters (e.g., admin/questions/123)
    if (preg_match("#^/?{$route}/\d+$#", $path)) {
        $route_file = __DIR__ . "/api/$file";
        break;
    }
    // Check for routes with query parameters (e.g., admin/questions/count)
    if (preg_match("#^/?{$route}/[a-zA-Z0-9\-_]+$#", $path)) {
        $route_file = __DIR__ . "/api/$file";
        break;
    }
    // Check for routes with nested paths (e.g., admin/test-codes/123/toggle-activation or admin/test-codes/batch/xyz/toggle-activation)
    if (preg_match("#^/?{$route}/\d+/[a-zA-Z0-9\-_]+$#", $path) || 
        preg_match("#^/?{$route}/batch/[a-zA-Z0-9\-_.]+/[a-zA-Z0-9\-_]+$#", $path) ||
        preg_match("#^/?{$route}/batch/[a-zA-Z0-9\-_.]+$#", $path)) {
        $route_file = __DIR__ . "/api/$file";
        break;
    }
}

// Handle the request
if ($route_file && file_exists($route_file)) {
    try {
        include $route_file;
    } catch (Throwable $e) {
        Response::serverError('An error occurred while processing your request');
    }
} else {
    // Route not found
    Response::notFound('API endpoint not found');
}

// Health check endpoint
function handleHealthCheck() {
    try {
        // Test database connection
        require_once __DIR__ . '/config/database.php';
        $db_result = testDatabaseConnection();
        
        $health_data = [
            'status' => 'ok',
            'timestamp' => date('c'),
            'version' => '1.0.0',
            'environment' => $_ENV['APP_ENV'] ?? 'production',
            'database' => $db_result['success'] ? 'connected' : 'disconnected',
            'php_version' => PHP_VERSION,
            'memory_usage' => memory_get_usage(true),
            'uptime' => time() - $_SERVER['REQUEST_TIME']
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
}

// API documentation endpoint
function handleApiDocs() {
    $docs = [
        'title' => 'CBT Portal API Documentation',
        'version' => '1.0.0',
        'description' => 'Computer-Based Testing Portal REST API',
        'base_url' => $_ENV['APP_URL'] ?? 'http://localhost:8000',
        'endpoints' => [
            'Authentication' => [
                'POST /api/auth/login' => 'User login with username, password, and role',
                'POST /api/auth/logout' => 'User logout',
                'GET /api/auth/me' => 'Get current user information'
            ],
            'Student' => [
                'GET /api/student/tests' => 'Get available test codes',
                'GET /api/student/take-test?code={code}' => 'Get test questions for a specific code',
                'POST /api/student/submit-test' => 'Submit test answers',
                'GET /api/student/results' => 'Get student test results'
            ],
            'Teacher' => [
                'GET /api/teacher/questions' => 'Get teacher questions (with filters)',
                'POST /api/teacher/questions' => 'Create new question',
                'PUT /api/teacher/questions?id={id}' => 'Update existing question',
                'DELETE /api/teacher/questions?id={id}' => 'Delete question',
                'POST /api/teacher/bulk-upload' => 'Upload questions via CSV file',
                'GET /api/teacher/classes' => 'Get assigned classes and subjects'
            ],
            'Admin' => [
                'GET /api/admin/test-codes' => 'Get all test codes',
                'POST /api/admin/test-codes' => 'Create new test code',
                'PUT /api/admin/test-codes?id={id}' => 'Update test code',
                'PATCH /api/admin/test-codes?id={id}' => 'Toggle test code active status',
                'DELETE /api/admin/test-codes?id={id}' => 'Delete test code',
                'GET /api/admin/questions' => 'Get all questions in system',
                'DELETE /api/admin/questions?id={id}' => 'Delete any question',
                'GET /api/admin/teachers' => 'Get all teachers',
                'POST /api/admin/teachers' => 'Create new teacher',
                'PUT /api/admin/teachers?id={id}' => 'Update teacher',
                'DELETE /api/admin/teachers?id={id}' => 'Delete teacher',
                'GET /api/admin/assignments' => 'Get teacher assignments',
                'POST /api/admin/assignments' => 'Create teacher assignment',
                'DELETE /api/admin/assignments?id={id}' => 'Delete assignment'
            ]
        ],
        'authentication' => [
            'type' => 'Bearer Token (JWT)',
            'header' => 'Authorization: Bearer <token>',
            'note' => 'Include JWT token in Authorization header for protected endpoints'
        ],
        'response_format' => [
            'success' => [
                'success' => true,
                'message' => 'Operation completed successfully',
                'data' => 'Response data (optional)',
                'timestamp' => 'ISO 8601 timestamp'
            ],
            'error' => [
                'success' => false,
                'message' => 'Error description',
                'errors' => 'Detailed errors (optional)',
                'timestamp' => 'ISO 8601 timestamp'
            ]
        ],
        'status_codes' => [
            200 => 'OK - Request successful',
            201 => 'Created - Resource created successfully',
            400 => 'Bad Request - Invalid request data',
            401 => 'Unauthorized - Authentication required',
            403 => 'Forbidden - Insufficient permissions',
            404 => 'Not Found - Resource not found',
            405 => 'Method Not Allowed - HTTP method not supported',
            422 => 'Unprocessable Entity - Validation failed',
            429 => 'Too Many Requests - Rate limit exceeded',
            500 => 'Internal Server Error - Server error'
        ]
    ];
    
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($docs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}

// Additional utility functions
function getClientIp() {
    $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($ip_keys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function getUserAgent() {
    return $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
}

function logApiAccess($endpoint, $method, $user_id = null, $status_code = 200) {
    if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
        $log_entry = [
            'timestamp' => date('c'),
            'endpoint' => $endpoint,
            'method' => $method,
            'user_id' => $user_id,
            'status_code' => $status_code,
            'ip' => getClientIp(),
            'user_agent' => getUserAgent()
        ];
        
    }
}

?>
