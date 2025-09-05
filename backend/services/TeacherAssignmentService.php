<?php

require_once __DIR__ . '/BaseService.php';

/**
 * Teacher Assignment Service
 * Manages teacher-to-subject-class assignments (which teacher teaches what)
 */
class TeacherAssignmentService extends BaseService {
    private static $instance = null;
    private $cache = [];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get all teacher assignments
     */
    public function getAllTeacherAssignments() {
        if (!isset($this->cache['all_teacher_assignments'])) {
            $sql = "
                SELECT ta.*, 
                       u.full_name as teacher_name,
                       s.name as subject_name,
                       s.code as subject_code,
                       sess.name as session_name,
                       t.name as term_name
                FROM teacher_assignments ta
                LEFT JOIN users u ON ta.teacher_id = u.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                LEFT JOIN sessions sess ON ta.session_id = sess.id
                LEFT JOIN terms t ON ta.term_id = t.id
                ORDER BY ta.created_at DESC
            ";
            $stmt = $this->executeQuery($sql);
            $this->cache['all_teacher_assignments'] = $stmt ? $stmt->fetchAll() : [];
        }
        return $this->cache['all_teacher_assignments'];
    }
    
    /**
     * Get teacher assignment by ID
     */
    public function getTeacherAssignmentById($id) {
        $cacheKey = "teacher_assignment_{$id}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "
                SELECT ta.*, 
                       u.full_name as teacher_name,
                       s.name as subject_name,
                       s.code as subject_code,
                       sess.name as session_name,
                       t.name as term_name
                FROM teacher_assignments ta
                LEFT JOIN users u ON ta.teacher_id = u.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                LEFT JOIN sessions sess ON ta.session_id = sess.id
                LEFT JOIN terms t ON ta.term_id = t.id
                WHERE ta.id = ?
            ";
            $stmt = $this->executeQuery($sql, [$id]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetch() : false;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get assignments by teacher ID
     */
    public function getAssignmentsByTeacher($teacherId) {
        $cacheKey = "teacher_assignments_teacher_{$teacherId}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "
                SELECT ta.*, 
                       u.full_name as teacher_name,
                       s.name as subject_name,
                       s.code as subject_code,
                       sess.name as session_name,
                       t.name as term_name
                FROM teacher_assignments ta
                LEFT JOIN users u ON ta.teacher_id = u.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                LEFT JOIN sessions sess ON ta.session_id = sess.id
                LEFT JOIN terms t ON ta.term_id = t.id
                WHERE ta.teacher_id = ?
                ORDER BY s.name ASC, ta.class_level ASC
            ";
            $stmt = $this->executeQuery($sql, [$teacherId]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetchAll() : [];
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get assignments by subject
     */
    public function getAssignmentsBySubject($subjectId) {
        $cacheKey = "teacher_assignments_subject_{$subjectId}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "
                SELECT ta.*, 
                       u.full_name as teacher_name,
                       s.name as subject_name,
                       s.code as subject_code,
                       sess.name as session_name,
                       t.name as term_name
                FROM teacher_assignments ta
                LEFT JOIN users u ON ta.teacher_id = u.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                LEFT JOIN sessions sess ON ta.session_id = sess.id
                LEFT JOIN terms t ON ta.term_id = t.id
                WHERE ta.subject_id = ?
                ORDER BY ta.class_level ASC, u.full_name ASC
            ";
            $stmt = $this->executeQuery($sql, [$subjectId]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetchAll() : [];
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get assignments by class level
     */
    public function getAssignmentsByClass($classLevel) {
        $cacheKey = "teacher_assignments_class_{$classLevel}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "
                SELECT ta.*, 
                       u.full_name as teacher_name,
                       s.name as subject_name,
                       s.code as subject_code,
                       sess.name as session_name,
                       t.name as term_name
                FROM teacher_assignments ta
                LEFT JOIN users u ON ta.teacher_id = u.id
                LEFT JOIN subjects s ON ta.subject_id = s.id
                LEFT JOIN sessions sess ON ta.session_id = sess.id
                LEFT JOIN terms t ON ta.term_id = t.id
                WHERE ta.class_level = ?
                ORDER BY s.name ASC, u.full_name ASC
            ";
            $stmt = $this->executeQuery($sql, [$classLevel]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetchAll() : [];
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Check if teacher is assigned to specific subject and class
     */
    public function isTeacherAssigned($teacherId, $subjectId, $classLevel, $sessionId, $termId) {
        $sql = "
            SELECT id FROM teacher_assignments 
            WHERE teacher_id = ? AND subject_id = ? AND class_level = ? 
            AND session_id = ? AND term_id = ?
        ";
        $stmt = $this->executeQuery($sql, [$teacherId, $subjectId, $classLevel, $sessionId, $termId]);
        return $stmt && $stmt->fetch();
    }
    
    /**
     * Get teacher's subjects for a specific class and session/term
     */
    public function getTeacherSubjects($teacherId, $classLevel = null, $sessionId = null, $termId = null) {
        $cacheKey = "teacher_subjects_{$teacherId}_{$classLevel}_{$sessionId}_{$termId}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "
                SELECT DISTINCT s.id, s.name, s.code
                FROM teacher_assignments ta
                JOIN subjects s ON ta.subject_id = s.id
                WHERE ta.teacher_id = ? AND s.is_active = true
            ";
            $params = [$teacherId];
            
            if ($classLevel) {
                $sql .= " AND ta.class_level = ?";
                $params[] = $classLevel;
            }
            if ($sessionId) {
                $sql .= " AND ta.session_id = ?";
                $params[] = $sessionId;
            }
            if ($termId) {
                $sql .= " AND ta.term_id = ?";
                $params[] = $termId;
            }
            
            $sql .= " ORDER BY s.name ASC";
            $stmt = $this->executeQuery($sql, $params);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetchAll() : [];
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get teacher's classes for a specific subject and session/term
     */
    public function getTeacherClasses($teacherId, $subjectId = null, $sessionId = null, $termId = null) {
        $cacheKey = "teacher_classes_{$teacherId}_{$subjectId}_{$sessionId}_{$termId}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "
                SELECT DISTINCT ta.class_level
                FROM teacher_assignments ta
                WHERE ta.teacher_id = ?
            ";
            $params = [$teacherId];
            
            if ($subjectId) {
                $sql .= " AND ta.subject_id = ?";
                $params[] = $subjectId;
            }
            if ($sessionId) {
                $sql .= " AND ta.session_id = ?";
                $params[] = $sessionId;
            }
            if ($termId) {
                $sql .= " AND ta.term_id = ?";
                $params[] = $termId;
            }
            
            $sql .= " ORDER BY ta.class_level ASC";
            $stmt = $this->executeQuery($sql, $params);
            $result = $stmt ? $stmt->fetchAll() : [];
            
            // Extract just the class_level values
            $classes = [];
            foreach ($result as $row) {
                $classes[] = $row['class_level'];
            }
            $this->cache[$cacheKey] = $classes;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Create new teacher assignment
     */
    public function createTeacherAssignment($data) {
        $requiredFields = ['teacher_id', 'subject_id', 'class_level', 'term_id', 'session_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return ['success' => false, 'message' => "Field {$field} is required"];
            }
        }
        
        // Check if assignment already exists
        if ($this->isTeacherAssigned($data['teacher_id'], $data['subject_id'], $data['class_level'], $data['session_id'], $data['term_id'])) {
            return ['success' => false, 'message' => 'Teacher is already assigned to this subject and class'];
        }
        
        $assignmentData = [
            'teacher_id' => $data['teacher_id'],
            'subject_id' => $data['subject_id'],
            'class_level' => $data['class_level'],
            'term_id' => $data['term_id'],
            'session_id' => $data['session_id'],
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $id = $this->insert('teacher_assignments', $assignmentData);
        if ($id) {
            $this->clearCache();
            return ['success' => true, 'id' => $id];
        }
        
        return ['success' => false, 'message' => 'Failed to create teacher assignment'];
    }
    
    /**
     * Update teacher assignment
     */
    public function updateTeacherAssignment($id, $data) {
        $updateData = [];
        $allowedFields = ['teacher_id', 'subject_id', 'class_level', 'term_id', 'session_id'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No valid fields to update'];
        }
        
        $success = $this->update('teacher_assignments', $id, $updateData);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to update teacher assignment'];
    }
    
    /**
     * Delete teacher assignment
     */
    public function deleteTeacherAssignment($id) {
        $success = $this->delete('teacher_assignments', $id);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to delete teacher assignment'];
    }
    
    /**
     * Clear cache
     */
    public function clearCache() {
        $this->cache = [];
    }
}

?>