<?php
class Database {
    private $host;
    private $database;
    private $username;
    private $password;
    private $port;
    private $connection;
    private $dbType;

    public function __construct() {
        // Use environment variables with fallback to provided PostgreSQL URL
        $database_url = getenv('DATABASE_URL') ?: 'postgresql://neondb_owner:npg_f4OcurU1CTks@ep-small-pine-adf9atw2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

        // Parse the database URL
        $url = parse_url($database_url);

        $this->host = $url['host'];
        $this->database = ltrim($url['path'], '/');
        $this->username = $url['user'];
        $this->password = $url['pass'];
        $this->port = isset($url['port']) ? $url['port'] : 5432;

        // Determine database type from scheme
        $this->dbType = $url['scheme'] === 'mysql' ? 'mysql' : 'pgsql';
    }

    public function connect() {
        try {
            if ($this->dbType === 'mysql') {
                $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->database};charset=utf8mb4";
            } else {
                $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->database}";
            }

            $this->connection = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);

            // Set database timezone to match PHP timezone
            if ($this->dbType === 'pgsql') {
                $this->connection->exec("SET timezone = '" . date_default_timezone_get() . "'");
            } else {
                $this->connection->exec("SET time_zone = '" . date('P') . "'");
            }

            return $this->connection;
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }

    public function getConnection() {
        if (!$this->connection) {
            $this->connect();
        }
        return $this->connection;
    }

    // Database-specific query adaptations
    public function adaptQuery($query) {
        if ($this->dbType === 'mysql') {
            // Convert PostgreSQL syntax to MySQL
            $query = str_replace('SERIAL PRIMARY KEY', 'AUTO_INCREMENT PRIMARY KEY', $query);
            $query = str_replace('BOOLEAN', 'TINYINT(1)', $query);
            $query = str_replace('TEXT', 'LONGTEXT', $query);
            $query = str_replace('TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', $query);
        }
        return $query;
    }

    public function execute($query, $params = []) {
        try {
            if (!$this->connection) {
                $this->connect();
            }

            error_log("Executing query: " . $query);
            error_log("With params: " . print_r($params, true));

            $stmt = $this->getConnection()->prepare($query);
            $result = $stmt->execute($params);

            if (!$result) {
                $errorInfo = $stmt->errorInfo();
                error_log("SQL Error: " . print_r($errorInfo, true));
                throw new Exception("SQL execution failed: " . $errorInfo[2]);
            }

            error_log("Query executed successfully");
            return $stmt;
        } catch (PDOException $e) {
            error_log("Database execute error: " . $e->getMessage());
            error_log("Query was: " . $query);
            error_log("Params were: " . print_r($params, true));
            throw $e;
        }
    }

    public function fetchAll($query, $params = []) {
        try {
            if (!$this->connection) {
                $this->connect();
            }

            $stmt = $this->getConnection()->prepare($query);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Database fetchAll error: " . $e->getMessage());
            throw $e;
        }
    }

    public function fetch($query, $params = []) {
        try {
            if (!$this->connection) {
                $this->connect();
            }

            $stmt = $this->getConnection()->prepare($query);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Database fetch error: " . $e->getMessage());
            throw $e;
        }
    }

    public function lastInsertId() {
        return $this->getConnection()->lastInsertId();
    }
}

// Global database instance
$db = new Database();
?>