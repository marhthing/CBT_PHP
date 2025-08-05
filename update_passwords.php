<?php
// Script to update passwords in the database with proper hashing
// Run this once to fix the password hashing issue

require_once 'public_html/config/database.php';

try {
    $db = getDatabaseConnection();
    
    // Default password for all test users
    $default_password = 'password123';
    $hashed_password = password_hash($default_password, PASSWORD_DEFAULT);
    
    // Update all users with the properly hashed password
    $stmt = $db->prepare("UPDATE users SET password = ? WHERE id IN (1, 2, 3)");
    $result = $stmt->execute([$hashed_password]);
    
    if ($result) {
        echo "✅ Passwords updated successfully!\n";
        echo "Login credentials:\n";
        echo "- Admin: admin@sfgs.edu.ng / password123\n";
        echo "- Teacher: teacher1@sfgs.edu.ng / password123\n"; 
        echo "- Student: SFGS/2024/001 / password123\n";
    } else {
        echo "❌ Failed to update passwords\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>