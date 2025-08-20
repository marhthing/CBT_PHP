<?php
/**
 * Database Compatibility Layer
 * 
 * This file provides complete compatibility methods for both MySQL and PostgreSQL databases.
 * It handles all database-specific syntax differences to ensure the CBT system works 
 * seamlessly with either database system.
 */

class DatabaseCompatibility 
{
    private $db_type;
    private $pdo;
    
    public function __construct($db_type, $pdo) 
    {
        $this->db_type = $db_type;
        $this->pdo = $pdo;
    }
    
    /**
     * Get database-specific random ordering clause
     */
    public function getRandomOrder() 
    {
        if ($this->db_type === 'mysql') {
            return 'RAND()';
        } else {
            return 'RANDOM()';
        }
    }
    
    /**
     * Get database-specific AUTO_INCREMENT / SERIAL syntax
     */
    public function getAutoIncrement() 
    {
        if ($this->db_type === 'mysql') {
            return 'AUTO_INCREMENT';
        } else {
            return 'SERIAL';
        }
    }
    
    /**
     * Get database-specific boolean type
     */
    public function getBooleanType() 
    {
        if ($this->db_type === 'mysql') {
            return 'TINYINT(1)';
        } else {
            return 'BOOLEAN';
        }
    }
    
    /**
     * Get database-specific text type
     */
    public function getTextType() 
    {
        if ($this->db_type === 'mysql') {
            return 'TEXT';
        } else {
            return 'TEXT';
        }
    }
    
    /**
     * Get database-specific datetime type
     */
    public function getDateTimeType() 
    {
        if ($this->db_type === 'mysql') {
            return 'DATETIME';
        } else {
            return 'TIMESTAMP';
        }
    }
    
    /**
     * Get database-specific UUID generation
     */
    public function generateUUID() 
    {
        if ($this->db_type === 'mysql') {
            return 'UUID()';
        } else {
            return 'gen_random_uuid()';
        }
    }
    
    /**
     * Get database-specific JSON data type
     */
    public function getJSONType() 
    {
        if ($this->db_type === 'mysql') {
            return 'JSON';
        } else {
            return 'JSONB'; // PostgreSQL's better JSON implementation
        }
    }
    
    /**
     * Get database-specific string concatenation
     */
    public function concat($fields) 
    {
        if ($this->db_type === 'mysql') {
            return 'CONCAT(' . implode(', ', $fields) . ')';
        } else {
            return implode(' || ', $fields);
        }
    }
    
    /**
     * Get database-specific IF/CASE statement
     */
    public function ifStatement($condition, $true_value, $false_value) 
    {
        if ($this->db_type === 'mysql') {
            return "IF($condition, $true_value, $false_value)";
        } else {
            return "CASE WHEN $condition THEN $true_value ELSE $false_value END";
        }
    }
    
    /**
     * Get database-specific GROUP_CONCAT / STRING_AGG
     */
    public function groupConcat($field, $separator = ',') 
    {
        if ($this->db_type === 'mysql') {
            return "GROUP_CONCAT($field SEPARATOR '$separator')";
        } else {
            return "STRING_AGG($field::TEXT, '$separator')";
        }
    }
    
    /**
     * Get database-specific REPLACE function
     */
    public function replace($field, $search, $replace) 
    {
        if ($this->db_type === 'mysql') {
            return "REPLACE($field, '$search', '$replace')";
        } else {
            return "REPLACE($field, '$search', '$replace')";
        }
    }
    
    /**
     * Get database-specific escape character for LIKE queries
     */
    public function escapeLike($value) 
    {
        if ($this->db_type === 'mysql') {
            return str_replace(['%', '_'], ['\%', '\_'], $value);
        } else {
            return str_replace(['%', '_'], ['\%', '\_'], $value);
        }
    }
    
    /**
     * Get database-specific timestamp functions
     */
    public function getCurrentTimestamp() 
    {
        if ($this->db_type === 'mysql') {
            return 'NOW()';
        } else {
            return 'NOW()';
        }
    }
    
    /**
     * Get database-specific date difference function
     */
    public function dateDiff($date1, $date2) 
    {
        if ($this->db_type === 'mysql') {
            return "DATEDIFF($date1, $date2)";
        } else {
            return "EXTRACT(DAY FROM $date1 - $date2)";
        }
    }
    
    /**
     * Get database-specific date formatting
     */
    public function dateFormat($date, $format) 
    {
        if ($this->db_type === 'mysql') {
            return "DATE_FORMAT($date, '$format')";
        } else {
            // Convert MySQL format to PostgreSQL format
            $pg_format = str_replace(
                ['%Y', '%m', '%d', '%H', '%i', '%s'],
                ['YYYY', 'MM', 'DD', 'HH24', 'MI', 'SS'],
                $format
            );
            return "TO_CHAR($date, '$pg_format')";
        }
    }
    
    /**
     * Handle database-specific transaction isolation levels
     */
    public function setIsolationLevel($level = 'READ_COMMITTED') 
    {
        if ($this->db_type === 'mysql') {
            $this->pdo->exec("SET TRANSACTION ISOLATION LEVEL $level");
        } else {
            $this->pdo->exec("SET TRANSACTION ISOLATION LEVEL $level");
        }
    }
    
    /**
     * Get database-specific full-text search
     */
    public function fullTextSearch($column, $search_term) 
    {
        if ($this->db_type === 'mysql') {
            return "MATCH($column) AGAINST('$search_term' IN NATURAL LANGUAGE MODE)";
        } else {
            return "to_tsvector($column) @@ plainto_tsquery('$search_term')";
        }
    }
    
    /**
     * Get optimal database-specific indexing suggestions
     */
    public function getIndexSuggestions() 
    {
        if ($this->db_type === 'mysql') {
            return [
                'users' => ['username', 'email', 'reg_number', 'role'],
                'questions' => ['subject_id', 'class_level', 'term_id', 'session_id'],
                'test_codes' => ['code', 'is_active', 'created_at'],
                'test_results' => ['student_id', 'test_code_id', 'created_at']
            ];
        } else {
            return [
                'users' => ['username', 'email', 'reg_number', 'role'],
                'questions' => ['subject_id', 'class_level', 'term_id', 'session_id'],
                'test_codes' => ['code', 'is_active', 'created_at'],
                'test_results' => ['student_id', 'test_code_id', 'created_at']
            ];
        }
    }
    
    /**
     * Execute database-specific optimization queries
     */
    public function optimize() 
    {
        if ($this->db_type === 'mysql') {
            // MySQL-specific optimizations
            $this->pdo->exec("OPTIMIZE TABLE users, questions, test_codes, test_results");
        } else {
            // PostgreSQL-specific optimizations
            $this->pdo->exec("VACUUM ANALYZE");
        }
    }
}

?>