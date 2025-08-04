<?php

// Environment Configuration Management
// This file handles environment variables since .env files are restricted for security

class EnvManager {
    private static $config = null;
    
    public static function init() {
        if (self::$config !== null) {
            return;
        }
        
        // Set default environment variables if not already set
        $defaults = [
            'API_BASE_URL' => 'http://localhost:8000',
            'FRONTEND_URL' => 'http://localhost:8000', 
            'BACKEND_PORT' => '8000',
            'CORS_ORIGIN' => '*',
            'CORS_METHODS' => 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
            'CORS_HEADERS' => 'Content-Type,Authorization,X-Requested-With',
            'JWT_SECRET' => 'cbt-portal-secret-key-2025',
            'JWT_EXPIRY' => '86400',
            'APP_ENV' => 'production',
            'APP_DEBUG' => 'false',
            'TIMEZONE' => 'UTC'
        ];
        
        foreach ($defaults as $key => $value) {
            if (!getenv($key) && !isset($_ENV[$key])) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
        
        self::$config = $_ENV;
    }
    
    public static function get($key, $default = null) {
        self::init();
        return $_ENV[$key] ?? $default;
    }
    
    public static function set($key, $value) {
        self::init();
        $_ENV[$key] = $value;
        putenv("$key=$value");
    }
    
    public static function all() {
        self::init();
        return $_ENV;
    }
    
    public static function isDevelopment() {
        return self::get('APP_ENV') === 'development';
    }
    
    public static function isProduction() {
        return self::get('APP_ENV') === 'production';
    }
    
    public static function isDebug() {
        return self::get('APP_DEBUG') === 'true';
    }
}

// Initialize environment
EnvManager::init();

?>