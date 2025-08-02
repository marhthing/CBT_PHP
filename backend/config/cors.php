<?php

class CORS {
    
    public static function handle() {
        // Get allowed origins from environment or use defaults
        $allowed_origins = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:5000,http://localhost:3000';
        $origins = array_map('trim', explode(',', $allowed_origins));
        
        $allowed_methods = $_ENV['CORS_ALLOWED_METHODS'] ?? 'GET,POST,PUT,DELETE,OPTIONS,PATCH';
        $allowed_headers = $_ENV['CORS_ALLOWED_HEADERS'] ?? 'Content-Type,Authorization,X-Requested-With';
        
        // Get the origin of the request
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // For development, allow localhost origins more broadly
        if (strpos($origin, 'http://localhost:') === 0 || in_array($origin, $origins) || in_array('*', $origins)) {
            header("Access-Control-Allow-Origin: " . ($origin ?: 'http://localhost:5000'));
        } else {
            // Default to localhost:5000 for development
            header("Access-Control-Allow-Origin: http://localhost:5000");
        }
        
        // Set other CORS headers
        header("Access-Control-Allow-Methods: " . $allowed_methods);
        header("Access-Control-Allow-Headers: " . $allowed_headers);
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 86400"); // 24 hours
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
    
    public static function addSecurityHeaders() {
        // Additional security headers
        header("X-Content-Type-Options: nosniff");
        header("X-Frame-Options: DENY");
        header("X-XSS-Protection: 1; mode=block");
        header("Referrer-Policy: strict-origin-when-cross-origin");
        
        // Content Security Policy (basic)
        $csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";
        header("Content-Security-Policy: " . $csp);
    }
    
    public static function setContentType($type = 'application/json') {
        header("Content-Type: " . $type . "; charset=UTF-8");
    }
    
    public static function handleError($code, $message) {
        http_response_code($code);
        self::setContentType();
        echo json_encode([
            'success' => false,
            'message' => $message,
            'timestamp' => date('c')
        ]);
        exit();
    }
}

// Apply CORS headers to all requests
CORS::handle();
CORS::addSecurityHeaders();
CORS::setContentType();

?>
