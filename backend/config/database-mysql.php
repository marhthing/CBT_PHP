<?php

class Database {
    private static $connection = null;
    
    public static function getConnection() {
        if (self::$connection === null) {
            try {
                // Get database configuration from environment or InfinityFree config
                $database_url = $_ENV['DATABASE_URL'] ?? '';
                
                if (!empty($database_url)) {
                    // Parse DATABASE_URL if provided (for flexibility)
                    $url = parse_url($database_url);
                    $host = $url['host'] ?? 'localhost';
                    $port = $url['port'] ?? 3306;
                    $dbname = ltrim($url['path'] ?? '', '/');
                    $username = $url['user'] ?? '';
                    $password = $url['pass'] ?? '';
                } else {
                    // InfinityFree MySQL Configuration
                    $host = $_ENV['DB_HOST'] ?? 'sql200.infinityfree.com';
                    $port = $_ENV['DB_PORT'] ?? 3306;
                    $dbname = $_ENV['DB_NAME'] ?? 'if0_37849913_cbt_portal';
                    $username = $_ENV['DB_USER'] ?? 'if0_37849913';
                    $password = $_ENV['DB_PASS'] ?? '';
                }
                
                if (empty($dbname) || empty($username)) {
                    throw new Exception('Database configuration is incomplete. Please set DB_NAME, DB_USER, and DB_PASS.');
                }
                
                // Create MySQL DSN
                $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
                
                // Create PDO connection with MySQL-specific options
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_STRINGIFY_FETCHES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
                    PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
                ];
                
                self::$connection = new PDO($dsn, $username, $password, $options);
                
                // Set timezone to UTC
                self::$connection->exec("SET time_zone = '+00:00'");
                
            } catch (Exception $e) {
                throw new Exception('Database connection failed: ' . $e->getMessage());
            }
        }
        
        return self::$connection;
    }
    
    public static function testConnection() {
        try {
            $pdo = self::getConnection();
            $stmt = $pdo->query('SELECT 1');
            return $stmt !== false;
        } catch (Exception $e) {
            return false;
        }
    }
    
    public static function closeConnection() {
        self::$connection = null;
    }
    
    // Helper method to convert PostgreSQL queries to MySQL
    public static function convertQuery($query) {
        // Convert common PostgreSQL syntax to MySQL
        $query = str_replace('RETURNING id', '', $query);
        $query = str_replace('NOW()', 'CURRENT_TIMESTAMP', $query);
        $query = str_replace('ILIKE', 'LIKE', $query);
        $query = str_replace('::text', '', $query);
        $query = str_replace('::varchar', '', $query);
        
        return $query;
    }
}

?>