<?php

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $conn;

    public function __construct() {
        // Check if we should use MySQL (for InfinityFree) or PostgreSQL (for development)
        $use_mysql = $_ENV['DB_HOST'] ?? false;
        
        if ($use_mysql) {
            // MySQL configuration for InfinityFree
            $this->host = $_ENV['DB_HOST'] ?? 'sql200.infinityfree.com';
            $this->db_name = $_ENV['DB_NAME'] ?? '';
            $this->username = $_ENV['DB_USER'] ?? '';
            $this->password = $_ENV['DB_PASS'] ?? '';
            $this->port = $_ENV['DB_PORT'] ?? '3306';
        } else {
            // PostgreSQL configuration for development
            $this->host = getenv('PGHOST') ?: ($_ENV['PGHOST'] ?? $_ENV['DATABASE_HOST'] ?? 'localhost');
            $this->db_name = getenv('PGDATABASE') ?: ($_ENV['PGDATABASE'] ?? $_ENV['DATABASE_NAME'] ?? 'cbt_portal');
            $this->username = getenv('PGUSER') ?: ($_ENV['PGUSER'] ?? $_ENV['DATABASE_USER'] ?? 'postgres');
            $this->password = getenv('PGPASSWORD') ?: ($_ENV['PGPASSWORD'] ?? $_ENV['DATABASE_PASSWORD'] ?? '');
            $this->port = getenv('PGPORT') ?: ($_ENV['PGPORT'] ?? $_ENV['DATABASE_PORT'] ?? '5432');
        }
    }

    public function getConnection() {
        $this->conn = null;

        try {
            // Check if we should use MySQL or PostgreSQL
            $use_mysql = $_ENV['DB_HOST'] ?? false;
            
            if ($use_mysql) {
                // MySQL connection for InfinityFree
                $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
                
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT => 10,
                    PDO::ATTR_PERSISTENT => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                ];
                
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
                
                // Set timezone for MySQL
                $this->conn->exec("SET time_zone = '+00:00'");
                
            } else {
                // PostgreSQL connection for development
                $dsn = "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";sslmode=require";
                
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_TIMEOUT => 10,
                    PDO::ATTR_PERSISTENT => false
                ];
                
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
                
                // Set timezone for PostgreSQL
                $timezone = $_ENV['TIMEZONE'] ?? 'UTC';
                $this->conn->exec("SET timezone = '$timezone'");
            }
            
        } catch(PDOException $exception) {
            throw new Exception("Database connection failed: " . $exception->getMessage());
        }

        return $this->conn;
    }

    public function closeConnection() {
        $this->conn = null;
    }

    // Transaction helpers
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }

    public function commit() {
        return $this->conn->commit();
    }

    public function rollback() {
        return $this->conn->rollback();
    }

    // Prepared statement helpers
    public function prepare($sql) {
        return $this->conn->prepare($sql);
    }

    public function lastInsertId() {
        return $this->conn->lastInsertId();
    }

    // Health check
    public function isConnected() {
        try {
            if (!$this->conn) {
                return false;
            }
            $result = $this->conn->query('SELECT 1')->fetchColumn();
            return $result === '1' || $result === 1;
        } catch (Exception $e) {
            return false;
        }
    }
}

// Test database connection function
function testDatabaseConnection() {
    try {
        $database = new Database();
        $conn = $database->getConnection();
        
        if ($database->isConnected()) {
            return [
                'success' => true,
                'message' => 'Database connection successful'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Database connection failed'
            ];
        }
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Database connection error: ' . $e->getMessage()
        ];
    }
}

?>
