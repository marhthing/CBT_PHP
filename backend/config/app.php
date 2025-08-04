<?php

// Application Configuration
class AppConfig {
    public static function get($key, $default = null) {
        // Get from environment variables first, then use defaults
        $config = [
            'api_base_url' => getenv('API_BASE_URL') ?: ($_ENV['API_BASE_URL'] ?? 'http://localhost:8000'),
            'frontend_url' => getenv('FRONTEND_URL') ?: ($_ENV['FRONTEND_URL'] ?? 'http://localhost:8000'),
            'backend_port' => getenv('BACKEND_PORT') ?: ($_ENV['BACKEND_PORT'] ?? '8000'),
            'cors_origin' => getenv('CORS_ORIGIN') ?: ($_ENV['CORS_ORIGIN'] ?? 'http://localhost:8000'),
            'cors_methods' => getenv('CORS_METHODS') ?: ($_ENV['CORS_METHODS'] ?? 'GET,POST,PUT,DELETE,OPTIONS'),
            'cors_headers' => getenv('CORS_HEADERS') ?: ($_ENV['CORS_HEADERS'] ?? 'Content-Type,Authorization,X-Requested-With'),
            'jwt_secret' => getenv('JWT_SECRET') ?: ($_ENV['JWT_SECRET'] ?? 'your-secret-key-here'),
            'jwt_expiry' => getenv('JWT_EXPIRY') ?: ($_ENV['JWT_EXPIRY'] ?? '86400'),
            'app_env' => getenv('APP_ENV') ?: ($_ENV['APP_ENV'] ?? 'production'),
            'debug' => getenv('DEBUG') ?: ($_ENV['DEBUG'] ?? 'false'),
            'timezone' => getenv('TIMEZONE') ?: ($_ENV['TIMEZONE'] ?? 'UTC'),
        ];
        
        return isset($config[$key]) ? $config[$key] : $default;
    }
    
    public static function isDebug() {
        return self::get('debug') === 'true';
    }
    
    public static function isDevelopment() {
        return self::get('app_env') === 'development';
    }
    
    public static function isProduction() {
        return self::get('app_env') === 'production';
    }
}

?>