<?php

class Response {
    
    public static function json($data, $status_code = 200) {
        http_response_code($status_code);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }
    
    public static function success($message = 'Success', $data = null, $status_code = 200) {
        $response = [
            'success' => true,
            'message' => $message,
            'timestamp' => date('c')
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        self::json($response, $status_code);
    }
    
    public static function error($message = 'An error occurred', $status_code = 400, $errors = null) {
        $response = [
            'success' => false,
            'message' => $message,
            'timestamp' => date('c')
        ];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        self::json($response, $status_code);
    }
    
    public static function badRequest($message = 'Bad request') {
        self::error($message, 400);
    }
    
    public static function unauthorized($message = 'Unauthorized access') {
        self::error($message, 401);
    }
    
    public static function forbidden($message = 'Access forbidden') {
        self::error($message, 403);
    }
    
    public static function notFound($message = 'Resource not found') {
        self::error($message, 404);
    }
    
    public static function methodNotAllowed($message = 'Method not allowed') {
        self::error($message, 405);
    }
    
    public static function validationError($message = 'Validation failed', $errors = []) {
        self::error($message, 422, $errors);
    }
    
    public static function serverError($message = 'Internal server error') {
        self::error($message, 500);
    }
    
    public static function created($message = 'Resource created successfully', $data = null) {
        self::success($message, $data, 201);
    }
    
    public static function updated($message = 'Resource updated successfully', $data = null) {
        self::success($message, $data, 200);
    }
    
    public static function deleted($message = 'Resource deleted successfully') {
        self::success($message, null, 200);
    }
    
    // Pagination helper
    public static function paginated($data, $total, $page, $per_page, $message = 'Data retrieved successfully') {
        $total_pages = ceil($total / $per_page);
        
        $response_data = [
            'items' => $data,
            'pagination' => [
                'current_page' => (int) $page,
                'per_page' => (int) $per_page,
                'total_items' => (int) $total,
                'total_pages' => (int) $total_pages,
                'has_next' => $page < $total_pages,
                'has_prev' => $page > 1
            ]
        ];
        
        self::success($message, $response_data);
    }
    
    // Input validation helper
    public static function validateRequired($data, $required_fields) {
        $missing_fields = [];
        
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing_fields[] = $field;
            }
        }
        
        if (!empty($missing_fields)) {
            self::validationError(
                'Missing required fields: ' . implode(', ', $missing_fields),
                ['missing_fields' => $missing_fields]
            );
        }
        
        return true;
    }
    
    // Sanitize input data
    public static function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        } else {
            return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
        }
    }
    
    // Rate limiting helper
    public static function checkRateLimit($identifier, $max_requests = 100, $time_window = 3600) {
        // Simple file-based rate limiting (in production, use Redis or database)
        $rate_limit_file = sys_get_temp_dir() . '/rate_limit_' . md5($identifier);
        
        $current_time = time();
        $requests = [];
        
        if (file_exists($rate_limit_file)) {
            $content = file_get_contents($rate_limit_file);
            $requests = json_decode($content, true) ?: [];
        }
        
        // Remove old requests outside the time window
        $requests = array_filter($requests, function($timestamp) use ($current_time, $time_window) {
            return ($current_time - $timestamp) < $time_window;
        });
        
        // Check if rate limit exceeded
        if (count($requests) >= $max_requests) {
            self::error('Rate limit exceeded. Please try again later.', 429);
        }
        
        // Add current request
        $requests[] = $current_time;
        
        // Save updated requests
        file_put_contents($rate_limit_file, json_encode($requests));
        
        return true;
    }
    
    // Log API requests (for debugging)
    public static function logRequest($endpoint, $method, $user_id = null) {
        if ($_ENV['APP_DEBUG'] === 'true') {
            $log_data = [
                'timestamp' => date('c'),
                'endpoint' => $endpoint,
                'method' => $method,
                'user_id' => $user_id,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ];
            
            error_log('API Request: ' . json_encode($log_data));
        }
    }
}

// Set up error handling for uncaught exceptions
set_exception_handler(function($exception) {
    error_log('Uncaught exception: ' . $exception->getMessage());
    
    if ($_ENV['APP_DEBUG'] === 'true') {
        Response::serverError('Internal server error: ' . $exception->getMessage());
    } else {
        Response::serverError('An unexpected error occurred');
    }
});

// Set up error handling for PHP errors
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    
    throw new ErrorException($message, 0, $severity, $file, $line);
});

?>
