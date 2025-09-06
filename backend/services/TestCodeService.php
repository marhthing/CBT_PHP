<?php

require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/QuestionService.php';
require_once __DIR__ . '/AssignmentService.php';

/**
 * Test Code Service
 * Manages all test code operations
 */
class TestCodeService extends BaseService {
    private static $instance = null;
    private $cache = [];
    private $questionService;
    private $assignmentService;

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        parent::__construct();
        $this->questionService = QuestionService::getInstance();
        $this->assignmentService = AssignmentService::getInstance();
    }

    /**
     * Get test codes with filtering and pagination
     */
    public function getTestCodes($filters = [], $limit = 50, $offset = 0) {
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

        if (!empty($filters['created_by'])) {
            $whereConditions[] = 'tc.created_by = ?';
            $params[] = $filters['created_by'];
        }

        if (isset($filters['is_active'])) {
            $whereConditions[] = 'tc.is_active = ?';
            $params[] = $filters['is_active'] ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse();
        }

        if (isset($filters['is_activated'])) {
            $whereConditions[] = 'tc.is_activated = ?';
            $params[] = $filters['is_activated'] ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse();
        }

        if (isset($filters['is_used'])) {
            $whereConditions[] = 'tc.is_used = ?';
            $params[] = $filters['is_used'] ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse();
        }

        if (!empty($filters['test_type'])) {
            $whereConditions[] = 'tc.test_type = ?';
            $params[] = $filters['test_type'];
        }

        if (!empty($filters['batch_id'])) {
            $whereConditions[] = 'tc.batch_id = ?';
            $params[] = $filters['batch_id'];
        }

        if (!empty($filters['search'])) {
            $searchTerm = "%{$filters['search']}%";
            $whereConditions[] = '(tc.code LIKE ? OR tc.title LIKE ? OR tc.description LIKE ?)';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = implode(' AND ', $whereConditions);

        $sql = "
            SELECT 
                tc.*,
                s.name as subject_name,
                s.code as subject_code,
                t.name as term_name,
                sess.name as session_name,
                u.full_name as created_by_name,
                used_by_user.full_name as used_by_name,
                (SELECT COUNT(*) FROM test_results tr WHERE tr.test_code_id = tc.id) as times_taken
            FROM test_codes tc
            JOIN subjects s ON tc.subject_id = s.id
            JOIN terms t ON tc.term_id = t.id
            JOIN sessions sess ON tc.session_id = sess.id
            JOIN users u ON tc.created_by = u.id
            LEFT JOIN users used_by_user ON tc.used_by = used_by_user.id
            WHERE {$whereClause}
            ORDER BY tc.created_at DESC
        ";

        // Use database-specific LIMIT syntax
        $fullQuery = $this->database->limitQuery($sql, $limit, $offset);
        $stmt = $this->executeQuery($fullQuery, $params);

        return $stmt ? $stmt->fetchAll() : [];
    }

    /**
     * Count test codes with filters
     */
    public function countTestCodes($filters = []) {
        $whereConditions = ['1=1'];
        $params = [];

        // Apply same filters as getTestCodes
        if (!empty($filters['subject_id'])) {
            $whereConditions[] = 'subject_id = ?';
            $params[] = $filters['subject_id'];
        }

        if (!empty($filters['class_level'])) {
            $whereConditions[] = 'class_level = ?';
            $params[] = $filters['class_level'];
        }

        if (!empty($filters['term_id'])) {
            $whereConditions[] = 'term_id = ?';
            $params[] = $filters['term_id'];
        }

        if (!empty($filters['session_id'])) {
            $whereConditions[] = 'session_id = ?';
            $params[] = $filters['session_id'];
        }

        if (!empty($filters['created_by'])) {
            $whereConditions[] = 'created_by = ?';
            $params[] = $filters['created_by'];
        }

        if (isset($filters['is_active'])) {
            $whereConditions[] = 'is_active = ?';
            $params[] = $filters['is_active'] ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse();
        }

        if (isset($filters['is_activated'])) {
            $whereConditions[] = 'is_activated = ?';
            $params[] = $filters['is_activated'] ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse();
        }

        if (isset($filters['is_used'])) {
            $whereConditions[] = 'is_used = ?';
            $params[] = $filters['is_used'] ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse();
        }

        if (!empty($filters['test_type'])) {
            $whereConditions[] = 'test_type = ?';
            $params[] = $filters['test_type'];
        }

        if (!empty($filters['batch_id'])) {
            $whereConditions[] = 'batch_id = ?';
            $params[] = $filters['batch_id'];
        }

        if (!empty($filters['search'])) {
            $searchTerm = "%{$filters['search']}%";
            $whereConditions[] = '(code LIKE ? OR title LIKE ? OR description LIKE ?)';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = implode(' AND ', $whereConditions);

        $sql = "SELECT COUNT(*) as count FROM test_codes WHERE {$whereClause}";
        $stmt = $this->executeQuery($sql, $params);
        $result = $stmt ? $stmt->fetch() : false;

        return $result ? (int)$result['count'] : 0;
    }

    /**
     * Create single test code
     */
    public function createTestCode($data, $createdBy) {
        // Validate required fields
        $requiredFields = ['title', 'subject_id', 'class_level', 'term_id', 'session_id', 
                          'duration_minutes', 'total_questions'];

        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return ['success' => false, 'message' => "Field {$field} is required"];
            }
        }

        // Generate unique test code
        $code = $this->generateUniqueCode();

        // Validate test type/assignment
        $testType = $data['test_type'] ?? 'first_ca';
        $assignment = $this->assignmentService->mapTestTypeToAssignment($testType);

        // Check if enough questions exist using the same logic as frontend
        $availableQuestions = $this->questionService->countQuestions([
            'subject_id' => $data['subject_id'],
            'class_level' => $data['class_level'],
            'term_id' => $data['term_id'],
            'test_type' => $testType  // Use test_type instead of question_assignment
        ]);

        error_log("Question count check: Need {$data['total_questions']}, found {$availableQuestions}");
        error_log("Filters used: " . json_encode([
            'subject_id' => $data['subject_id'],
            'class_level' => $data['class_level'],
            'term_id' => $data['term_id'],
            'test_type' => $testType
        ]));
        
        if ($availableQuestions < $data['total_questions']) {
            return [
                'success' => false, 
                'message' => "Not enough questions available. Need {$data['total_questions']}, found {$availableQuestions}"
            ];
        }

        // Handle boolean values properly for database compatibility
        $isActive = false;
        if (isset($data['is_active'])) {
            if (is_bool($data['is_active'])) {
                $isActive = $data['is_active'];
            } elseif (is_string($data['is_active'])) {
                $isActive = in_array(strtolower($data['is_active']), ['true', '1', 'yes', 'on']);
            } else {
                $isActive = !empty($data['is_active']);
            }
        }

        $testCodeData = [
            'code' => $code,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'subject_id' => $data['subject_id'],
            'class_level' => $data['class_level'],
            'term_id' => $data['term_id'],
            'session_id' => $data['session_id'],
            'duration_minutes' => $data['duration_minutes'],
            'total_questions' => $data['total_questions'],
            'pass_score' => $data['pass_score'] ?? 50,
            'test_type' => $testType,
            'score_per_question' => $data['score_per_question'] ?? 1,
            'is_active' => $isActive ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse(),
            'is_activated' => $this->database->getBooleanFalse(),
            'is_used' => $this->database->getBooleanFalse(),
            'created_by' => $createdBy,
            'batch_id' => $data['batch_id'] ?? null,
            'expires_at' => !empty($data['expires_at']) ? $data['expires_at'] : null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];

        $id = $this->insert('test_codes', $testCodeData);
        if ($id) {
            $this->clearCache();
            return [
                'success' => true, 
                'id' => $id, 
                'code' => $code,
                'available_questions' => $availableQuestions
            ];
        }

        return ['success' => false, 'message' => 'Failed to create test code'];
    }

    /**
     * Bulk create test codes
     */
    public function bulkCreateTestCodes($input, $count, $created_by) {
        error_log("TestCodeService::bulkCreateTestCodes called with count: $count, created_by: $created_by");
        error_log("Input data: " . json_encode($input));

        $created_codes = [];
        $errors = [];
        $batch_id = uniqid('batch_', true);

        error_log("Generated batch_id: $batch_id");

        try {
            // Generate batch ID - keep it short and simple (max 20 chars for database)
            $batchId = 'B' . date('md') . '_' . substr(uniqid(), -8); // B0906_12345678 format (14 chars max)
            error_log("Generated batch_id for actual creation: $batchId");

            for ($i = 0; $i < $count; $i++) {
                $codeData = $input;
                $codeData['batch_id'] = $batchId;

                // Fix: Use correct parameter name
                $result = $this->createTestCode($codeData, $created_by);
                if ($result['success']) {
                    $created_codes[] = [
                        'id' => $result['id'],
                        'code' => $result['code']
                    ];
                } else {
                    $errors[] = "Code " . ($i + 1) . ": " . $result['message'];
                }
            }
        } catch (Exception $e) {
            error_log("Exception in bulkCreateTestCodes: " . $e->getMessage());
            $errors[] = "An unexpected error occurred during bulk creation: " . $e->getMessage();
        }

        return [
            'success' => count($created_codes) > 0,
            'batch_id' => $batchId,
            'created' => $created_codes,
            'total_requested' => $count,
            'total_created' => count($created_codes),
            'errors' => $errors
        ];
    }

    /**
     * Update test code
     */
    public function updateTestCode($id, $data) {
        $testCode = $this->getById('test_codes', $id);
        if (!$testCode) {
            return ['success' => false, 'message' => 'Test code not found'];
        }

        $updateData = [];
        $allowedFields = ['title', 'description', 'duration_minutes', 'total_questions', 
                         'pass_score', 'is_active', 'expires_at', 'score_per_question'];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                // Handle boolean fields properly
                if ($field === 'is_active') {
                    if (is_bool($data[$field])) {
                        $updateData[$field] = $data[$field] ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse();
                    } elseif (is_string($data[$field])) {
                        $isActive = in_array(strtolower($data[$field]), ['true', '1', 'yes', 'on']);
                        $updateData[$field] = $isActive ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse();
                    } else {
                        $updateData[$field] = !empty($data[$field]) ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse();
                    }
                } else {
                    $updateData[$field] = $data[$field];
                }
            }
        }

        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No valid fields to update'];
        }

        // Validate total_questions if updating
        if (isset($updateData['total_questions'])) {
            $assignment = $this->assignmentService->mapTestTypeToAssignment($testCode['test_type']);
            $availableQuestions = $this->questionService->countQuestions([
                'subject_id' => $testCode['subject_id'],
                'class_level' => $testCode['class_level'],
                'term_id' => $testCode['term_id'],
                'session_id' => $testCode['session_id'],
                'question_assignment' => $assignment
            ]);

            if ($availableQuestions < $updateData['total_questions']) {
                return [
                    'success' => false, 
                    'message' => "Not enough questions available. Need {$updateData['total_questions']}, found {$availableQuestions}"
                ];
            }
        }

        $updateData['updated_at'] = date('Y-m-d H:i:s');

        $success = $this->update('test_codes', $id, $updateData);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }

        return ['success' => false, 'message' => 'Failed to update test code'];
    }

    /**
     * Delete test code
     */
    public function deleteTestCode($id) {
        $testCode = $this->getById('test_codes', $id);
        if (!$testCode) {
            return ['success' => false, 'message' => 'Test code not found'];
        }

        // Check if test code has been used
        $hasResults = $this->count('test_results', ['test_code_id' => $id]) > 0;
        if ($hasResults) {
            return ['success' => false, 'message' => 'Cannot delete test code that has results'];
        }

        $success = $this->delete('test_codes', $id);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }

        return ['success' => false, 'message' => 'Failed to delete test code'];
    }

    /**
     * Activate/Deactivate test codes
     */
    public function toggleActivation($ids, $activate = true) {
        if (empty($ids)) {
            return ['success' => false, 'message' => 'No test codes specified'];
        }

        $updated = 0;
        $errors = [];

        foreach ($ids as $id) {
            $updateData = [
                'is_active' => $activate ? $this->database->getBooleanTrue() : $this->database->getBooleanFalse(),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            if ($activate) {
                $updateData['is_activated'] = $this->database->getBooleanTrue();
                $updateData['activated_at'] = date('Y-m-d H:i:s');
            }

            $success = $this->update('test_codes', $id, $updateData);
            if ($success) {
                $updated++;
            } else {
                $errors[] = "Failed to update test code ID: {$id}";
            }
        }

        if ($updated > 0) {
            $this->clearCache();
        }

        return [
            'success' => $updated > 0,
            'updated' => $updated,
            'total' => count($ids),
            'errors' => $errors,
            'action' => $activate ? 'activated' : 'deactivated'
        ];
    }

    /**
     * Validate test code for student use
     */
    public function validateTestCodeForStudent($code, $studentId) {
        // Get test code details
        $sql = "
            SELECT tc.*, s.name as subject_name, t.name as term_name, sess.name as session_name
            FROM test_codes tc
            JOIN subjects s ON tc.subject_id = s.id
            JOIN terms t ON tc.term_id = t.id
            JOIN sessions sess ON tc.session_id = sess.id
            WHERE tc.code = ?
        ";

        $stmt = $this->executeQuery($sql, [$code]);
        $testCode = $stmt ? $stmt->fetch() : false;

        if (!$testCode) {
            return ['valid' => false, 'message' => 'Invalid test code'];
        }

        // Check if test code is active
        if (!$testCode['is_active'] || !$testCode['is_activated']) {
            return ['valid' => false, 'message' => 'Test code is not active'];
        }

        // Check if expired
        if ($testCode['expires_at'] && strtotime($testCode['expires_at']) < time()) {
            return ['valid' => false, 'message' => 'Test code has expired'];
        }

        // Check if student already took this test
        $existingResult = $this->count('test_results', [
            'test_code_id' => $testCode['id'],
            'student_id' => $studentId
        ]);

        if ($existingResult > 0) {
            return ['valid' => false, 'message' => 'You have already taken this test'];
        }

        return [
            'valid' => true,
            'test_code' => $testCode
        ];
    }

    /**
     * Mark test code as used
     */
    public function markAsUsed($testCodeId, $studentId) {
        $updateData = [
            'is_used' => $this->database->getBooleanTrue(),
            'used_at' => date('Y-m-d H:i:s'),
            'used_by' => $studentId,
            'updated_at' => date('Y-m-d H:i:s')
        ];

        $success = $this->update('test_codes', $testCodeId, $updateData);
        if ($success) {
            $this->clearCache();
        }

        return $success;
    }

    /**
     * Generate unique test code
     */
    private function generateUniqueCode($length = 6) {
        // Ensure length doesn't exceed database limit (keep it simple and safe)
        $length = min($length, 6);
        $maxAttempts = 10;
        $attempts = 0;

        do {
            // Generate random code
            $code = '';
            $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            for ($i = 0; $i < $length; $i++) {
                $code .= $characters[mt_rand(0, strlen($characters) - 1)];
            }

            // Check if code exists
            $exists = $this->count('test_codes', ['code' => $code]) > 0;
            $attempts++;

        } while ($exists && $attempts < $maxAttempts);

        if ($exists) {
            // Simple fallback - use incremental codes
            $counter = 1;
            do {
                $code = 'TC' . str_pad($counter, 4, '0', STR_PAD_LEFT); // TC0001, TC0002, etc.
                $exists = $this->count('test_codes', ['code' => $code]) > 0;
                $counter++;
            } while ($exists && $counter < 10000); // Safety limit
        }

        return $code;
    }

    /**
     * Get batch statistics
     */
    public function getBatchStats($batchId) {
        $sql = "
            SELECT 
                COUNT(*) as total_codes,
                SUM(CASE WHEN is_active = " . $this->database->getBooleanTrue() . " THEN 1 ELSE 0 END) as active_codes,
                SUM(CASE WHEN is_used = " . $this->database->getBooleanTrue() . " THEN 1 ELSE 0 END) as used_codes,
                (SELECT COUNT(*) FROM test_results tr JOIN test_codes tc ON tr.test_code_id = tc.id WHERE tc.batch_id = ?) as total_attempts
            FROM test_codes
            WHERE batch_id = ?
        ";

        $stmt = $this->executeQuery($sql, [$batchId, $batchId]);
        return $stmt ? $stmt->fetch() : false;
    }

    /**
     * Validate test code availability for student
     */
    public function validateTestCodeAvailability($testCodeId, $studentId) {
        try {
            $testCode = $this->getById('test_codes', $testCodeId);

            if (!$testCode) {
                return ['success' => false, 'message' => 'Test code not found'];
            }

            // Check if test is active
            $isActive = $this->getBooleanValue($testCode['is_active']);
            if (!$isActive) {
                return ['success' => false, 'message' => 'Test is no longer available'];
            }

            // Check if test is activated
            $isActivated = $this->getBooleanValue($testCode['is_activated']);
            if (!$isActivated) {
                return ['success' => false, 'message' => 'Test code is not activated yet'];
            }

            // Check if test is expired
            if ($testCode['expires_at'] && strtotime($testCode['expires_at']) < time()) {
                return ['success' => false, 'message' => 'Test is no longer available'];
            }

            // Check status
            if ($testCode['status'] === 'used') {
                return ['success' => false, 'message' => 'This test code has already been used and is permanently deactivated'];
            }

            if ($testCode['status'] === 'using') {
                return ['success' => false, 'message' => 'This test code is currently being used by another student'];
            }

            // Check if student already took this specific test
            $sql = "SELECT id FROM test_results WHERE test_code_id = ? AND student_id = ?";
            $stmt = $this->executeQuery($sql, [$testCodeId, $studentId]);
            $existing = $stmt ? $stmt->fetch() : false;

            if ($existing) {
                return ['success' => false, 'message' => 'You have already taken this test'];
            }

            return ['success' => true, 'message' => 'Test code is available'];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Failed to validate test code availability'];
        }
    }

    /**
     * Check for duplicate test attempts (same subject, class, term, test type)
     */
    public function checkDuplicateTestAttempt($studentId, $subjectId, $classLevel, $termId, $testType) {
        try {
            $sql = "
                SELECT tr.id FROM test_results tr
                JOIN test_codes tc ON tr.test_code_id = tc.id
                WHERE tr.student_id = ? 
                AND tc.subject_id = ?
                AND tc.class_level = ?
                AND tc.term_id = ?
                AND tc.test_type = ?
            ";

            $stmt = $this->executeQuery($sql, [$studentId, $subjectId, $classLevel, $termId, $testType]);
            $existing = $stmt ? $stmt->fetch() : false;

            if ($existing) {
                return [
                    'success' => false, 
                    'message' => "You have already taken a {$testType} test for this subject, class, and term"
                ];
            }

            return ['success' => true, 'message' => 'No duplicate test found'];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Failed to check for duplicate tests'];
        }
    }

    /**
     * Mark test code as "using" state
     */
    public function markTestCodeAsUsing($testCodeId, $studentId) {
        try {
            $updateData = [
                'status' => 'using',
                'used_by' => $studentId,
                'used_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $updated = $this->update('test_codes', $testCodeId, $updateData, ['status' => 'active']);

            if ($updated) {
                $this->clearCache();
                return ['success' => true, 'message' => 'Test code marked as using'];
            } else {
                return ['success' => false, 'message' => 'Test code is no longer available'];
            }

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Failed to mark test code as using'];
        }
    }

    /**
     * Check if test has already been taken by student
     */
    public function checkTestAlreadyTaken($testCodeId, $studentId) {
        try {
            $sql = "SELECT id FROM test_results WHERE test_code_id = ? AND student_id = ?";
            $stmt = $this->executeQuery($sql, [$testCodeId, $studentId]);
            $existing = $stmt ? $stmt->fetch() : false;

            if ($existing) {
                return ['success' => false, 'message' => 'You have already completed this test'];
            }

            return ['success' => true, 'message' => 'Test not yet taken'];

        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Failed to check test status'];
        }
    }

    /**
     * Submit test with complete transaction management and scoring
     */
    public function submitTest($test, $studentId, $answers, $timeTaken) {
        $db = $this->database->getConnection();

        try {
            // Begin transaction
            error_log("About to begin database transaction");
            $this->db->beginTransaction();
            error_log("Database transaction started successfully");

            // Get shuffled answer mappings from session
            session_start();
            $session_key = 'answer_mappings_' . $test['id'] . '_' . $studentId;
            $answer_mappings = $_SESSION[$session_key] ?? null;

            if (!$answer_mappings) {
                // Fallback to original method if session data is missing
                $question_ids = array_keys($answers);
                $placeholders = implode(',', array_fill(0, count($question_ids), '?'));

                $sql = "SELECT id, correct_answer FROM questions WHERE id IN ($placeholders)";
                $stmt = $this->executeQuery($sql, $question_ids);
                $result = $stmt ? $stmt->fetchAll(PDO::FETCH_KEY_PAIR) : [];
                $answer_mappings = $result;
            }

            // Calculate score using score_per_question and shuffled answers
            $correct_count = 0;
            $total_questions = count($answers);
            $score_per_question = (int)$test['score_per_question'];

            foreach ($answers as $question_id => $student_answer) {
                if (isset($answer_mappings[$question_id]) && 
                    strtoupper($student_answer) === strtoupper($answer_mappings[$question_id])) {
                    $correct_count++;
                }
            }

            // Clean up session data after use
            if (isset($_SESSION[$session_key])) {
                unset($_SESSION[$session_key]);
            }

            $score = $correct_count * $score_per_question;

            // Insert test result
            $result_data = [
                'test_code_id' => $test['id'],
                'student_id' => $studentId,
                'score' => $score,
                'total_questions' => $total_questions,
                'time_taken' => $timeTaken,
                'submitted_at' => date('Y-m-d H:i:s')
            ];

            $result_id = $this->insert('test_results', $result_data);
            if (!$result_id) {
                throw new Exception('Failed to insert test result');
            }

            // Insert individual answers
            foreach ($answers as $question_id => $student_answer) {
                $is_correct = isset($answer_mappings[$question_id]) && 
                             strtoupper($student_answer) === strtoupper($answer_mappings[$question_id]);

                // Convert boolean to database compatible value
                $boolean_value = $is_correct ? 1 : 0;

                $answer_data = [
                    'result_id' => $result_id,
                    'question_id' => $question_id,
                    'selected_answer' => strtoupper($student_answer),
                    'is_correct' => $boolean_value
                ];

                $answer_id = $this->insert('test_answers', $answer_data);
                if (!$answer_id) {
                    throw new Exception('Failed to insert answer for question ' . $question_id);
                }
            }

            // Mark test code as used (permanently deactivated)
            $update_data = [
                'status' => 'used',
                'is_used' => $this->database->getBooleanTrue(),
                'used_at' => date('Y-m-d H:i:s'),
                'used_by' => $studentId,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $updated = $this->update('test_codes', $test['id'], $update_data);
            if (!$updated) {
                throw new Exception('Failed to mark test code as used');
            }

            $db->commit();
            $this->clearCache();

            // Calculate final statistics
            $max_possible_score = $total_questions * $score_per_question;
            $percentage = $max_possible_score > 0 ? round(($score / $max_possible_score) * 100, 2) : 0;

            return [
                'success' => true,
                'data' => [
                    'result_id' => $result_id,
                    'score' => $score,
                    'total_questions' => $total_questions,
                    'correct_answers' => $correct_count,
                    'score_per_question' => $score_per_question,
                    'max_possible_score' => $max_possible_score,
                    'percentage' => $percentage,
                    'time_taken' => $timeTaken,
                    'score_display' => "$score/$max_possible_score"
                ]
            ];

        } catch (Exception $e) {
            $db->rollback();
            error_log("Test submission error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Failed to submit test: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Helper method to get boolean value (handles MySQL/PostgreSQL differences)
     */
    private function getBooleanValue($value) {
        return ($value == 1 || $value === true || $value === 't');
    }

    /**
     * Clear cache
     */
    public function clearCache() {
        $this->cache = [];
    }
}

?>