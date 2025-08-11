<?php

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $conn;
    private $db_type;
    private $options;

    public function __construct() {
        // Determine database type: check for MySQL config first, then fallback to PostgreSQL
        if (file_exists(__DIR__ . '/db.php')) {
            $this->setupMySQLConfig();
        } else {
            $this->setupPostgreSQLConfig();
        }
    }

    private function setupMySQLConfig() {
        $config = require __DIR__ . '/db.php';
        $this->host = $config['host'];
        $this->db_name = $config['database'];
        $this->username = $config['username'];
        $this->password = $config['password'];
        $this->port = $config['port'];
        $this->db_type = 'mysql';
        $this->options = $config['options'];
    }

    private function setupPostgreSQLConfig() {
        // Use environment variables with fallbacks for PostgreSQL
        $this->host = getenv('PGHOST') ?: ($_ENV['PGHOST'] ?? $_ENV['DATABASE_HOST'] ?? 'localhost');
        $this->db_name = getenv('PGDATABASE') ?: ($_ENV['PGDATABASE'] ?? $_ENV['DATABASE_NAME'] ?? 'cbt_portal');
        $this->username = getenv('PGUSER') ?: ($_ENV['PGUSER'] ?? $_ENV['DATABASE_USER'] ?? 'postgres');
        $this->password = getenv('PGPASSWORD') ?: ($_ENV['PGPASSWORD'] ?? $_ENV['DATABASE_PASSWORD'] ?? '');
        $this->port = getenv('PGPORT') ?: ($_ENV['PGPORT'] ?? $_ENV['DATABASE_PORT'] ?? '5432');
        $this->db_type = 'postgresql';
        $this->options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 10,
            PDO::ATTR_PERSISTENT => false
        ];
    }

    public function getConnection() {
        $this->conn = null;

        try {
            if ($this->db_type === 'mysql') {
                $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            } else {
                // PostgreSQL with flexible SSL mode for different hosting platforms
                $sslmode = $_ENV['DB_SSLMODE'] ?? 'prefer'; // prefer, require, disable
                $dsn = "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";sslmode=" . $sslmode;
            }
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $this->options);
            
            // Set timezone based on database type
            $timezone = $_ENV['TIMEZONE'] ?? 'UTC';
            try {
                if ($this->db_type === 'mysql') {
                    $this->conn->exec("SET time_zone = '$timezone'");
                } else {
                    $this->conn->exec("SET timezone = '$timezone'");
                }
            } catch (PDOException $tz_exception) {
                // Timezone setting failed - continue without it (some hosting platforms restrict this)
                error_log("Warning: Could not set timezone: " . $tz_exception->getMessage());
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

    // Get database type
    public function getDatabaseType() {
        return $this->db_type;
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

    // Get current timestamp in database format
    public function getCurrentTimestamp() {
        if ($this->db_type === 'mysql') {
            return 'NOW()';
        } else {
            return 'NOW()';
        }
    }

    // Get LIMIT syntax for different databases
    public function limitQuery($query, $limit, $offset = 0) {
        if ($this->db_type === 'mysql') {
            return $query . " LIMIT $offset, $limit";
        } else {
            return $query . " LIMIT $limit OFFSET $offset";
        }
    }
    
    // Get case-insensitive LIKE operator for different databases
    public function getCaseInsensitiveLike() {
        if ($this->db_type === 'mysql') {
            return 'LIKE';  // MySQL is case-insensitive by default
        } else {
            return 'ILIKE'; // PostgreSQL case-insensitive
        }
    }
    
    // Get type casting syntax for different databases
    public function castAsDecimal($column) {
        if ($this->db_type === 'mysql') {
            return "CAST($column AS DECIMAL)";
        } else {
            return "$column::decimal";
        }
    }
    
    // Get date/interval functions for different databases
    public function dateSubDays($days) {
        if ($this->db_type === 'mysql') {
            return "DATE_SUB(NOW(), INTERVAL $days DAY)";
        } else {
            return "NOW() - INTERVAL '$days days'";
        }
    }
    
    public function getCurrentDate() {
        if ($this->db_type === 'mysql') {
            return 'CURDATE()';
        } else {
            return 'CURRENT_DATE';
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
                'message' => 'Database connection successful',
                'database_type' => $database->getDatabaseType(),
                'timestamp' => date('Y-m-d H:i:s')
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Database connection failed',
                'database_type' => $database->getDatabaseType()
            ];
        }
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'Database connection error: ' . $e->getMessage(),
            'database_type' => 'unknown'
        ];
    }
}

?>
