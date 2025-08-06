<?php
// Main Database Configuration for InfinityFree
// This is the ONLY database config file you need to edit

// Load environment variables if .env file exists
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Database Configuration for InfinityFree
// EDIT THESE VALUES WITH YOUR INFINITYFREE DATABASE DETAILS:
$db_config = [
    'host' => $_ENV['DB_HOST'] ?? 'sql208.infinityfree.com',          // Your InfinityFree MySQL server
    'database' => $_ENV['DB_NAME'] ?? 'if0_37796751_cbt_portal',       // Your database name (replace with yours)
    'username' => $_ENV['DB_USER'] ?? 'if0_37796751',                  // Your database username (replace with yours)
    'password' => $_ENV['DB_PASS'] ?? '',                             // Your database password
    'port' => $_ENV['DB_PORT'] ?? 3306,
    'charset' => 'utf8mb4'
];

function getDatabaseConnection() {
    global $db_config;
    
    try {
        $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['database']};charset={$db_config['charset']}";
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$db_config['charset']}"
        ];
        
        $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], $options);
        return $pdo;
        
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        throw new Exception("Database connection failed");
    }
}

function testDatabaseConnection() {
    try {
        $db = getDatabaseConnection();
        $stmt = $db->query("SELECT 1 as test");
        $result = $stmt->fetch();
        return ['success' => true, 'message' => 'Database connected successfully'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Helper function to execute queries safely
function executeQuery($query, $params = []) {
    try {
        $db = getDatabaseConnection();
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        return $stmt;
    } catch (Exception $e) {
        error_log("Query execution failed: " . $e->getMessage());
        throw $e;
    }
}

// Helper function to fetch single row
function fetchRow($query, $params = []) {
    $stmt = executeQuery($query, $params);
    return $stmt->fetch();
}

// Helper function to fetch all rows
function fetchAll($query, $params = []) {
    $stmt = executeQuery($query, $params);
    return $stmt->fetchAll();
}

// Helper function to get last insert ID
function getLastInsertId() {
    $db = getDatabaseConnection();
    return $db->lastInsertId();
}

?>