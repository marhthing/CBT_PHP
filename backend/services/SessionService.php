<?php

require_once __DIR__ . '/BaseService.php';

/**
 * Session Service
 * Manages academic sessions data
 */
class SessionService extends BaseService {
    private static $instance = null;
    private $cache = [];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get all active sessions
     */
    public function getAllSessions() {
        if (!isset($this->cache['all_sessions'])) {
            $this->cache['all_sessions'] = $this->getActive('sessions', 'start_date DESC');
        }
        return $this->cache['all_sessions'];
    }
    
    /**
     * Get session by ID
     */
    public function getSessionById($id) {
        $cacheKey = "session_{$id}";
        if (!isset($this->cache[$cacheKey])) {
            $this->cache[$cacheKey] = $this->getById('sessions', $id);
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get session name by ID
     */
    public function getSessionName($id) {
        $session = $this->getSessionById($id);
        return $session ? $session['name'] : null;
    }
    
    /**
     * Get current session
     */
    public function getCurrentSession() {
        if (!isset($this->cache['current_session'])) {
            $sql = "SELECT * FROM sessions WHERE is_current = true AND is_active = true LIMIT 1";
            $stmt = $this->executeQuery($sql);
            $this->cache['current_session'] = $stmt ? $stmt->fetch() : $this->getLatestSession();
        }
        return $this->cache['current_session'];
    }
    
    /**
     * Get latest session (fallback if no current session)
     */
    public function getLatestSession() {
        if (!isset($this->cache['latest_session'])) {
            $sessions = $this->getAllSessions();
            $this->cache['latest_session'] = !empty($sessions) ? $sessions[0] : null;
        }
        return $this->cache['latest_session'];
    }
    
    /**
     * Check if session exists and is active
     */
    public function isValidSession($id) {
        $session = $this->getSessionById($id);
        return $session && $session['is_active'];
    }
    
    /**
     * Create new session
     */
    public function createSession($data) {
        $requiredFields = ['name', 'start_date', 'end_date'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return ['success' => false, 'message' => "Field {$field} is required"];
            }
        }
        
        $sessionData = [
            'name' => $data['name'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'is_current' => $data['is_current'] ?? false,
            'is_active' => $data['is_active'] ?? true,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        // If this is set as current, make sure no other session is current
        if ($sessionData['is_current']) {
            $this->executeQuery("UPDATE sessions SET is_current = false WHERE is_current = true");
        }
        
        $id = $this->insert('sessions', $sessionData);
        if ($id) {
            $this->clearCache();
            return ['success' => true, 'id' => $id];
        }
        
        return ['success' => false, 'message' => 'Failed to create session'];
    }
    
    /**
     * Update session
     */
    public function updateSession($id, $data) {
        $updateData = [];
        $allowedFields = ['name', 'start_date', 'end_date', 'is_current', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No valid fields to update'];
        }
        
        // If this is set as current, make sure no other session is current
        if (isset($updateData['is_current']) && $updateData['is_current']) {
            $this->executeQuery("UPDATE sessions SET is_current = false WHERE is_current = true AND id != ?", [$id]);
        }
        
        $success = $this->update('sessions', $id, $updateData);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to update session'];
    }
    
    /**
     * Delete session
     */
    public function deleteSession($id) {
        $success = $this->softDelete('sessions', $id);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to delete session'];
    }
    
    /**
     * Set session as current
     */
    public function setCurrentSession($id) {
        // First remove current flag from all sessions
        $this->executeQuery("UPDATE sessions SET is_current = false WHERE is_current = true");
        
        // Set the specified session as current
        $success = $this->update('sessions', $id, ['is_current' => true]);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to set current session'];
    }
    
    /**
     * Clear cache
     */
    public function clearCache() {
        $this->cache = [];
    }
    
    /**
     * Get sessions as key-value pairs (id => name)
     */
    public function getSessionOptions() {
        $cacheKey = 'session_options';
        if (!isset($this->cache[$cacheKey])) {
            $sessions = $this->getAllSessions();
            $options = [];
            foreach ($sessions as $session) {
                $options[$session['id']] = $session['name'];
            }
            $this->cache[$cacheKey] = $options;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get session by name
     */
    public function getSessionByName($name) {
        $cacheKey = "session_name_{$name}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "SELECT * FROM sessions WHERE name = ? AND is_active = true";
            $stmt = $this->executeQuery($sql, [$name]);
            $this->cache[$cacheKey] = $stmt ? $stmt->fetch() : false;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Check if date is within session period
     */
    public function isDateInSession($sessionId, $date = null) {
        $session = $this->getSessionById($sessionId);
        if (!$session) return false;
        
        $checkDate = $date ?: date('Y-m-d');
        return $checkDate >= $session['start_date'] && $checkDate <= $session['end_date'];
    }
}

?>