<?php

require_once __DIR__ . '/BaseService.php';

/**
 * Subject Service
 * Manages subjects data
 */
class SubjectService extends BaseService {
    private static $instance = null;
    private $cache = [];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get all active subjects
     */
    public function getAllSubjects() {
        if (!isset($this->cache['all_subjects'])) {
            $this->cache['all_subjects'] = $this->getActive('subjects', 'name ASC');
        }
        return $this->cache['all_subjects'];
    }
    
    /**
     * Get subject by ID
     */
    public function getSubjectById($id) {
        $cacheKey = "subject_{$id}";
        if (!isset($this->cache[$cacheKey])) {
            $this->cache[$cacheKey] = $this->getById('subjects', $id);
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get subject name by ID
     */
    public function getSubjectName($id) {
        $subject = $this->getSubjectById($id);
        return $subject ? $subject['name'] : null;
    }
    
    /**
     * Get subject code by ID
     */
    public function getSubjectCode($id) {
        $subject = $this->getSubjectById($id);
        return $subject ? $subject['code'] : null;
    }
    
    /**
     * Get subject by code
     */
    public function getSubjectByCode($code) {
        $cacheKey = "subject_code_{$code}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "SELECT * FROM subjects WHERE code = ? AND is_active = true";
            $stmt = $this->executeQuery($sql, [$code]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetch() : false;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get subject by name
     */
    public function getSubjectByName($name) {
        $cacheKey = "subject_name_{$name}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "SELECT * FROM subjects WHERE name = ? AND is_active = true";
            $stmt = $this->executeQuery($sql, [$name]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetch() : false;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Check if subject exists and is active
     */
    public function isValidSubject($id) {
        $subject = $this->getSubjectById($id);
        return $subject && $subject['is_active'];
    }
    
    /**
     * Create new subject
     */
    public function createSubject($data) {
        $requiredFields = ['name', 'code'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return ['success' => false, 'message' => "Field {$field} is required"];
            }
        }
        
        // Check if code already exists
        if ($this->getSubjectByCode($data['code'])) {
            return ['success' => false, 'message' => 'Subject code already exists'];
        }
        
        // Check if name already exists
        if ($this->getSubjectByName($data['name'])) {
            return ['success' => false, 'message' => 'Subject name already exists'];
        }
        
        $subjectData = [
            'name' => $data['name'],
            'code' => strtoupper($data['code']),
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $id = $this->insert('subjects', $subjectData);
        if ($id) {
            $this->clearCache();
            return ['success' => true, 'id' => $id];
        }
        
        return ['success' => false, 'message' => 'Failed to create subject'];
    }
    
    /**
     * Update subject
     */
    public function updateSubject($id, $data) {
        $updateData = [];
        $allowedFields = ['name', 'code', 'description', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'code') {
                    $updateData[$field] = strtoupper($data[$field]);
                } else {
                    $updateData[$field] = $data[$field];
                }
            }
        }
        
        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No valid fields to update'];
        }
        
        // Check for duplicate code if updating code
        if (isset($updateData['code'])) {
            $existing = $this->getSubjectByCode($updateData['code']);
            if ($existing && $existing['id'] != $id) {
                return ['success' => false, 'message' => 'Subject code already exists'];
            }
        }
        
        // Check for duplicate name if updating name
        if (isset($updateData['name'])) {
            $existing = $this->getSubjectByName($updateData['name']);
            if ($existing && $existing['id'] != $id) {
                return ['success' => false, 'message' => 'Subject name already exists'];
            }
        }
        
        $success = $this->update('subjects', $id, $updateData);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to update subject'];
    }
    
    /**
     * Delete subject
     */
    public function deleteSubject($id) {
        $success = $this->softDelete('subjects', $id);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to delete subject'];
    }
    
    /**
     * Clear cache
     */
    public function clearCache() {
        $this->cache = [];
    }
    
    /**
     * Get subjects as key-value pairs (id => name)
     */
    public function getSubjectOptions() {
        $cacheKey = 'subject_options';
        if (!isset($this->cache[$cacheKey])) {
            $subjects = $this->getAllSubjects();
            $options = [];
            foreach ($subjects as $subject) {
                $options[$subject['id']] = $subject['name'];
            }
            $this->cache[$cacheKey] = $options;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get subjects as key-value pairs (id => code)
     */
    public function getSubjectCodeOptions() {
        $cacheKey = 'subject_code_options';
        if (!isset($this->cache[$cacheKey])) {
            $subjects = $this->getAllSubjects();
            $options = [];
            foreach ($subjects as $subject) {
                $options[$subject['id']] = $subject['code'];
            }
            $this->cache[$cacheKey] = $options;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Search subjects by name or code
     */
    public function searchSubjects($query) {
        $cacheKey = "search_subjects_{$query}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "SELECT * FROM subjects WHERE (name LIKE ? OR code LIKE ?) AND is_active = true ORDER BY name ASC";
            $searchTerm = "%{$query}%";
            $stmt = $this->executeQuery($sql, [$searchTerm, $searchTerm]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetchAll() : [];
        }
        return $this->cache[$cacheKey];
    }
}

?>