
<?php

require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/ConstantsService.php';

/**
 * Results Service
 * Manages test results operations for students
 */
class ResultsService extends BaseService {
    private static $instance = null;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get all results for a student
     */
    public function getStudentResults($studentId, $limit = null) {
        $sql = "
            SELECT 
                tr.id,
                tr.score,
                tr.total_questions,
                tr.time_taken,
                tr.submitted_at,
                tc.code,
                tc.title,
                tc.score_per_question,
                s.name as subject,
                tc.class_level,
                tc.duration_minutes,
                tc.test_type
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            LEFT JOIN subjects s ON tc.subject_id = s.id
            WHERE tr.student_id = ?
            ORDER BY tr.submitted_at DESC
        ";
        
        $params = [$studentId];
        
        if ($limit) {
            $sql .= " LIMIT " . (int)$limit;
        }
        
        $stmt = $this->executeQuery($sql, $params);
        return $stmt ? $stmt->fetchAll() : [];
    }
    
    /**
     * Get results for a specific test
     */
    public function getTestResults($testCodeId, $studentId = null) {
        $sql = "
            SELECT 
                tr.id,
                tr.score,
                tr.total_questions,
                tr.time_taken,
                tr.submitted_at,
                u.full_name as student_name,
                u.reg_number,
                tc.code,
                tc.title,
                tc.score_per_question,
                s.name as subject,
                tc.class_level
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            JOIN users u ON tr.student_id = u.id
            LEFT JOIN subjects s ON tc.subject_id = s.id
            WHERE tr.test_code_id = ?
        ";
        
        $params = [$testCodeId];
        
        if ($studentId) {
            $sql .= " AND tr.student_id = ?";
            $params[] = $studentId;
        }
        
        $sql .= " ORDER BY tr.submitted_at DESC";
        
        $stmt = $this->executeQuery($sql, $params);
        return $stmt ? $stmt->fetchAll() : [];
    }
    
    /**
     * Get student's recent results (last 5)
     */
    public function getRecentResults($studentId, $limit = 5) {
        return $this->getStudentResults($studentId, $limit);
    }
    
    /**
     * Get results by subject for a student
     */
    public function getResultsBySubject($studentId, $subjectId) {
        $sql = "
            SELECT 
                tr.id,
                tr.score,
                tr.total_questions,
                tr.time_taken,
                tr.submitted_at,
                tc.code,
                tc.title,
                tc.score_per_question,
                tc.test_type,
                tc.class_level
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            WHERE tr.student_id = ? AND tc.subject_id = ?
            ORDER BY tr.submitted_at DESC
        ";
        
        $stmt = $this->executeQuery($sql, [$studentId, $subjectId]);
        return $stmt ? $stmt->fetchAll() : [];
    }
    
    /**
     * Get results by class level for a student
     */
    public function getResultsByClass($studentId, $classLevel) {
        $sql = "
            SELECT 
                tr.id,
                tr.score,
                tr.total_questions,
                tr.time_taken,
                tr.submitted_at,
                tc.code,
                tc.title,
                tc.score_per_question,
                s.name as subject,
                tc.test_type
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            LEFT JOIN subjects s ON tc.subject_id = s.id
            WHERE tr.student_id = ? AND tc.class_level = ?
            ORDER BY tr.submitted_at DESC
        ";
        
        $stmt = $this->executeQuery($sql, [$studentId, $classLevel]);
        return $stmt ? $stmt->fetchAll() : [];
    }
    
    /**
     * Get results summary for a student
     */
    public function getResultsSummary($studentId) {
        $sql = "
            SELECT 
                COUNT(*) as total_tests,
                AVG(CAST(tr.score AS DECIMAL) / CAST(tc.score_per_question AS DECIMAL) / CAST(tr.total_questions AS DECIMAL) * 100) as average_percentage,
                MAX(CAST(tr.score AS DECIMAL) / CAST(tc.score_per_question AS DECIMAL) / CAST(tr.total_questions AS DECIMAL) * 100) as best_percentage,
                MIN(CAST(tr.score AS DECIMAL) / CAST(tc.score_per_question AS DECIMAL) / CAST(tr.total_questions AS DECIMAL) * 100) as lowest_percentage
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            WHERE tr.student_id = ? AND tr.total_questions > 0
        ";
        
        $stmt = $this->executeQuery($sql, [$studentId]);
        $result = $stmt ? $stmt->fetch() : false;
        
        if ($result) {
            $result['average_percentage'] = round($result['average_percentage'], 2);
            $result['best_percentage'] = round($result['best_percentage'], 2);
            $result['lowest_percentage'] = round($result['lowest_percentage'], 2);
        }
        
        return $result;
    }
    
    /**
     * Check if student has taken a specific test
     */
    public function hasStudentTakenTest($studentId, $testCodeId) {
        $sql = "SELECT id FROM test_results WHERE student_id = ? AND test_code_id = ?";
        $stmt = $this->executeQuery($sql, [$studentId, $testCodeId]);
        return $stmt && $stmt->fetch() !== false;
    }
    
    /**
     * Get detailed result with answers
     */
    public function getDetailedResult($resultId, $studentId = null) {
        $sql = "
            SELECT 
                tr.id,
                tr.score,
                tr.total_questions,
                tr.time_taken,
                tr.submitted_at,
                tc.code,
                tc.title,
                tc.score_per_question,
                s.name as subject,
                tc.class_level,
                tc.test_type
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            LEFT JOIN subjects s ON tc.subject_id = s.id
            WHERE tr.id = ?
        ";
        
        $params = [$resultId];
        
        if ($studentId) {
            $sql .= " AND tr.student_id = ?";
            $params[] = $studentId;
        }
        
        $stmt = $this->executeQuery($sql, $params);
        $result = $stmt ? $stmt->fetch() : false;
        
        if ($result) {
            // Get answers for this result
            $answersSql = "
                SELECT 
                    ta.question_id,
                    ta.selected_answer,
                    ta.is_correct,
                    q.question_text,
                    q.correct_answer,
                    q.option_a,
                    q.option_b,
                    q.option_c,
                    q.option_d
                FROM test_answers ta
                JOIN questions q ON ta.question_id = q.id
                WHERE ta.result_id = ?
                ORDER BY q.id
            ";
            
            $answersStmt = $this->executeQuery($answersSql, [$resultId]);
            $result['answers'] = $answersStmt ? $answersStmt->fetchAll() : [];
        }
        
        return $result;
    }
    
    /**
     * Delete a result (admin only)
     */
    public function deleteResult($resultId) {
        try {
            $this->db->beginTransaction();
            
            // Delete answers first
            $this->executeQuery("DELETE FROM test_answers WHERE result_id = ?", [$resultId]);
            
            // Delete result
            $deleted = $this->delete('test_results', $resultId);
            
            $this->db->commit();
            return $deleted;
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Delete result error: " . $e->getMessage());
            return false;
        }
    }
}

?>
