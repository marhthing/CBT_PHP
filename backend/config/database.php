<?php

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $conn;

    public function __construct() {
        // Use environment variables with fallbacks
        $this->host = getenv('PGHOST') ?: ($_ENV['PGHOST'] ?? $_ENV['DATABASE_HOST'] ?? 'localhost');
        $this->db_name = getenv('PGDATABASE') ?: ($_ENV['PGDATABASE'] ?? $_ENV['DATABASE_NAME'] ?? 'cbt_portal');
        $this->username = getenv('PGUSER') ?: ($_ENV['PGUSER'] ?? $_ENV['DATABASE_USER'] ?? 'postgres');
        $this->password = getenv('PGPASSWORD') ?: ($_ENV['PGPASSWORD'] ?? $_ENV['DATABASE_PASSWORD'] ?? '');
        $this->port = getenv('PGPORT') ?: ($_ENV['PGPORT'] ?? $_ENV['DATABASE_PORT'] ?? '5432');
    }

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name;
            
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Set timezone
            $timezone = $_ENV['TIMEZONE'] ?? 'UTC';
            $this->conn->exec("SET timezone = '$timezone'");
            
        } catch(PDOException $exception) {
            error_log("Database connection error: " . $exception->getMessage());
            error_log("DSN used: $dsn");
            error_log("Username: $this->username");
            error_log("Host: $this->host, Port: $this->port, DB: $this->db_name");
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
            error_log("Database health check error: " . $e->getMessage());
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
