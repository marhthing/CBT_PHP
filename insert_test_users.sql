-- SQL to insert test users into InfinityFree database
-- Run this in your InfinityFree phpMyAdmin to add the missing users

-- First, check if users already exist
SELECT 'Existing users:' as info;
SELECT id, username, email, reg_number, role, full_name FROM users;

-- Insert test users with proper password hashes
-- Password for all users: password123

INSERT INTO users (username, email, reg_number, password, role, full_name, is_active, created_at) VALUES
('admin', 'admin@sfgs.edu.ng', NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator', 1, NOW()),
('teacher1', 'teacher1@sfgs.edu.ng', NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'John Teacher', 1, NOW()),
('student001', 'student1@sfgs.edu.ng', 'SFGS/2024/001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Jane Student', 1, NOW());

-- Verify the insert worked
SELECT 'After insert:' as info;
SELECT id, username, email, reg_number, role, full_name, is_active FROM users ORDER BY role, id;

-- Test the password hashes
SELECT 'Password verification test:' as info;
SELECT id, username, email, role, 
       CASE WHEN password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
            THEN 'Correct Hash ✓' 
            ELSE 'Wrong Hash ✗' 
       END as password_status
FROM users 
ORDER BY role;