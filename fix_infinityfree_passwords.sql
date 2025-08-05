-- SQL script to fix login passwords on InfinityFree
-- Run this in your InfinityFree phpMyAdmin to fix the "Login Failed" issue

-- Update all user passwords with proper PHP password_hash() format
-- This sets password to "password123" for all test users

UPDATE users SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE id IN (1, 2, 3);

-- Verify the update worked
SELECT id, username, email, reg_number, role, full_name, 
       CASE 
           WHEN password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
           THEN 'Password Updated ✓' 
           ELSE 'Password NOT Updated ✗' 
       END as password_status
FROM users 
WHERE id IN (1, 2, 3);

-- Expected results after running this:
-- Admin: admin@sfgs.edu.ng / password123
-- Teacher: teacher1@sfgs.edu.ng / password123  
-- Student: SFGS/2024/001 / password123