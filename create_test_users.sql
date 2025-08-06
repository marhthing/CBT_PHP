
-- Create test users for InfinityFree CBT Portal
-- Password for all users: password123

-- First, ensure the users table has the correct structure
ALTER TABLE users MODIFY COLUMN username VARCHAR(50) NULL;
ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NULL;
ALTER TABLE users MODIFY COLUMN reg_number VARCHAR(20) NULL;

-- Make sure class_level column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_level VARCHAR(10) NULL AFTER full_name;

-- Clear existing test users
DELETE FROM users WHERE username IN ('admin', 'teacher1') OR reg_number = 'SFGS/2024/001';

-- Insert test users (password: password123)
INSERT INTO users (username, email, reg_number, password, role, full_name, class_level, is_active, created_at) VALUES
('admin', 'admin@sfgs.edu.ng', NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator', NULL, 1, NOW()),
('teacher1', 'teacher1@sfgs.edu.ng', NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'John Teacher', NULL, 1, NOW()),
(NULL, 'student1@sfgs.edu.ng', 'SFGS/2024/001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Jane Student', 'JSS1', 1, NOW());

-- Verify users were created
SELECT id, username, email, reg_number, role, full_name, class_level, is_active,
       CASE 
           WHEN password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
           THEN 'Password: password123' 
           ELSE 'Password: DIFFERENT' 
       END as password_info
FROM users 
ORDER BY role, id;
