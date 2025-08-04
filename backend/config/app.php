<?php

// Application Configuration
class AppConfig {
    public static function get($key, $default = null) {
        // Use EnvManager for consistent environment variable handling
        $config = [
            'api_base_url' => EnvManager::get('API_BASE_URL') . '/api',
            'frontend_url' => EnvManager::get('FRONTEND_URL'),
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