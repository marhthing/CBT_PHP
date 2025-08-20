<?php

// Load environment variables for testing
$system_env_vars = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGPORT', 'DATABASE_URL'];
foreach ($system_env_vars as $var) {
    if (getenv($var) !== false) {
        $_ENV[$var] = getenv($var);
    }
}

echo "Environment variables loaded:\n";
echo "PGHOST: " . (getenv('PGHOST') ?: 'not set') . "\n";
echo "PGDATABASE: " . (getenv('PGDATABASE') ?: 'not set') . "\n";
echo "PGUSER: " . (getenv('PGUSER') ?: 'not set') . "\n";
echo "PGPORT: " . (getenv('PGPORT') ?: 'not set') . "\n";

require_once __DIR__ . '/config/database.php';

try {
    echo "\nTesting database class...\n";
    $database = new Database();
    echo "Database object created\n";
    
    $conn = $database->getConnection();
    echo "Connection method called\n";
    
    if ($conn) {
        echo "✅ PDO connection object obtained!\n";
        
        // Test a simple query
        $result = $conn->query('SELECT 1 as test')->fetchColumn();
        echo "Simple query result: " . var_export($result, true) . "\n";
        
        // Test the isConnected method
        $isConnected = $database->isConnected();
        echo "isConnected method result: " . var_export($isConnected, true) . "\n";
        
        if ($result === '1' || $result === 1) {
            echo "✅ Database query test successful!\n";
            
            // Test users table
            $result = $conn->query('SELECT COUNT(*) as user_count FROM users')->fetch();
            echo "Users in database: " . $result['user_count'] . "\n";
        }
    } else {
        echo "❌ No connection object returned\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>