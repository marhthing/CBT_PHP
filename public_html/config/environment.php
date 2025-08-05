<?php
// Multi-platform environment configuration
// This file automatically detects hosting platform and adjusts settings

class HostingEnvironment {
    private static $detected_platform = null;
    
    public static function detectPlatform() {
        if (self::$detected_platform !== null) {
            return self::$detected_platform;
        }
        
        $server_name = $_SERVER['SERVER_NAME'] ?? '';
        $document_root = $_SERVER['DOCUMENT_ROOT'] ?? '';
        
        // InfinityFree detection
        if (strpos($server_name, 'infinityfree') !== false || 
            strpos($server_name, 'epizy.com') !== false) {
            self::$detected_platform = 'infinityfree';
        }
        // 000webhost detection
        elseif (strpos($server_name, '000webhostapp.com') !== false) {
            self::$detected_platform = '000webhost';
        }
        // Netlify detection
        elseif (strpos($server_name, 'netlify.app') !== false) {
            self::$detected_platform = 'netlify';
        }
        // Vercel detection
        elseif (strpos($server_name, 'vercel.app') !== false) {
            self::$detected_platform = 'vercel';
        }
        // Heroku detection
        elseif (isset($_ENV['DYNO'])) {
            self::$detected_platform = 'heroku';
        }
        // Render detection
        elseif (isset($_ENV['RENDER'])) {
            self::$detected_platform = 'render';
        }
        // Replit detection
        elseif (isset($_ENV['REPL_ID'])) {
            self::$detected_platform = 'replit';
        }
        // Generic shared hosting
        else {
            self::$detected_platform = 'shared';
        }
        
        return self::$detected_platform;
    }
    
    public static function getConfiguration() {
        $platform = self::detectPlatform();
        
        $config = [
            'platform' => $platform,
            'max_execution_time' => 30,
            'memory_limit' => '128M',
            'upload_max_filesize' => '2M',
            'timezone' => 'UTC',
            'ssl_required' => false,
            'db_ssl_mode' => 'prefer'
        ];
        
        // Platform-specific adjustments
        switch ($platform) {
            case 'infinityfree':
                $config['max_execution_time'] = 60;
                $config['memory_limit'] = '256M';
                $config['upload_max_filesize'] = '5M';
                $config['db_ssl_mode'] = 'disable';
                break;
                
            case '000webhost':
                $config['max_execution_time'] = 30;
                $config['memory_limit'] = '128M';
                $config['upload_max_filesize'] = '2M';
                $config['db_ssl_mode'] = 'disable';
                break;
                
            case 'heroku':
            case 'render':
                $config['ssl_required'] = true;
                $config['db_ssl_mode'] = 'require';
                $config['memory_limit'] = '512M';
                break;
                
            case 'replit':
                $config['db_ssl_mode'] = 'require';
                $config['memory_limit'] = '512M';
                break;
        }
        
        return $config;
    }
    
    public static function applyConfiguration() {
        $config = self::getConfiguration();
        
        // Apply PHP settings if possible
        if (function_exists('ini_set')) {
            @ini_set('max_execution_time', $config['max_execution_time']);
            @ini_set('memory_limit', $config['memory_limit']);
            @ini_set('upload_max_filesize', $config['upload_max_filesize']);
            @ini_set('default_charset', 'UTF-8');
        }
        
        // Set environment variables for database
        if (!isset($_ENV['DB_SSLMODE'])) {
            $_ENV['DB_SSLMODE'] = $config['db_ssl_mode'];
        }
        
        if (!isset($_ENV['TIMEZONE'])) {
            $_ENV['TIMEZONE'] = $config['timezone'];
        }
        
        return $config;
    }
}

// Auto-apply configuration
HostingEnvironment::applyConfiguration();
?>