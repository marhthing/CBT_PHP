<?php

require_once __DIR__ . '/BaseService.php';
require_once __DIR__ . '/SubjectService.php';
require_once __DIR__ . '/AssignmentService.php';

/**
 * Question Service
 * Manages all question-related operations
 */
class QuestionService extends BaseService {
    private static $instance = null;
    private $cache = [];
    private $subjectService;
    private $assignmentService;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function __construct() {
        parent::__construct();
        $this->subjectService = SubjectService::getInstance();
        $this->assignmentService = AssignmentService::getInstance();
    }
    
    /**
     * Get questions with filtering and pagination
     */
    public function getQuestions($filters = [], $limit = 50, $offset = 0) {
        $whereConditions = ['1=1'];
        $params = [];
        
        // Apply filters
        if (!empty($filters['subject_id'])) {
            $whereConditions[] = 'q.subject_id = ?';
            $params[] = $filters['subject_id'];
        }
        
        if (!empty($filters['class_level'])) {
            $whereConditions[] = 'q.class_level = ?';
            $params[] = $filters['class_level'];
        }
        
        if (!empty($filters['term_id'])) {
            $whereConditions[] = 'q.term_id = ?';
            $params[] = $filters['term_id'];
        }
        
        if (!empty($filters['session_id'])) {
            $whereConditions[] = 'q.session_id = ?';
            $params[] = $filters['session_id'];
        }
        
        if (!empty($filters['teacher_id'])) {
            $whereConditions[] = 'q.teacher_id = ?';
            $params[] = $filters['teacher_id'];
        }
        
        if (!empty($filters['question_type'])) {
            $whereConditions[] = 'q.question_type = ?';
            $params[] = $filters['question_type'];
        }
        
        if (!empty($filters['question_assignment'])) {
            $whereConditions[] = 'q.question_assignment = ?';
            $params[] = $filters['question_assignment'];
        }
        
        if (!empty($filters['search'])) {
            $searchTerm = "%{$filters['search']}%";
            $whereConditions[] = '(q.question_text LIKE ? OR q.option_a LIKE ? OR q.option_b LIKE ?)';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        $sql = "
            SELECT 
                q.id,
                q.question_text,
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
                q.correct_answer,
                q.class_level,
                q.question_type,
                q.question_assignment,
                q.created_at,
                q.updated_at,
                s.name as subject_name,
                s.id as subject_id,
                u.full_name as created_by_name
            FROM questions q
            JOIN subjects s ON q.subject_id = s.id
            JOIN users u ON q.teacher_id = u.id
            WHERE {$whereClause}
            ORDER BY q.created_at DESC
        ";
        
        // Use database-specific LIMIT syntax
        $fullQuery = $this->database->limitQuery($sql, $limit, $offset);
        $stmt = $this->executeQuery($fullQuery, $params);
        
        return $stmt ? $stmt->fetchAll() : [];
    }
    
    /**
     * Count questions with filters
     */
    public function countQuestions($filters = []) {
        $whereConditions = ['1=1'];
        $params = [];
        
        // Apply same filters as getQuestions
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
        
        // Only filter by teacher_id if explicitly requested
        if (!empty($filters['teacher_id'])) {
            $whereConditions[] = 'teacher_id = ?';
            $params[] = $filters['teacher_id'];
        }
        
        if (!empty($filters['question_type'])) {
            $whereConditions[] = 'question_type = ?';
            $params[] = $filters['question_type'];
        }
        
        // Handle both question_assignment and test_type filters
        if (!empty($filters['question_assignment'])) {
            $whereConditions[] = 'question_assignment = ?';
            $params[] = $filters['question_assignment'];
        } elseif (!empty($filters['test_type'])) {
            // Special handling for Examination - it should include both First CA and Second CA questions
            if (strtolower($filters['test_type']) === 'examination') {
                $whereConditions[] = "(question_assignment = ? OR question_assignment = ?)";
                $params[] = 'First CA';
                $params[] = 'Second CA';
            } else {
                // Map test_type to question_assignment using AssignmentService
                $assignmentService = AssignmentService::getInstance();
                $assignment = $assignmentService->mapTestTypeToAssignment($filters['test_type']);
                if ($assignment) {
                    $whereConditions[] = 'question_assignment = ?';
                    $params[] = $assignment;
                }
            }
        }
        
        if (!empty($filters['assignment_types']) && is_array($filters['assignment_types'])) {
            // For multiple assignment types (e.g., Examination includes both First CA and Second CA)
            $placeholders = implode(',', array_fill(0, count($filters['assignment_types']), '?'));
            $whereConditions[] = "(COALESCE(question_assignment, 'First CA') IN ({$placeholders}))";
            $params = array_merge($params, $filters['assignment_types']);
        }
        
        if (!empty($filters['search'])) {
            $searchTerm = "%{$filters['search']}%";
            $whereConditions[] = '(question_text LIKE ? OR option_a LIKE ? OR option_b LIKE ?)';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        $sql = "SELECT COUNT(*) as count FROM questions WHERE {$whereClause}";
        $stmt = $this->executeQuery($sql, $params);
        $result = $stmt ? $stmt->fetch() : false;
        
        return $result ? (int)$result['count'] : 0;
    }
    
    /**
     * Get question statistics
     */
    public function getQuestionStats($filters = []) {
        $cacheKey = 'question_stats_' . md5(serialize($filters));
        if (isset($this->cache[$cacheKey])) {
            return $this->cache[$cacheKey];
        }
        
        $whereConditions = ['1=1'];
        $params = [];
        
        // Apply filters for stats
        if (!empty($filters['teacher_id'])) {
            $whereConditions[] = 'q.teacher_id = ?';
            $params[] = $filters['teacher_id'];
        }
        
        $whereClause = implode(' AND ', $whereConditions);
        
        // Get overall stats
        $sql = "
            SELECT 
                COUNT(*) as total_questions,
                COUNT(DISTINCT s.name) as subjects_count,
                COUNT(DISTINCT q.class_level) as class_levels_count,
                COUNT(DISTINCT q.question_type) as question_types_count
            FROM questions q
            JOIN subjects s ON q.subject_id = s.id
            WHERE {$whereClause}
        ";
        $stmt = $this->executeQuery($sql, $params);
        $stats = $stmt ? $stmt->fetch() : [];
        
        // Get questions by subject
        $sql = "
            SELECT s.name as subject_name, COUNT(*) as question_count
            FROM questions q
            JOIN subjects s ON q.subject_id = s.id
            WHERE {$whereClause}
            GROUP BY s.id, s.name
            ORDER BY question_count DESC
        ";
        $stmt = $this->executeQuery($sql, $params);
        $bySubject = $stmt ? $stmt->fetchAll() : [];
        
        // Get questions by class level
        $sql = "
            SELECT class_level, COUNT(*) as question_count
            FROM questions q
            WHERE {$whereClause}
            GROUP BY class_level
            ORDER BY class_level
        ";
        $stmt = $this->executeQuery($sql, $params);
        $byClass = $stmt ? $stmt->fetchAll() : [];
        
        // Get questions by type
        $sql = "
            SELECT question_type, COUNT(*) as question_count
            FROM questions q
            WHERE {$whereClause}
            GROUP BY question_type
            ORDER BY question_type
        ";
        $stmt = $this->executeQuery($sql, $params);
        $byType = $stmt ? $stmt->fetchAll() : [];
        
        // Get questions by assignment
        $sql = "
            SELECT question_assignment, COUNT(*) as question_count
            FROM questions q
            WHERE {$whereClause}
            GROUP BY question_assignment
            ORDER BY question_assignment
        ";
        $stmt = $this->executeQuery($sql, $params);
        $byAssignment = $stmt ? $stmt->fetchAll() : [];
        
        $result = [
            'stats' => $stats,
            'by_subject' => $bySubject,
            'by_class' => $byClass,
            'by_type' => $byType,
            'by_assignment' => $byAssignment
        ];
        
        $this->cache[$cacheKey] = $result;
        return $result;
    }
    
    /**
     * Create new question
     */
    public function createQuestion($data, $createdBy) {
        // Validate required fields
        $requiredFields = ['question_text', 'option_a', 'option_b', 'correct_answer', 
                          'subject_id', 'class_level', 'term_id', 'session_id'];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return ['success' => false, 'message' => "Field {$field} is required"];
            }
        }
        
        // Validate question type
        $questionType = $data['question_type'] ?? 'multiple_choice';
        $validTypes = ['multiple_choice', 'true_false'];
        if (!in_array($questionType, $validTypes)) {
            return ['success' => false, 'message' => 'Invalid question type'];
        }
        
        // Validate correct answer
        $validAnswers = $questionType === 'true_false' ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
        if (!in_array($data['correct_answer'], $validAnswers)) {
            return ['success' => false, 'message' => 'Invalid correct answer option'];
        }
        
        // Validate assignment
        $assignment = $data['question_assignment'] ?? 'First CA';
        if (!$this->assignmentService->isValidAssignment($assignment)) {
            return ['success' => false, 'message' => 'Invalid assignment type'];
        }
        
        $questionData = [
            'question_text' => $data['question_text'],
            'option_a' => $data['option_a'],
            'option_b' => $data['option_b'],
            'option_c' => $questionType === 'true_false' ? null : ($data['option_c'] ?? null),
            'option_d' => $questionType === 'true_false' ? null : ($data['option_d'] ?? null),
            'correct_answer' => $data['correct_answer'],
            'question_type' => $questionType,
            'subject_id' => $data['subject_id'],
            'class_level' => $data['class_level'],
            'term_id' => $data['term_id'],
            'session_id' => $data['session_id'],
            'teacher_id' => $createdBy,
            'question_assignment' => $assignment,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $id = $this->insert('questions', $questionData);
        if ($id) {
            $this->clearCache();
            return ['success' => true, 'id' => $id];
        }
        
        return ['success' => false, 'message' => 'Failed to create question'];
    }
    
    /**
     * Update question
     */
    public function updateQuestion($id, $data) {
        $question = $this->getById('questions', $id);
        if (!$question) {
            return ['success' => false, 'message' => 'Question not found'];
        }
        
        $updateData = [];
        $allowedFields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 
                         'correct_answer', 'question_type', 'question_assignment'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (empty($updateData)) {
            return ['success' => false, 'message' => 'No valid fields to update'];
        }
        
        // Validate question type if updating
        if (isset($updateData['question_type'])) {
            $validTypes = ['multiple_choice', 'true_false'];
            if (!in_array($updateData['question_type'], $validTypes)) {
                return ['success' => false, 'message' => 'Invalid question type'];
            }
            
            // Adjust options based on type
            if ($updateData['question_type'] === 'true_false') {
                $updateData['option_c'] = null;
                $updateData['option_d'] = null;
            }
        }
        
        // Validate correct answer if updating
        if (isset($updateData['correct_answer'])) {
            $questionType = $updateData['question_type'] ?? $question['question_type'];
            $validAnswers = $questionType === 'true_false' ? ['A', 'B'] : ['A', 'B', 'C', 'D'];
            if (!in_array($updateData['correct_answer'], $validAnswers)) {
                return ['success' => false, 'message' => 'Invalid correct answer option'];
            }
        }
        
        // Validate assignment if updating
        if (isset($updateData['question_assignment'])) {
            if (!$this->assignmentService->isValidAssignment($updateData['question_assignment'])) {
                return ['success' => false, 'message' => 'Invalid assignment type'];
            }
        }
        
        $updateData['updated_at'] = date('Y-m-d H:i:s');
        
        $success = $this->update('questions', $id, $updateData);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to update question'];
    }
    
    /**
     * Delete question
     */
    public function deleteQuestion($id) {
        $question = $this->getById('questions', $id);
        if (!$question) {
            return ['success' => false, 'message' => 'Question not found'];
        }
        
        $success = $this->delete('questions', $id);
        if ($success) {
            $this->clearCache();
            return ['success' => true];
        }
        
        return ['success' => false, 'message' => 'Failed to delete question'];
    }
    
    /**
     * Get questions for test by criteria
     */
    public function getQuestionsForTest($subjectId, $classLevel, $termId, $sessionId, $assignment, $limit = 20, $shuffle = true) {
        $sql = "
            SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_type
            FROM questions 
            WHERE subject_id = ? AND class_level = ? AND term_id = ? AND session_id = ? AND question_assignment = ?
        ";
        
        if ($shuffle) {
            $sql .= " ORDER BY " . $this->database->getRandomOrder();
        } else {
            $sql .= " ORDER BY created_at DESC";
        }
        
        if ($limit > 0) {
            $sql = $this->database->limitQuery($sql, $limit, 0);
        }
        
        $stmt = $this->executeQuery($sql, [$subjectId, $classLevel, $termId, $sessionId, $assignment]);
        return $stmt ? $stmt->fetchAll() : [];
    }
    
    /**
     * Bulk create questions
     */
    public function bulkCreateQuestions($questions, $createdBy) {
        $created = 0;
        $errors = [];
        
        foreach ($questions as $index => $questionData) {
            $result = $this->createQuestion($questionData, $createdBy);
            if ($result['success']) {
                $created++;
            } else {
                $errors[] = "Row " . ($index + 1) . ": " . $result['message'];
            }
        }
        
        return [
            'success' => $created > 0,
            'created' => $created,
            'total' => count($questions),
            'errors' => $errors
        ];
    }
    
    /**
     * Get randomized questions for a test with shuffled options
     * For Examination tests, uses 5:1 ratio (Second CA : First CA)
     */
    public function getRandomizedQuestionsForTest($filters, $questionCount, $testId, $studentId) {
        try {
            // Build the base query
            $whereConditions = ['1=1'];
            $params = [];
            
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
            
            // Handle assignment types
            if (!empty($filters['assignment_types']) && is_array($filters['assignment_types'])) {
                // For multiple assignment types (e.g., Examination includes both First CA and Second CA)
                $placeholders = implode(',', array_fill(0, count($filters['assignment_types']), '?'));
                $whereConditions[] = "(COALESCE(question_assignment, 'First CA') IN ({$placeholders}))";
                $params = array_merge($params, $filters['assignment_types']);
            } elseif (!empty($filters['question_assignment'])) {
                $whereConditions[] = 'COALESCE(question_assignment, ?) = ?';
                $params[] = 'First CA';
                $params[] = $filters['question_assignment'];
            } elseif (!empty($filters['test_type'])) {
                // Special handling for Examination - it should include both First CA and Second CA questions
                if (strtolower($filters['test_type']) === 'examination') {
                    $whereConditions[] = "(COALESCE(question_assignment, 'First CA') IN (?, ?))";
                    $params[] = 'First CA';
                    $params[] = 'Second CA';
                } else {
                    // Map test_type to question_assignment using AssignmentService
                    $assignmentService = AssignmentService::getInstance();
                    $assignment = $assignmentService->mapTestTypeToAssignment($filters['test_type']);
                    if ($assignment) {
                        $whereConditions[] = 'COALESCE(question_assignment, ?) = ?';
                        $params[] = 'First CA';
                        $params[] = $assignment;
                    }
                }
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            // Handle Examination tests with 5:1 ratio (Second CA : First CA)
            if (!empty($filters['test_type']) && strtolower($filters['test_type']) === 'examination') {
                // Calculate questions needed: 5 Second CA : 1 First CA
                $firstCANeeded = ceil($questionCount / 6); // 1 part out of 6
                $secondCANeeded = $questionCount - $firstCANeeded; // 5 parts out of 6
                
                // Get First CA questions
                $firstCAFilters = array_merge($filters, ['question_assignment' => 'First CA']);
                unset($firstCAFilters['test_type']); // Remove test_type to use question_assignment
                
                $firstCAWhereConditions = ['1=1'];
                $firstCAParams = [];
                
                if (!empty($firstCAFilters['subject_id'])) {
                    $firstCAWhereConditions[] = 'subject_id = ?';
                    $firstCAParams[] = $firstCAFilters['subject_id'];
                }
                if (!empty($firstCAFilters['class_level'])) {
                    $firstCAWhereConditions[] = 'class_level = ?';
                    $firstCAParams[] = $firstCAFilters['class_level'];
                }
                if (!empty($firstCAFilters['term_id'])) {
                    $firstCAWhereConditions[] = 'term_id = ?';
                    $firstCAParams[] = $firstCAFilters['term_id'];
                }
                $firstCAWhereConditions[] = 'question_assignment = ?';
                $firstCAParams[] = 'First CA';
                
                $firstCASql = "
                    SELECT id, question_text, option_a, option_b, option_c, option_d, question_type, correct_answer
                    FROM questions 
                    WHERE " . implode(' AND ', $firstCAWhereConditions) . "
                    ORDER BY " . $this->database->getRandomOrder() . "
                ";
                $firstCASql = $this->database->limitQuery($firstCASql, $firstCANeeded, 0);
                $firstCAStmt = $this->executeQuery($firstCASql, $firstCAParams);
                $firstCAQuestions = $firstCAStmt ? $firstCAStmt->fetchAll() : [];
                
                // Get Second CA questions
                $secondCAFilters = array_merge($filters, ['question_assignment' => 'Second CA']);
                unset($secondCAFilters['test_type']); // Remove test_type to use question_assignment
                
                $secondCAWhereConditions = ['1=1'];
                $secondCAParams = [];
                
                if (!empty($secondCAFilters['subject_id'])) {
                    $secondCAWhereConditions[] = 'subject_id = ?';
                    $secondCAParams[] = $secondCAFilters['subject_id'];
                }
                if (!empty($secondCAFilters['class_level'])) {
                    $secondCAWhereConditions[] = 'class_level = ?';
                    $secondCAParams[] = $secondCAFilters['class_level'];
                }
                if (!empty($secondCAFilters['term_id'])) {
                    $secondCAWhereConditions[] = 'term_id = ?';
                    $secondCAParams[] = $secondCAFilters['term_id'];
                }
                $secondCAWhereConditions[] = 'question_assignment = ?';
                $secondCAParams[] = 'Second CA';
                
                $secondCASql = "
                    SELECT id, question_text, option_a, option_b, option_c, option_d, question_type, correct_answer
                    FROM questions 
                    WHERE " . implode(' AND ', $secondCAWhereConditions) . "
                    ORDER BY " . $this->database->getRandomOrder() . "
                ";
                $secondCASql = $this->database->limitQuery($secondCASql, $secondCANeeded, 0);
                $secondCAStmt = $this->executeQuery($secondCASql, $secondCAParams);
                $secondCAQuestions = $secondCAStmt ? $secondCAStmt->fetchAll() : [];
                
                // Combine questions
                $raw_questions = array_merge($firstCAQuestions, $secondCAQuestions);
                
                // Shuffle the combined questions
                shuffle($raw_questions);
                
                // Check if we have enough questions
                if (count($firstCAQuestions) < $firstCANeeded || count($secondCAQuestions) < $secondCANeeded) {
                    return [
                        'success' => false,
                        'message' => "Insufficient questions for Examination. Need {$firstCANeeded} First CA + {$secondCANeeded} Second CA, found " . count($firstCAQuestions) . " First CA + " . count($secondCAQuestions) . " Second CA"
                    ];
                }
                
            } else {
                // Regular question selection for non-Examination tests
                $sql = "
                    SELECT id, question_text, option_a, option_b, option_c, option_d, question_type, correct_answer
                    FROM questions 
                    WHERE {$whereClause}
                    ORDER BY " . $this->database->getRandomOrder() . "
                ";
                
                // Add database-specific randomization and limit
                $sql = $this->database->limitQuery($sql, $questionCount, 0);
                
                $stmt = $this->executeQuery($sql, $params);
                $raw_questions = $stmt ? $stmt->fetchAll() : [];
                
                if (count($raw_questions) < $questionCount) {
                    return [
                        'success' => false,
                        'message' => "Insufficient questions available for this test. Found " . count($raw_questions) . " questions, but test requires {$questionCount} questions."
                    ];
                }
            }
            
            // Shuffle options for each question and create answer mapping
            $questions = [];
            $answer_mappings = [];
            
            foreach ($raw_questions as $question) {
                $shuffled_result = $this->shuffleQuestionOptions($question);
                
                // Store the answer mapping for this question (for submission validation)
                $answer_mappings[$question['id']] = $shuffled_result['correct_answer'];
                
                // Add processed question to final array
                $questions[] = [
                    'id' => $question['id'],
                    'question_text' => $question['question_text'],
                    'option_a' => $shuffled_result['options']['A'],
                    'option_b' => $shuffled_result['options']['B'],
                    'option_c' => $shuffled_result['options']['C'], 
                    'option_d' => $shuffled_result['options']['D'],
                    'question_type' => $question['question_type']
                ];
            }
            
            return [
                'success' => true,
                'questions' => $questions,
                'answer_mappings' => $answer_mappings
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to get randomized questions: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Shuffle question options and return new mapping
     */
    private function shuffleQuestionOptions($question) {
        if ($question['question_type'] === 'true_false') {
            // For True/False questions, only shuffle A and B options
            $original_options = [
                'A' => $question['option_a'],
                'B' => $question['option_b']
            ];

            // Get the values and shuffle them
            $option_values = array_values($original_options);
            shuffle($option_values);

            // Create new shuffled mapping for True/False
            $shuffled_options = [
                'A' => $option_values[0],
                'B' => $option_values[1],
                'C' => null,
                'D' => null
            ];

            // Find where the correct answer ended up after shuffling
            $original_correct_answer = $question['correct_answer'];
            $original_correct_text = $original_options[$original_correct_answer];

            $new_correct_answer = 'A';
            foreach ($shuffled_options as $new_key => $text) {
                if ($text === $original_correct_text) {
                    $new_correct_answer = $new_key;
                    break;
                }
            }
        } else {
            // For multiple choice questions, shuffle all four options
            $original_options = [
                'A' => $question['option_a'],
                'B' => $question['option_b'], 
                'C' => $question['option_c'],
                'D' => $question['option_d']
            ];

            // Filter out empty options before shuffling
            $valid_options = array_filter($original_options, function($value) {
                return !empty(trim($value));
            });

            // Get the values and shuffle them
            $option_values = array_values($valid_options);
            shuffle($option_values);

            // Create new shuffled mapping, filling available slots
            $shuffled_options = [
                'A' => $option_values[0] ?? null,
                'B' => $option_values[1] ?? null,
                'C' => $option_values[2] ?? null,
                'D' => $option_values[3] ?? null
            ];

            // Find where the correct answer ended up after shuffling
            $original_correct_answer = $question['correct_answer'];
            $original_correct_text = $original_options[$original_correct_answer];

            $new_correct_answer = 'A';
            foreach ($shuffled_options as $new_key => $text) {
                if ($text === $original_correct_text) {
                    $new_correct_answer = $new_key;
                    break;
                }
            }
        }
        
        return [
            'options' => $shuffled_options,
            'correct_answer' => $new_correct_answer
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