<?php

require_once __DIR__ . '/BaseService.php';

/**
 * Statistics Service
 * Handles all dashboard and reporting statistics
 */
class StatsService extends BaseService {
    private static $instance = null;
    private $cache = [];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get admin dashboard statistics
     */
    public function getAdminDashboardStats() {
        $cacheKey = 'admin_dashboard_stats';
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }
        
        // Get database compatibility functions
        $interval7Days = $this->database->dateSubDays(7);
        $currentDate = $this->database->getCurrentDate();
        
        $sql = "
            SELECT 
                (SELECT COUNT(*) FROM questions) as total_questions,
                (SELECT COUNT(*) FROM test_codes) as total_test_codes,
                (SELECT COUNT(*) FROM test_codes WHERE is_active = " . $this->database->getBooleanTrue() . " AND is_activated = " . $this->database->getBooleanTrue() . ") as active_test_codes,
                (SELECT COUNT(*) FROM test_codes WHERE is_active = " . $this->database->getBooleanFalse() . " OR is_activated = " . $this->database->getBooleanFalse() . ") as inactive_test_codes,
                (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND is_active = " . $this->database->getBooleanTrue() . ") as total_teachers,
                (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_active = " . $this->database->getBooleanTrue() . ") as total_students,
                (SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = " . $this->database->getBooleanTrue() . ") as total_admins,
                (SELECT COUNT(*) FROM teacher_assignments) as total_assignments,
                (SELECT COUNT(*) FROM test_results WHERE submitted_at >= {$interval7Days}) as recent_tests,
                (SELECT COUNT(*) FROM test_results WHERE DATE(submitted_at) = {$currentDate}) as tests_today,
                (SELECT 
                    COALESCE(
                        ROUND(
                            AVG(
                                (" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100
                            ), 1
                        ), 
                        0
                    ) 
                    FROM test_results tr 
                    JOIN test_codes tc ON tr.test_code_id = tc.id 
                    WHERE tr.total_questions > 0
                ) as average_score
        ";
        
        $stmt = $this->executeQuery($sql);
        $stats = $stmt ? $stmt->fetch() : [];
        
        $this->cache[$cacheKey] = $stats;
        return $stats;
    }
    
    /**
     * Get teacher dashboard statistics
     */
    public function getTeacherDashboardStats($teacherId) {
        $cacheKey = "teacher_dashboard_stats_{$teacherId}";
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }
        
        $interval7Days = $this->database->dateSubDays(7);
        $currentDate = $this->database->getCurrentDate();
        
        $sql = "
            SELECT 
                (SELECT COUNT(*) FROM questions WHERE teacher_id = ?) as total_questions,
                (SELECT COUNT(*) FROM test_codes WHERE created_by = ?) as total_test_codes,
                (SELECT COUNT(*) FROM test_codes WHERE created_by = ? AND is_active = " . $this->database->getBooleanTrue() . ") as active_test_codes,
                (SELECT COUNT(*) FROM teacher_assignments WHERE teacher_id = ?) as total_assignments,
                (SELECT COUNT(*) FROM test_results tr 
                 JOIN test_codes tc ON tr.test_code_id = tc.id 
                 WHERE tc.created_by = ? AND tr.submitted_at >= {$interval7Days}) as recent_tests,
                (SELECT COUNT(*) FROM test_results tr 
                 JOIN test_codes tc ON tr.test_code_id = tc.id 
                 WHERE tc.created_by = ? AND DATE(tr.submitted_at) = {$currentDate}) as tests_today,
                (SELECT 
                    COALESCE(
                        ROUND(
                            AVG(
                                (" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100
                            ), 1
                        ), 
                        0
                    ) 
                    FROM test_results tr 
                    JOIN test_codes tc ON tr.test_code_id = tc.id 
                    WHERE tc.created_by = ? AND tr.total_questions > 0
                ) as average_score
        ";
        
        $params = array_fill(0, 7, $teacherId);
        $stmt = $this->executeQuery($sql, $params);
        $stats = $stmt ? $stmt->fetch() : [];
        
        $this->cache[$cacheKey] = $stats;
        return $stats;
    }
    
    /**
     * Get student dashboard statistics
     */
    public function getStudentDashboardStats($studentId) {
        $cacheKey = "student_dashboard_stats_{$studentId}";
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }
        
        $interval7Days = $this->database->dateSubDays(7);
        $currentDate = $this->database->getCurrentDate();
        
