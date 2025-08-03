<?php
// Update user passwords with proper PHP password_hash()
require_once 'config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Users to update with proper password hashes
    $users = [
        ['id' => 1, 'password' => 'password123'], // admin
        ['id' => 2, 'password' => 'password123'], // teacher1  
        ['id' => 3, 'password' => 'password123']  // student (2023001)
    ];
    
    foreach ($users as $user) {
        $hashed = password_hash($user['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$hashed, $user['id']]);
        echo "Updated password for user ID: {$user['id']}\n";
        echo "New hash: {$hashed}\n\n";
    }
    
    echo "All passwords updated successfully!\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>