<?php

// Application Configuration
class AppConfig {
    public static function get($key, $default = null) {
        // Detect if we're running on HTTPS (Replit production environment)
        $is_https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' || 
                   isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' ||
                   isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443;
        
        $protocol = $is_https ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
        
        // Use EnvManager for consistent environment variable handling
        $config = [
            'api_base_url' => $protocol . '://' . $host . '/api',
            'frontend_url' => $protocol . '://' . $host,
            'backend_port' => EnvManager::get('BACKEND_PORT'),
            'cors_origin' => EnvManager::get('CORS_ORIGIN'),
            'cors_methods' => EnvManager::get('CORS_METHODS'),
            'cors_headers' => EnvManager::get('CORS_HEADERS'),
            'jwt_secret' => EnvManager::get('JWT_SECRET'),
            'jwt_expiry' => EnvManager::get('JWT_EXPIRY'),
            'app_env' => EnvManager::get('APP_ENV'),
            'debug' => EnvManager::get('APP_DEBUG'),
            'timezone' => EnvManager::get('TIMEZONE'),
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