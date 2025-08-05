<?php
// Check what users exist in the InfinityFree database
header('Content-Type: text/html; charset=utf-8');

try {
    require_once __DIR__ . '/config/database.php';
    $conn = getDatabaseConnection();
    
    echo "<h1>Database Users Check</h1>";
    echo "<style>body{font-family:Arial;margin:40px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f2f2f2;}</style>";
    
    // Check if users table exists
    $stmt = $conn->prepare("SHOW TABLES LIKE 'users'");
    $stmt->execute();
    $table_exists = $stmt->fetch();
    
    if (!$table_exists) {
        echo "<p style='color:red;'><strong>ERROR:</strong> Users table does not exist!</p>";
        echo "<p>You need to import the schema first. Run this in phpMyAdmin:</p>";
        echo "<pre>CREATE TABLE users (...);</pre>";
        exit;
    }
    
    echo "<h2>✅ Users Table Exists</h2>";
    
    // Check users table structure
    echo "<h3>Table Structure:</h3>";
    $stmt = $conn->prepare("DESCRIBE users");
    $stmt->execute();
    $columns = $stmt->fetchAll();
    
    echo "<table>";
    echo "<tr><th>Column</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    foreach ($columns as $col) {
        echo "<tr>";
        echo "<td>{$col['Field']}</td>";
        echo "<td>{$col['Type']}</td>";
        echo "<td>{$col['Null']}</td>";
        echo "<td>{$col['Key']}</td>";
        echo "<td>{$col['Default']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Check all users
    echo "<h3>All Users in Database:</h3>";
    $stmt = $conn->prepare("SELECT id, username, email, reg_number, role, full_name, is_active FROM users ORDER BY role, id");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    if (empty($users)) {
        echo "<p style='color:red;'><strong>ERROR:</strong> No users found in database!</p>";
        echo "<p>You need to insert test users. Run this SQL in phpMyAdmin:</p>";
        echo "<pre>INSERT INTO users (username, email, reg_number, password, role, full_name, is_active) VALUES
('admin', 'admin@sfgs.edu.ng', NULL, '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator', 1),
('teacher1', 'teacher1@sfgs.edu.ng', NULL, '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'John Teacher', 1),
('student001', 'student1@sfgs.edu.ng', 'SFGS/2024/001', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Jane Student', 1);</pre>";
    } else {
        echo "<table>";
        echo "<tr><th>ID</th><th>Username</th><th>Email</th><th>Reg Number</th><th>Role</th><th>Full Name</th><th>Active</th></tr>";
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['username']}</td>";
            echo "<td>{$user['email']}</td>";
            echo "<td>{$user['reg_number']}</td>";
            echo "<td>{$user['role']}</td>";
            echo "<td>{$user['full_name']}</td>";
            echo "<td>" . ($user['is_active'] ? 'Yes' : 'No') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<h3>Test Login Identifiers:</h3>";
        echo "<ul>";
        foreach ($users as $user) {
            if ($user['role'] === 'admin' || $user['role'] === 'teacher') {
                echo "<li><strong>{$user['role']}:</strong> {$user['email']} (password123)</li>";
            } else {
                echo "<li><strong>{$user['role']}:</strong> {$user['reg_number']} (password123)</li>";
            }
        }
        echo "</ul>";
    }
    
    // Check total count
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM users");
    $stmt->execute();
    $count = $stmt->fetch();
    echo "<p><strong>Total Users:</strong> {$count['total']}</p>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'><strong>Database Error:</strong> " . $e->getMessage() . "</p>";
    echo "<p><strong>File:</strong> " . $e->getFile() . "</p>";
    echo "<p><strong>Line:</strong> " . $e->getLine() . "</p>";
}
?>