
<?php
/**
 * Flexible Database Configuration Manager
 * Supports PostgreSQL (Replit, Neon, Custom) and MySQL
 */
class DatabaseConfig {
    private static $config = null;
    
    public static function getConfig() {
        if (self::$config === null) {
            self::$config = self::loadConfiguration();
        }
        return self::$config;
    }
    
    private static function loadConfiguration() {
        // Check for environment variables in order of preference
        $configs = [
            'custom_neon' => getenv('CUSTOM_NEON_DATABASE_URL'),
            'custom_postgres' => getenv('CUSTOM_POSTGRES_DATABASE_URL'),
            'mysql' => getenv('MYSQL_DATABASE_URL'),
            'replit_postgres' => getenv('DATABASE_URL')
        ];
        
        foreach ($configs as $type => $url) {
            if (!empty($url)) {
                return self::parseConfiguration($url, $type);
            }
        }
        
        // Fallback to default configuration
        throw new Exception('No database configuration found. Please set environment variables.');
    }
    
    private static function parseConfiguration($url, $type) {
        $parsed = parse_url($url);
        
        $config = [
            'type' => $type,
            'host' => $parsed['host'],
            'database' => ltrim($parsed['path'], '/'),
            'username' => $parsed['user'],
            'password' => $parsed['pass'],
            'port' => $parsed['port'] ?? (strpos($url, 'mysql://') === 0 ? 3306 : 5432),
            'scheme' => $parsed['scheme'],
            'options' => []
        ];
        
        // Type-specific configurations
        switch ($type) {
            case 'custom_neon':
                $config['pooled_host'] = str_replace('.neon.tech/', '-pooler.neon.tech/', $config['host']);
                $config['options'] = [
                    'sslmode' => 'require',
                    'connection_pooling' => true
                ];
                break;
                
            case 'custom_postgres':
                $config['options'] = [
                    'sslmode' => 'prefer',
                    'connection_pooling' => false
                ];
                break;
                
            case 'mysql':
                $config['options'] = [
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci'
                ];
                break;
                
            case 'replit_postgres':
                $config['options'] = [
                    'sslmode' => 'require',
                    'connection_pooling' => false
                ];
                break;
        }
        
        return $config;
    }
    
    public static function getDSN($config) {
        if ($config['scheme'] === 'mysql') {
            return sprintf(
                "mysql:host=%s;port=%d;dbname=%s;charset=%s",
                $config['host'],
                $config['port'],
                $config['database'],
                $config['options']['charset'] ?? 'utf8mb4'
            );
        } else {
            $host = isset($config['pooled_host']) && $config['options']['connection_pooling'] 
                ? $config['pooled_host'] 
                : $config['host'];
                
            return sprintf(
                "pgsql:host=%s;port=%d;dbname=%s",
                $host,
                $config['port'],
                $config['database']
            );
        }
    }
    
    public static function getPDOOptions($config) {
        $baseOptions = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_PERSISTENT => true,
            PDO::ATTR_TIMEOUT => 30,
        ];
        
        if ($config['scheme'] === 'mysql') {
            $baseOptions[PDO::MYSQL_ATTR_USE_BUFFERED_QUERY] = true;
            $baseOptions[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci";
        }
        
        return $baseOptions;
    }
}
?>
