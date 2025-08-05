<?php
// MySQL Database Configuration for InfinityFree
// This file handles MySQL connections for shared hosting

function getDatabaseConnection() {
    // InfinityFree MySQL connection parameters
    $db_host = $_ENV['DB_HOST'] ?? 'localhost';
    $db_name = $_ENV['DB_NAME'] ?? 'cbt_portal';
    $db_user = $_ENV['DB_USER'] ?? 'root';
    $db_pass = $_ENV['DB_PASS'] ?? '';
    $db_port = $_ENV['DB_PORT'] ?? '3306';
    
    try {
        $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];
        
        $pdo = new PDO($dsn, $db_user, $db_pass, $options);
        return $pdo;
        
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        throw new Exception("Database connection failed");
    }
}

function testDatabaseConnection() {
    try {
        $db = getDatabaseConnection();
        $stmt = $db->query("SELECT 1");
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