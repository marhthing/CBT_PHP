<?php
require_once __DIR__ . '/database_config.php';

class Database {
    private $config;
    private $connection;
    private static $instance = null;
    private $queryCache = [];
    private $maxCacheSize = 100;

    // Singleton pattern for better connection management
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        $this->config = DatabaseConfig::getConfig();
    }

    public function connect() {
        try {
            $dsn = DatabaseConfig::getDSN($this->config);
            $options = DatabaseConfig::getPDOOptions($this->config);

            $this->connection = new PDO($dsn, $this->config['username'], $this->config['password'], $options);

            // Set database timezone to match PHP timezone
            if ($this->config['scheme'] === 'mysql') {
                $this->connection->exec("SET time_zone = '" . date('P') . "'");
            } else {
                $this->connection->exec("SET timezone = '" . date_default_timezone_get() . "'");
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
        if ($this->config['scheme'] === 'mysql') {
            // Convert PostgreSQL syntax to MySQL
            $query = str_replace('SERIAL PRIMARY KEY', 'AUTO_INCREMENT PRIMARY KEY', $query);
            $query = str_replace('BOOLEAN', 'TINYINT(1)', $query);
            $query = str_replace('TEXT', 'LONGTEXT', $query);
            $query = str_replace('INET', 'VARCHAR(45)', $query);
            $query = preg_replace('/GENERATED ALWAYS AS \((.*?)\) STORED/', 'AS ($1) STORED', $query);
        }
        return $query;
    }
    
    public function getDbType() {
        return $this->config['scheme'];
    }
    
    public function getDbConfig() {
        return $this->config;
    }

    public function execute($query, $params = []) {
        try {
            if (!$this->connection) {
                $this->connect();
            }

            // Prepare statement caching
            $cacheKey = md5($query);
            static $stmtCache = [];
            
            if (!isset($stmtCache[$cacheKey])) {
                $stmtCache[$cacheKey] = $this->getConnection()->prepare($query);
                
                // Limit cache size
                if (count($stmtCache) > 50) {
                    array_shift($stmtCache);
                }
            }

            $stmt = $stmtCache[$cacheKey];
            $result = $stmt->execute($params);

            if (!$result) {
                $errorInfo = $stmt->errorInfo();
                error_log("SQL Error: " . print_r($errorInfo, true));
                throw new Exception("SQL execution failed: " . $errorInfo[2]);
            }

            return $stmt;
        } catch (PDOException $e) {
            error_log("Database execute error: " . $e->getMessage());
            error_log("Query was: " . $query);
            error_log("Params were: " . print_r($params, true));
            throw $e;
        }
    }

    public function fetchAll($query, $params = [], $useCache = false) {
        $cacheKey = $useCache ? md5($query . serialize($params)) : null;
        
        if ($useCache && isset($this->queryCache[$cacheKey])) {
            return $this->queryCache[$cacheKey];
        }

        try {
            if (!$this->connection) {
                $this->connect();
            }

            $stmt = $this->getConnection()->prepare($query);
            $stmt->execute($params);
            $result = $stmt->fetchAll();

            if ($useCache) {
                // Manage cache size
                if (count($this->queryCache) >= $this->maxCacheSize) {
                    array_shift($this->queryCache);
                }
                $this->queryCache[$cacheKey] = $result;
            }

            return $result;
        } catch (PDOException $e) {
            error_log("Database fetchAll error: " . $e->getMessage());
            throw $e;
        }
    }

    public function fetch($query, $params = [], $useCache = false) {
        $cacheKey = $useCache ? md5($query . serialize($params)) : null;
        
        if ($useCache && isset($this->queryCache[$cacheKey])) {
            return $this->queryCache[$cacheKey];
        }

        try {
            if (!$this->connection) {
                $this->connect();
            }

            $stmt = $this->getConnection()->prepare($query);
            $stmt->execute($params);
            $result = $stmt->fetch();

            if ($useCache) {
                // Manage cache size
                if (count($this->queryCache) >= $this->maxCacheSize) {
                    array_shift($this->queryCache);
                }
                $this->queryCache[$cacheKey] = $result;
            }

            return $result;
        } catch (PDOException $e) {
            error_log("Database fetch error: " . $e->getMessage());
            throw $e;
        }
    }

    public function clearCache() {
        $this->queryCache = [];
    }

    public function lastInsertId() {
        return $this->getConnection()->lastInsertId();
    }
}

// Global database instance
$db = new Database();
?>