<?php

require_once __DIR__ . '/BaseService.php';

/**
 * Class Service
 * Manages class levels data
 */
class ClassService extends BaseService {
    private static $instance = null;
    private $cache = [];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get all active class levels
     */
    public function getAllClasses() {
        if (!isset($this->cache['all_classes'])) {
            $this->cache['all_classes'] = $this->getActive('class_levels', 'display_order ASC');
        }
        return $this->cache['all_classes'];
    }
    
    /**
     * Get class by ID
     */
    public function getClassById($id) {
        $cacheKey = "class_{$id}";
        if (!isset($this->cache[$cacheKey])) {
            $this->cache[$cacheKey] = $this->getById('class_levels', $id);
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get classes by type (junior/senior)
     */
    public function getClassesByType($type) {
        $cacheKey = "classes_type_{$type}";
        if (!isset($this->cache[$cacheKey])) {
            $conditions = ['is_active' => true, 'level_type' => $type];
            $this->cache[$cacheKey] = $this->getAll('class_levels', $conditions, 'display_order ASC');
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get senior classes
     */
    public function getSeniorClasses() {
        return $this->getClassesByType('senior');
    }
    
    /**
     * Get junior classes
     */
    public function getJuniorClasses() {
        return $this->getClassesByType('junior');
    }
    
    /**
     * Get class name by ID
     */
    public function getClassName($id) {
        $class = $this->getClassById($id);
        return $class ? $class['name'] : null;
    }
    
    /**
     * Get class display name by ID
     */
    public function getClassDisplayName($id) {
        $class = $this->getClassById($id);
        return $class ? $class['display_name'] : null;
    }
    
    /**
     * Check if class exists and is active (by ID)
     */
    public function isValidClass($id) {
        $class = $this->getClassById($id);
        return $class && $class['is_active'];
    }
    
    /**
     * Check if class level exists and is active (by name)
     */
    public function isValidClassLevel($classLevel) {
        $cacheKey = "valid_class_level_{$classLevel}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "SELECT id FROM class_levels WHERE name = ? AND is_active = true";
            $stmt = $this->executeQuery($sql, [$classLevel]);
            $this->cache[$cacheKey] = $stmt && $stmt->fetch();
        }
        return (bool)$this->cache[$cacheKey];
    }
    
    /**
     * Create new class level
     */
    public function createClass($data) {
        $requiredFields = ['name', 'display_name', 'display_order', 'level_type'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return ['success' => false, 'message' => "Field {$field} is required"];
            }
        }
        
        $classData = [
            'name' => $data['name'],
            'display_name' => $data['display_name'],
            'display_order' => $data['display_order'],
            'level_type' => $data['level_type'],
            'is_active' => $data['is_active'] ?? true,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $id = $this->insert('class_levels', $classData);
        if ($id) {
            $this->clearCache();
            return ['success' => true, 'id' => $id];
        }
        
        return ['success' => false, 'message' => 'Failed to create class'];
    }
    
    /**
     * Update class level
     */
    public function updateClass($id, $data) {
        $updateData = [];
        $allowedFields = ['name', 'display_name', 'display_order', 'level_type', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No valid fields to update'];
        }
        
        $success = $this->update('class_levels', $id, $updateData);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to update class'];
    }
    
    /**
     * Delete class level
     */
    public function deleteClass($id) {
        $success = $this->softDelete('class_levels', $id);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to delete class'];
    }
    
    /**
     * Clear cache
     */
    public function clearCache() {
        $this->cache = [];
    }
    
    /**
     * Get classes as key-value pairs (id => name)
     */
    public function getClassOptions() {
        $cacheKey = 'class_options';
        if (!isset($this->cache[$cacheKey])) {
            $classes = $this->getAllClasses();
            $options = [];
            foreach ($classes as $class) {
                $options[$class['id']] = $class['name'];
            }
            $this->cache[$cacheKey] = $options;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get classes as key-value pairs (id => display_name)
     */
    public function getClassDisplayOptions() {
        $cacheKey = 'class_display_options';
        if (!isset($this->cache[$cacheKey])) {
            $classes = $this->getAllClasses();
            $options = [];
            foreach ($classes as $class) {
                $options[$class['id']] = $class['display_name'];
            }
            $this->cache[$cacheKey] = $options;
        }
        return $this->cache[$cacheKey];
    }
}

?>