        $sql = "
            SELECT 
                (SELECT COUNT(*) FROM test_results WHERE student_id = ?) as total_tests_taken,
                (SELECT COUNT(*) FROM test_results WHERE student_id = ? AND submitted_at >= {$interval7Days}) as recent_tests,
                (SELECT COUNT(*) FROM test_results WHERE student_id = ? AND DATE(submitted_at) = {$currentDate}) as tests_today,
                (SELECT 
                    COALESCE(
                        ROUND(
                            AVG(
                                (" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100
                            ), 1
                        ), 
                        0
                    ) 
                    FROM test_results tr 
                    JOIN test_codes tc ON tr.test_code_id = tc.id 
                    WHERE tr.student_id = ? AND tr.total_questions > 0
                ) as average_score,
                (SELECT 
                    MAX(
                        (" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100
                    )
                    FROM test_results tr 
                    JOIN test_codes tc ON tr.test_code_id = tc.id 
                    WHERE tr.student_id = ? AND tr.total_questions > 0
                ) as best_score
        ";
        
        $params = array_fill(0, 5, $studentId);
        $stmt = $this->executeQuery($sql, $params);
        $stats = $stmt ? $stmt->fetch() : [];
        
        $this->cache[$cacheKey] = $stats;
        return $stats;
    }
    
    /**
     * Get test performance analytics
     */
    public function getTestPerformanceStats($filters = []) {
        $cacheKey = 'test_performance_' . md5(serialize($filters));
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }
        
        $whereConditions = ['1=1'];
        $params = [];
        
        // Apply filters
        if (!empty($filters['subject_id'])) {
            $whereConditions[] = 'tc.subject_id = ?';
            $params[] = $filters['subject_id'];
        }
        
        if (!empty($filters['class_level'])) {
            $whereConditions[] = 'tc.class_level = ?';
            $params[] = $filters['class_level'];
        }
        
        if (!empty($filters['term_id'])) {
            $whereConditions[] = 'tc.term_id = ?';
            $params[] = $filters['term_id'];
        }
        
        if (!empty($filters['session_id'])) {
            $whereConditions[] = 'tc.session_id = ?';
            $params[] = $filters['session_id'];
        }
        
        if (!empty($filters['teacher_id'])) {
            $whereConditions[] = 'tc.created_by = ?';
            $params[] = $filters['teacher_id'];
        }
        
        if (!empty($filters['test_type'])) {
            $whereConditions[] = 'tc.test_type = ?';
            $params[] = $filters['test_type'];
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        // Overall performance stats
        $sql = "
            SELECT 
                COUNT(*) as total_attempts,
                ROUND(AVG((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100), 2) as average_score,
                MAX((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100) as highest_score,
                MIN((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100) as lowest_score,
                ROUND(AVG(" . $this->database->castAsDecimal('tr.time_taken') . "), 2) as average_time_taken
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            WHERE {$whereClause}
        ";
        
        $stmt = $this->executeQuery($sql, $params);
        $overallStats = $stmt ? $stmt->fetch() : [];
        
        // Performance by subject
        $sql = "
            SELECT 
                s.name as subject_name,
                COUNT(*) as attempts,
                ROUND(AVG((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100), 2) as average_score
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            JOIN subjects s ON tc.subject_id = s.id
            WHERE {$whereClause}
            GROUP BY s.id, s.name
            ORDER BY average_score DESC
        ";
        
        $stmt = $this->executeQuery($sql, $params);
        $bySubject = $stmt ? $stmt->fetchAll() : [];
        
        // Performance by class level
        $sql = "
            SELECT 
                tc.class_level,
                COUNT(*) as attempts,
                ROUND(AVG((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100), 2) as average_score
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            WHERE {$whereClause}
            GROUP BY tc.class_level
            ORDER BY tc.class_level
        ";
        
        $stmt = $this->executeQuery($sql, $params);
        $byClass = $stmt ? $stmt->fetchAll() : [];
        
        // Performance by test type
        $sql = "
            SELECT 
                tc.test_type,
                COUNT(*) as attempts,
                ROUND(AVG((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100), 2) as average_score
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            WHERE {$whereClause}
            GROUP BY tc.test_type
            ORDER BY average_score DESC
        ";
        
        $stmt = $this->executeQuery($sql, $params);
        $byTestType = $stmt ? $stmt->fetchAll() : [];
        
        $result = [
            'overall' => $overallStats,
            'by_subject' => $bySubject,
            'by_class' => $byClass,
            'by_test_type' => $byTestType
        ];
        
        $this->cache[$cacheKey] = $result;
        return $result;
    }
    
    /**
     * Get recent activity timeline
     */
    public function getRecentActivity($limit = 20, $filters = []) {
        $cacheKey = 'recent_activity_' . $limit . '_' . md5(serialize($filters));
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }
        
        $whereConditions = ['1=1'];
        $params = [];
        
        // Apply filters
        if (!empty($filters['user_id'])) {
            $whereConditions[] = 'tr.student_id = ?';
            $params[] = $filters['user_id'];
        }
        
        if (!empty($filters['subject_id'])) {
            $whereConditions[] = 'tc.subject_id = ?';
            $params[] = $filters['subject_id'];
        }
        
        if (!empty($filters['days'])) {
            $whereConditions[] = 'tr.submitted_at >= ' . $this->database->dateSubDays($filters['days']);
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        $sql = "
            SELECT 
                tr.id,
                tr.score,
                tr.total_questions,
                tr.time_taken,
                tr.submitted_at,
                tc.title as test_title,
                tc.code as test_code,
                tc.test_type,
                tc.score_per_question,
                s.name as subject_name,
                u.full_name as student_name,
                u.reg_number as student_reg,
                ROUND((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100, 2) as percentage_score
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            JOIN subjects s ON tc.subject_id = s.id
            JOIN users u ON tr.student_id = u.id
            WHERE {$whereClause}
            ORDER BY tr.submitted_at DESC
        ";
        
        $fullQuery = $this->database->limitQuery($sql, $limit, 0);
        $stmt = $this->executeQuery($fullQuery, $params);
        $activity = $stmt ? $stmt->fetchAll() : [];
        
        $this->cache[$cacheKey] = $activity;
        return $activity;
    }
    
    /**
     * Get top performing students
     */
    public function getTopPerformers($limit = 10, $filters = []) {
        $cacheKey = 'top_performers_' . $limit . '_' . md5(serialize($filters));
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }
        
        $whereConditions = ['1=1'];
        $params = [];
        
        // Apply filters
        if (!empty($filters['subject_id'])) {
            $whereConditions[] = 'tc.subject_id = ?';
            $params[] = $filters['subject_id'];
        }
        
        if (!empty($filters['class_level'])) {
            $whereConditions[] = 'tc.class_level = ?';
            $params[] = $filters['class_level'];
        }
        
        if (!empty($filters['term_id'])) {
            $whereConditions[] = 'tc.term_id = ?';
            $params[] = $filters['term_id'];
        }
        
        if (!empty($filters['session_id'])) {
            $whereConditions[] = 'tc.session_id = ?';
            $params[] = $filters['session_id'];
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        $sql = "
            SELECT 
                u.full_name as student_name,
                u.reg_number as student_reg,
                COUNT(*) as tests_taken,
                ROUND(AVG((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100), 2) as average_score,
                MAX((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100) as best_score
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            JOIN users u ON tr.student_id = u.id
            WHERE {$whereClause}
            GROUP BY u.id, u.full_name, u.reg_number
            HAVING COUNT(*) >= 1
            ORDER BY average_score DESC, tests_taken DESC
        ";
        
        $fullQuery = $this->database->limitQuery($sql, $limit, 0);
        $stmt = $this->executeQuery($fullQuery, $params);
        $performers = $stmt ? $stmt->fetchAll() : [];
        
        $this->cache[$cacheKey] = $performers;
        return $performers;
    }
    
    /**
     * Get usage trends over time
     */
    public function getUsageTrends($days = 30, $filters = []) {
        $cacheKey = 'usage_trends_' . $days . '_' . md5(serialize($filters));
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }
        
        $whereConditions = ['tr.submitted_at >= ' . $this->database->dateSubDays($days)];
        $params = [];
        
        // Apply filters
        if (!empty($filters['subject_id'])) {
            $whereConditions[] = 'tc.subject_id = ?';
            $params[] = $filters['subject_id'];
        }
        
        if (!empty($filters['teacher_id'])) {
            $whereConditions[] = 'tc.created_by = ?';
            $params[] = $filters['teacher_id'];
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        $sql = "
            SELECT 
                DATE(tr.submitted_at) as test_date,
                COUNT(*) as tests_taken,
                COUNT(DISTINCT tr.student_id) as unique_students,
                ROUND(AVG((" . $this->database->castAsDecimal('tr.score') . " / " . $this->database->castAsDecimal('tc.score_per_question') . ") / " . $this->database->castAsDecimal('tr.total_questions') . " * 100), 2) as average_score
            FROM test_results tr
            JOIN test_codes tc ON tr.test_code_id = tc.id
            WHERE {$whereClause}
            GROUP BY DATE(tr.submitted_at)
            ORDER BY test_date DESC
        ";
        
        $stmt = $this->executeQuery($sql, $params);
        $trends = $stmt ? $stmt->fetchAll() : [];
        
        $this->cache[$cacheKey] = $trends;
        return $trends;
    }
    
    /**
     * Clear cache
     */
    public function clearCache() {
        $this->cache = [];
    }
    
    /**
     * Clear specific cache keys
     */
    public function clearCacheByPattern($pattern) {
        foreach (array_keys($this->cache) as $key) {
            if (strpos($key, $pattern) !== false) {
                unset($this->cache[$key]);
            }
        }
    }
}

?>