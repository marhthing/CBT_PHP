<?php

/**
 * Constants Service
 * Centralized location for all system constants and configuration values
 */
class ConstantsService {
    private static $instance = null;
    
    // Test/Assignment Types
    const TEST_TYPES = [
        'FIRST_CA' => 'First CA',
        'SECOND_CA' => 'Second CA', 
        'EXAMINATION' => 'Examination'
    ];
    
    // Assignment Configurations
    const ASSIGNMENTS = [
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
    
    // Question Types
    const QUESTION_TYPES = [
        'MULTIPLE_CHOICE' => 'multiple_choice',
        'TRUE_FALSE' => 'true_false'
    ];
    
    // Valid Answer Options
    const ANSWER_OPTIONS = ['A', 'B', 'C', 'D'];
    
    // Grading Scale
    const GRADING_SCALE = [
        ['min' => 90, 'grade' => 'A'],
        ['min' => 80, 'grade' => 'B'],
        ['min' => 70, 'grade' => 'C'],
        ['min' => 60, 'grade' => 'D'],
        ['min' => 0,  'grade' => 'F']
    ];
    
    // Difficulty Levels
    const DIFFICULTY_LEVELS = [
        ['id' => 'easy', 'name' => 'Easy'],
        ['id' => 'medium', 'name' => 'Medium'],
        ['id' => 'hard', 'name' => 'Hard']
    ];
    
    // Default Values
    const DEFAULTS = [
        'ASSIGNMENT_TYPE' => 'First CA',
        'QUESTION_TYPE' => 'multiple_choice',
        'DIFFICULTY' => 'medium'
    ];
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Get all test types
     */
    public function getTestTypes() {
        return self::TEST_TYPES;
    }
    
    /**
     * Get all assignments
     */
    public function getAssignments() {
        return self::ASSIGNMENTS;
    }
    
    /**
     * Get assignment by name
     */
    public function getAssignment($name) {
        return self::ASSIGNMENTS[$name] ?? null;
    }
    
    /**
     * Get valid question types
     */
    public function getQuestionTypes() {
        return self::QUESTION_TYPES;
    }
    
    /**
     * Get valid answer options
     */
    public function getAnswerOptions() {
        return self::ANSWER_OPTIONS;
    }
    
    /**
     * Calculate grade from percentage
     */
    public function calculateGrade($percentage) {
        foreach (self::GRADING_SCALE as $scale) {
            if ($percentage >= $scale['min']) {
                return $scale['grade'];
            }
        }
        return 'F';
    }
    
    /**
     * Get difficulty levels
     */
    public function getDifficultyLevels() {
        return self::DIFFICULTY_LEVELS;
    }
    
    /**
     * Get default values
     */
    public function getDefaults() {
        return self::DEFAULTS;
    }
    
    /**
     * Get default assignment type
     */
    public function getDefaultAssignmentType() {
        return self::DEFAULTS['ASSIGNMENT_TYPE'];
    }
    
    /**
     * Validate test type
     */
    public function isValidTestType($testType) {
        return in_array($testType, self::TEST_TYPES);
    }
    
    /**
     * Validate question type
     */
    public function isValidQuestionType($questionType) {
        return in_array($questionType, self::QUESTION_TYPES);
    }
    
    /**
     * Validate answer option
     */
    public function isValidAnswerOption($option) {
        return in_array($option, self::ANSWER_OPTIONS);
    }
}

?>