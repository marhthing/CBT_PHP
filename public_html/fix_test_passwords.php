
<?php
require_once __DIR__ . '/config/database.php';

header('Content-Type: text/html; charset=UTF-8');

echo "<h2>🔧 Password Fix Tool</h2>";

try {
    $conn = getDatabaseConnection();
    
    // The correct password hash for "password123"
    $correct_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    // Test users to fix
    $test_users = [
        ['email' => 'admin@sfgs.edu.ng', 'role' => 'admin'],
        ['email' => 'teacher1@sfgs.edu.ng', 'role' => 'teacher'],
        ['reg_number' => 'SFGS/2024/001', 'role' => 'student']
    ];
    
    echo "<h3>Before Fix - Testing Passwords:</h3>";
    
    foreach ($test_users as $user) {
        if (isset($user['email'])) {
            $stmt = $conn->prepare("SELECT id, username, email, password FROM users WHERE email = ? AND role = ?");
            $stmt->execute([$user['email'], $user['role']]);
            $identifier = $user['email'];
        } else {
            $stmt = $conn->prepare("SELECT id, username, reg_number, password FROM users WHERE reg_number = ? AND role = ?");
            $stmt->execute([$user['reg_number'], $user['role']]);
            $identifier = $user['reg_number'];
        }
        
        $db_user = $stmt->fetch();
        if ($db_user) {
            $password_works = password_verify('password123', $db_user['password']);
            echo "<p><strong>{$user['role']}:</strong> {$identifier} - Password works: " . ($password_works ? "✅ YES" : "❌ NO") . "</p>";
        } else {
            echo "<p><strong>{$user['role']}:</strong> {$identifier} - ❌ USER NOT FOUND</p>";
        }
    }
    
    // Fix passwords
    echo "<h3>Fixing Passwords...</h3>";
    
    $update_stmt = $conn->prepare("UPDATE users SET password = ? WHERE (email = ? OR reg_number = ?) AND role = ?");
    
    foreach ($test_users as $user) {
        $email = $user['email'] ?? null;
        $reg_number = $user['reg_number'] ?? null;
        $identifier = $email ?? $reg_number;
        
        $success = $update_stmt->execute([$correct_hash, $email, $reg_number, $user['role']]);
        
        if ($success) {
            echo "<p>✅ Updated password for {$user['role']}: {$identifier}</p>";
        } else {
            echo "<p>❌ Failed to update password for {$user['role']}: {$identifier}</p>";
        }
    }
    
    echo "<h3>After Fix - Testing Passwords:</h3>";
    
    foreach ($test_users as $user) {
        if (isset($user['email'])) {
            $stmt = $conn->prepare("SELECT id, username, email, password FROM users WHERE email = ? AND role = ?");
            $stmt->execute([$user['email'], $user['role']]);
            $identifier = $user['email'];
        } else {
            $stmt = $conn->prepare("SELECT id, username, reg_number, password FROM users WHERE reg_number = ? AND role = ?");
            $stmt->execute([$user['reg_number'], $user['role']]);
            $identifier = $user['reg_number'];
        }
        
        $db_user = $stmt->fetch();
        if ($db_user) {
            $password_works = password_verify('password123', $db_user['password']);
            echo "<p><strong>{$user['role']}:</strong> {$identifier} - Password works: " . ($password_works ? "✅ YES" : "❌ NO") . "</p>";
        }
    }
    
    echo "<br><p><strong>🎉 Password fix complete!</strong></p>";
    echo "<p>Now test login with:</p>";
    echo "<ul>";
    echo "<li><strong>Admin:</strong> admin@sfgs.edu.ng / password123</li>";
    echo "<li><strong>Teacher:</strong> teacher1@sfgs.edu.ng / password123</li>";
    echo "<li><strong>Student:</strong> SFGS/2024/001 / password123</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'><strong>Error:</strong> " . $e->getMessage() . "</p>";
}
?>
