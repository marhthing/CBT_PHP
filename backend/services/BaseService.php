<?php

require_once __DIR__ . '/../config/database.php';

/**
 * Base Service Class
 * Provides common database operations for all service classes
 */
abstract class BaseService {
    protected $db;
    protected $database;
    
    public function __construct() {
        $this->database = new Database();
        $this->db = $this->database->getConnection();
    }
    
    /**
     * Get database instance for custom queries
     */
    protected function getDatabase() {
        return $this->database;
    }
    
    /**
     * Execute a prepared statement safely
     */
    protected function executeQuery($sql, $params = []) {
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (Exception $e) {
            error_log("Database query error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get single record by ID
     */
    protected function getById($table, $id) {
        $sql = "SELECT * FROM {$table} WHERE id = ?";
        $stmt = $this->executeQuery($sql, [$id]);
        return $stmt ? $stmt->fetch() : false;
    }
    
    /**
     * Get all records from table with optional conditions
     */
    protected function getAll($table, $conditions = [], $orderBy = 'id ASC') {
        $sql = "SELECT * FROM {$table}";
        $params = [];
        
        if (!empty($conditions)) {
            $whereClause = [];
            foreach ($conditions as $field => $value) {
                $whereClause[] = "{$field} = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $whereClause);
        }
        
        $sql .= " ORDER BY {$orderBy}";
        $stmt = $this->executeQuery($sql, $params);
        return $stmt ? $stmt->fetchAll() : [];
    }
    
    /**
     * Get active records only
     */
    protected function getActive($table, $orderBy = 'id ASC') {
        return $this->getAll($table, ['is_active' => true], $orderBy);
    }
    
    /**
     * Count records with optional conditions
     */
    protected function count($table, $conditions = []) {
        $sql = "SELECT COUNT(*) as count FROM {$table}";
        $params = [];
        
        if (!empty($conditions)) {
            $whereClause = [];
            foreach ($conditions as $field => $value) {
                $whereClause[] = "{$field} = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(' AND ', $whereClause);
        }
        
        $stmt = $this->executeQuery($sql, $params);
        $result = $stmt ? $stmt->fetch() : false;
        return $result ? (int)$result['count'] : 0;
    }
    
    /**
     * Insert new record
     */
    protected function insert($table, $data) {
        $fields = array_keys($data);
        $placeholders = array_fill(0, count($fields), '?');
        
        $sql = "INSERT INTO {$table} (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $this->executeQuery($sql, array_values($data));
        
        if ($stmt) {
            return $this->db->lastInsertId();
        }
        return false;
    }
    
    /**
     * Update record by ID
     */
    protected function update($table, $id, $data) {
        $fields = [];
        $params = [];
        
        foreach ($data as $field => $value) {
            $fields[] = "{$field} = ?";
            $params[] = $value;
        }
        $params[] = $id;
        
        $sql = "UPDATE {$table} SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->executeQuery($sql, $params);
        return $stmt !== false;
    }
    
    /**
     * Delete record by ID
     */
    protected function delete($table, $id) {
        $sql = "DELETE FROM {$table} WHERE id = ?";
        $stmt = $this->executeQuery($sql, [$id]);
        return $stmt !== false;
    }
    
    /**
     * Soft delete (set is_active = false)
     */
    protected function softDelete($table, $id) {
        return $this->update($table, $id, ['is_active' => false]);
    }
}

?>