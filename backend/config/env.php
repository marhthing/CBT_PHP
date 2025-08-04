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
            'API_BASE_URL' => 'https://your-domain.infinityfreeapp.com',
            'FRONTEND_URL' => 'https://your-domain.infinityfreeapp.com', 
            'BACKEND_PORT' => '80',
            'CORS_ORIGIN' => 'https://your-domain.infinityfreeapp.com',
            'CORS_METHODS' => 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
            'CORS_HEADERS' => 'Content-Type,Authorization,X-Requested-With',
            'JWT_SECRET' => 'your-unique-jwt-secret-key-here-change-this',
            'JWT_EXPIRY' => '86400',
            'APP_ENV' => 'production',
            'APP_DEBUG' => 'false',
            'TIMEZONE' => 'UTC',
            // MySQL Database Configuration for InfinityFree
            'DB_HOST' => 'sql200.infinityfree.com',
            'DB_PORT' => '3306',
            'DB_NAME' => '',  // Set your database name
            'DB_USER' => '',  // Set your database username  
            'DB_PASS' => ''   // Set your database password
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