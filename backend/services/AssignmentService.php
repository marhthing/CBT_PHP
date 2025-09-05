<?php

require_once __DIR__ . '/BaseService.php';

/**
 * Assignment Service
 * Manages test assignments/test types (First CA, Second CA, Examination)
 */
class AssignmentService extends BaseService {
    private static $instance = null;
    private $cache = [];
    
    // Standard test assignments/types
    private $testAssignments = [
        'First CA' => [
            'name' => 'First CA',
            'display_name' => 'First Continuous Assessment',
            'code' => 'CA1',
            'order' => 1,
            'description' => 'First term continuous assessment test'
        ],
        'Second CA' => [
            'name' => 'Second CA',
            'display_name' => 'Second Continuous Assessment', 
            'code' => 'CA2',
            'order' => 2,
            'description' => 'Second term continuous assessment test'
        ],
        'Examination' => [
            'name' => 'Examination',
            'display_name' => 'Term Examination',
            'code' => 'EXAM',
            'order' => 3,
            'description' => 'End of term examination'
        ]
    ];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get all available test assignments
     */
    public function getAllAssignments() {
        return array_values($this->testAssignments);
    }
    
    /**
     * Get assignment by name
     */
    public function getAssignmentByName($name) {
        return $this->testAssignments[$name] ?? null;
    }
    
    /**
     * Get assignment display name
     */
    public function getAssignmentDisplayName($name) {
        $assignment = $this->getAssignmentByName($name);
        return $assignment ? $assignment['display_name'] : $name;
    }
    
    /**
     * Get assignment code
     */
    public function getAssignmentCode($name) {
        $assignment = $this->getAssignmentByName($name);
        return $assignment ? $assignment['code'] : null;
    }
    
    /**
     * Check if assignment is valid
     */
    public function isValidAssignment($name) {
        return isset($this->testAssignments[$name]);
    }
    
    /**
     * Get assignment options for dropdowns (name => display_name)
     */
    public function getAssignmentOptions() {
        $options = [];
        foreach ($this->testAssignments as $name => $assignment) {
            $options[$name] = $assignment['display_name'];
        }
        return $options;
    }
    
    /**
     * Get assignment codes for dropdowns (name => code)
     */
    public function getAssignmentCodeOptions() {
        $options = [];
        foreach ($this->testAssignments as $name => $assignment) {
            $options[$name] = $assignment['code'];
        }
        return $options;
    }
    
    /**
     * Get assignments ordered by sequence
     */
    public function getAssignmentsOrdered() {
        $assignments = $this->getAllAssignments();
        usort($assignments, function($a, $b) {
            return $a['order'] - $b['order'];
        });
        return $assignments;
    }
    
