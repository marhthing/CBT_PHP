<?php

require_once __DIR__ . '/BaseService.php';

/**
 * Term Service
 * Manages academic terms data
 */
class TermService extends BaseService {
    private static $instance = null;
    private $cache = [];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get all active terms
     */
    public function getAllTerms() {
        if (!isset($this->cache['all_terms'])) {
            $this->cache['all_terms'] = $this->getActive('terms', 'display_order ASC');
        }
        return $this->cache['all_terms'];
    }
    
    /**
     * Get term by ID
     */
    public function getTermById($id) {
        $cacheKey = "term_{$id}";
        if (!isset($this->cache[$cacheKey])) {
            $this->cache[$cacheKey] = $this->getById('terms', $id);
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get term name by ID
     */
    public function getTermName($id) {
        $term = $this->getTermById($id);
        return $term ? $term['name'] : null;
    }
    
    /**
     * Get current term (first active term by default)
     */
    public function getCurrentTerm() {
        if (!isset($this->cache['current_term'])) {
            $terms = $this->getAllTerms();
            $this->cache['current_term'] = !empty($terms) ? $terms[0] : null;
        }
        return $this->cache['current_term'];
    }
    
    /**
     * Check if term exists and is active
     */
    public function isValidTerm($id) {
        $term = $this->getTermById($id);
        return $term && $term['is_active'];
    }
    
    /**
     * Create new term
     */
    public function createTerm($data) {
        $requiredFields = ['name', 'display_order'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return ['success' => false, 'message' => "Field {$field} is required"];
            }
        }
        
        $termData = [
            'name' => $data['name'],
            'display_order' => $data['display_order'],
            'is_active' => $data['is_active'] ?? true,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        $id = $this->insert('terms', $termData);
        if ($id) {
            $this->clearCache();
            return ['success' => true, 'id' => $id];
        }
        
        return ['success' => false, 'message' => 'Failed to create term'];
    }
    
    /**
     * Update term
     */
    public function updateTerm($id, $data) {
        $updateData = [];
        $allowedFields = ['name', 'display_order', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No valid fields to update'];
        }
        
        $success = $this->update('terms', $id, $updateData);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to update term'];
    }
    
    /**
     * Delete term
     */
    public function deleteTerm($id) {
        $success = $this->softDelete('terms', $id);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to delete term'];
    }
    
    /**
     * Clear cache
     */
    public function clearCache() {
        $this->cache = [];
    }
    
    /**
     * Get terms as key-value pairs (id => name)
     */
    public function getTermOptions() {
        $cacheKey = 'term_options';
        if (!isset($this->cache[$cacheKey])) {
            $terms = $this->getAllTerms();
            $options = [];
            foreach ($terms as $term) {
                $options[$term['id']] = $term['name'];
            }
            $this->cache[$cacheKey] = $options;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get term by name
     */
    public function getTermByName($name) {
        $cacheKey = "term_name_{$name}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "SELECT * FROM terms WHERE name = ? AND is_active = true";
            $stmt = $this->executeQuery($sql, [$name]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetch() : false;
        }
        return $this->cache[$cacheKey];
    }
}

?>