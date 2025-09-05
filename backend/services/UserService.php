<?php

require_once __DIR__ . '/BaseService.php';

/**
 * User Service
 * Manages user-related operations including teachers
 */
class UserService extends BaseService {
    private static $instance = null;
    private $cache = [];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get all teachers with their statistics
     */
    public function getAllTeachers() {
        if (!isset($this->cache['all_teachers'])) {
            $sql = "
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.full_name,
                    u.created_at,
                    u.last_login,
                    COUNT(DISTINCT ta.id) as assignment_count,
                    COUNT(DISTINCT q.id) as question_count
                FROM users u
                LEFT JOIN teacher_assignments ta ON u.id = ta.teacher_id
                LEFT JOIN questions q ON u.id = q.teacher_id
                WHERE u.role = 'teacher' AND u.is_active = true
                GROUP BY u.id, u.username, u.email, u.full_name, u.created_at, u.last_login
                ORDER BY u.created_at DESC
            ";
            
            $stmt = $this->executeQuery($sql);
            $this->cache['all_teachers'] = $stmt ? $stmt->fetchAll() : [];
        }
        return $this->cache['all_teachers'];
    }
    
    /**
     * Get teacher by ID
     */
    public function getTeacherById($id) {
        $cacheKey = "teacher_{$id}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.full_name,
                    u.created_at,
                    u.last_login,
                    u.is_active
                FROM users u
                WHERE u.id = ? AND u.role = 'teacher'
            ";
            
            $stmt = $this->executeQuery($sql, [$id]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetch() : false;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Create new teacher
     */
    public function createTeacher($data) {
        $sql = "
            INSERT INTO users (username, email, password, role, full_name, is_active, created_at)
            VALUES (?, ?, ?, 'teacher', ?, true, CURRENT_TIMESTAMP)
        ";
        
        $params = [
            $data['username'],
            $data['email'],
            password_hash($data['password'], PASSWORD_DEFAULT),
            $data['full_name']
        ];
        
        $stmt = $this->executeQuery($sql, $params);
        if ($stmt) {
            // Clear cache
            unset($this->cache['all_teachers']);
            return $this->db->lastInsertId();
        }
        return false;
    }
    
    /**
     * Update teacher
     */
    public function updateTeacher($id, $data) {
        $updateFields = [];
        $params = [];
        
        if (isset($data['username'])) {
            $updateFields[] = 'username = ?';
            $params[] = $data['username'];
        }
        
        if (isset($data['email'])) {
            $updateFields[] = 'email = ?';
            $params[] = $data['email'];
        }
        
        if (isset($data['full_name'])) {
            $updateFields[] = 'full_name = ?';
            $params[] = $data['full_name'];
        }
        
        if (isset($data['password'])) {
            $updateFields[] = 'password = ?';
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (isset($data['is_active'])) {
            $updateFields[] = 'is_active = ?';
            $params[] = (bool)$data['is_active'];
        }
        
        if (empty($updateFields)) {
            return false;
        }
        
        $params[] = $id;
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ? AND role = 'teacher'";
        
        $stmt = $this->executeQuery($sql, $params);
        if ($stmt) {
            // Clear cache
            unset($this->cache['all_teachers']);
            unset($this->cache["teacher_{$id}"]);
            return true;
        }
        return false;
    }
    
    /**
     * Delete teacher (soft delete)
     */
    public function deleteTeacher($id) {
        $sql = "UPDATE users SET is_active = false WHERE id = ? AND role = 'teacher'";
        $stmt = $this->executeQuery($sql, [$id]);
        
        if ($stmt) {
            // Clear cache
            unset($this->cache['all_teachers']);
            unset($this->cache["teacher_{$id}"]);
            return true;
        }
        return false;
    }
    
    /**
     * Get user statistics
     */
    public function getUserStats() {
        $sql = "
            SELECT 
                role,
                COUNT(*) as count,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
                COUNT(CASE WHEN last_login > (CURRENT_TIMESTAMP - INTERVAL '30 days') THEN 1 END) as recent_login_count
            FROM users
            GROUP BY role
        ";
        
        $stmt = $this->executeQuery($sql);
        return $stmt ? $stmt->fetchAll() : [];
    }
    
    /**
     * Check if email exists
     */
    public function emailExists($email, $excludeId = null) {
        $sql = "SELECT id FROM users WHERE email = ?";
        $params = [$email];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->executeQuery($sql, $params);
        return $stmt && $stmt->fetch() !== false;
    }
    
    /**
     * Check if username exists
     */
    public function usernameExists($username, $excludeId = null) {
        $sql = "SELECT id FROM users WHERE username = ?";
        $params = [$username];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->executeQuery($sql, $params);
        return $stmt && $stmt->fetch() !== false;
    }
}

?>