    /**
     * Get questions count by assignment type
     */
    public function getQuestionsCountByAssignment($subjectId = null, $classLevel = null, $termId = null, $sessionId = null) {
        $cacheKey = "questions_count_{$subjectId}_{$classLevel}_{$termId}_{$sessionId}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "
                SELECT question_assignment, COUNT(*) as count
                FROM questions 
                WHERE 1=1
            ";
            $params = [];
            
            if ($subjectId) {
                $sql .= " AND subject_id = ?";
                $params[] = $subjectId;
            }
            if ($classLevel) {
                $sql .= " AND class_level = ?";
                $params[] = $classLevel;
            }
            if ($termId) {
                $sql .= " AND term_id = ?";
                $params[] = $termId;
            }
            if ($sessionId) {
                $sql .= " AND session_id = ?";
                $params[] = $sessionId;
            }
            
            $sql .= " GROUP BY question_assignment";
            $stmt = $this->executeQuery($sql, $params);
            $result = $stmt ? $stmt->fetchAll() : [];
            
            $counts = [];
            foreach ($result as $row) {
                $counts[$row['question_assignment']] = (int)$row['count'];
            }
            
            // Fill in missing assignments with 0 count
            foreach ($this->testAssignments as $name => $assignment) {
                if (!isset($counts[$name])) {
                    $counts[$name] = 0;
                }
            }
            
            $this->cache[$cacheKey] = $counts;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Get test codes count by test type
     */
    public function getTestCodesCountByType($subjectId = null, $classLevel = null, $termId = null, $sessionId = null) {
        $cacheKey = "test_codes_count_{$subjectId}_{$classLevel}_{$termId}_{$sessionId}";
        if (!isset($this->cache[$cacheKey])) {
            $sql = "
                SELECT test_type, COUNT(*) as count
                FROM test_codes 
                WHERE 1=1
            ";
            $params = [];
            
            if ($subjectId) {
                $sql .= " AND subject_id = ?";
                $params[] = $subjectId;
            }
            if ($classLevel) {
                $sql .= " AND class_level = ?";
                $params[] = $classLevel;
            }
            if ($termId) {
                $sql .= " AND term_id = ?";
                $params[] = $termId;
            }
            if ($sessionId) {
                $sql .= " AND session_id = ?";
                $params[] = $sessionId;
            }
            
            $sql .= " GROUP BY test_type";
            $stmt = $this->executeQuery($sql, $params);
            $result = $stmt ? $stmt->fetchAll() : [];
            
            $counts = [];
            foreach ($result as $row) {
                // Map test_type to assignment names
                $testType = $row['test_type'];
                $assignmentName = $this->mapTestTypeToAssignment($testType);
                $counts[$assignmentName] = (int)$row['count'];
            }
            
            // Fill in missing assignments with 0 count
            foreach ($this->testAssignments as $name => $assignment) {
                if (!isset($counts[$name])) {
                    $counts[$name] = 0;
                }
            }
            
            $this->cache[$cacheKey] = $counts;
        }
        return $this->cache[$cacheKey];
    }
    
    /**
     * Map test_type field to assignment name
     */
    private function mapTestTypeToAssignment($testType) {
        $mapping = [
            'first_ca' => 'First CA',
            'second_ca' => 'Second CA', 
            'examination' => 'Examination',
            'exam' => 'Examination',
            'ca1' => 'First CA',
            'ca2' => 'Second CA'
        ];
        
        $normalized = strtolower(str_replace(' ', '_', $testType));
        return $mapping[$normalized] ?? $testType;
    }
    
    /**
     * Map assignment name to test_type field
     */
    public function mapAssignmentToTestType($assignmentName) {
        $mapping = [
            'First CA' => 'first_ca',
            'Second CA' => 'second_ca',
            'Examination' => 'examination'
        ];
        
        return $mapping[$assignmentName] ?? strtolower(str_replace(' ', '_', $assignmentName));
    }
    
    /**
     * Get assignment statistics for a specific context
     */
    public function getAssignmentStats($subjectId, $classLevel, $termId, $sessionId) {
        $questionsCount = $this->getQuestionsCountByAssignment($subjectId, $classLevel, $termId, $sessionId);
        $testCodesCount = $this->getTestCodesCountByType($subjectId, $classLevel, $termId, $sessionId);
        
        $stats = [];
        foreach ($this->testAssignments as $name => $assignment) {
            $stats[$name] = [
                'assignment' => $assignment,
                'questions_count' => $questionsCount[$name] ?? 0,
                'test_codes_count' => $testCodesCount[$name] ?? 0
            ];
        }
        
        return $stats;
    }
    
    /**
     * Get available assignments for a specific context (has questions)
     */
    public function getAvailableAssignments($subjectId, $classLevel, $termId, $sessionId) {
        $questionsCount = $this->getQuestionsCountByAssignment($subjectId, $classLevel, $termId, $sessionId);
        
        $available = [];
        foreach ($this->testAssignments as $name => $assignment) {
            if (($questionsCount[$name] ?? 0) > 0) {
                $available[$name] = $assignment;
            }
        }
        
        return $available;
    }
    
    /**
     * Validate assignment for test creation
     */
    public function validateAssignmentForTest($assignmentName, $subjectId, $classLevel, $termId, $sessionId, $requiredQuestions = 1) {
        if (!$this->isValidAssignment($assignmentName)) {
            return [
                'valid' => false,
                'message' => 'Invalid assignment type'
            ];
        }
        
        $questionsCount = $this->getQuestionsCountByAssignment($subjectId, $classLevel, $termId, $sessionId);
        $availableQuestions = $questionsCount[$assignmentName] ?? 0;
        
        if ($availableQuestions < $requiredQuestions) {
            return [
                'valid' => false,
                'message' => "Not enough questions for {$assignmentName}. Available: {$availableQuestions}, Required: {$requiredQuestions}"
            ];
        }
        
        return [
            'valid' => true,
            'available_questions' => $availableQuestions
        ];
    }
    
    /**
     * Clear cache
     */
    public function clearCache() {
        $this->cache = [];
    }
}

?>