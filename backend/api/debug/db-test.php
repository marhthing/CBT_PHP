<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    // Get direct database connection for debugging
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Get database info
    $stmt = $pdo->query('SELECT current_database(), current_user, current_schema()');
    $db_info = $stmt->fetch();
    
    // Check if tables exist
    $stmt = $pdo->query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name');
    $tables = $stmt->fetchAll();
    
    // Try to query subjects table directly
    $subjects = [];
    $subjects_error = null;
    try {
        $stmt = $pdo->prepare("SELECT id, name, code FROM subjects LIMIT 3");
        $stmt->execute();
        $subjects = $stmt->fetchAll();
    } catch (Exception $e) {
        $subjects_error = $e->getMessage();
    }
    
    $debug_data = [
        'database_info' => $db_info,
        'tables_found' => count($tables),
        'table_names' => array_column($tables, 'table_name'),
        'subjects_query' => [
            'success' => is_null($subjects_error),
            'data' => $subjects,
            'error' => $subjects_error
        ],
        'environment' => [
            'PGHOST' => getenv('PGHOST'),
            'PGDATABASE' => getenv('PGDATABASE'),
            'PGUSER' => getenv('PGUSER'),
            'php_version' => phpversion()
        ]
    ];
    
    Response::success("Database debug info retrieved", $debug_data);
    
} catch (Exception $e) {
    Response::serverError('Debug error: ' . $e->getMessage());
}

?>