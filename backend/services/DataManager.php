<?php

require_once __DIR__ . '/ClassService.php';
require_once __DIR__ . '/TermService.php';
require_once __DIR__ . '/SessionService.php';
require_once __DIR__ . '/SubjectService.php';
require_once __DIR__ . '/AssignmentService.php';
require_once __DIR__ . '/TeacherAssignmentService.php';

/**
 * Data Manager
 * Central access point for all data services
 * Use this class to access all data instead of calling individual services
 */
class DataManager {
    private static $instance = null;
    
    // Service instances
    private $classService;
    private $termService;
    private $sessionService;
    private $subjectService;
    private $assignmentService;
    private $teacherAssignmentService;
    
    private function __construct() {
        // Initialize all services
        $this->classService = ClassService::getInstance();
        $this->termService = TermService::getInstance();
        $this->sessionService = SessionService::getInstance();
        $this->subjectService = SubjectService::getInstance();
        $this->assignmentService = AssignmentService::getInstance();
        $this->teacherAssignmentService = TeacherAssignmentService::getInstance();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    // =================================================================
    // CLASS METHODS
    // =================================================================
    
    public function getAllClasses() {
        return $this->classService->getAllClasses();
    }
    
    public function getClassById($id) {
        return $this->classService->getClassById($id);
    }
    
    public function getClassName($id) {
        return $this->classService->getClassName($id);
    }
    
    public function getClassDisplayName($id) {
        return $this->classService->getClassDisplayName($id);
    }
    
    public function getClassOptions() {
        return $this->classService->getClassOptions();
    }
    
    public function getClassDisplayOptions() {
        return $this->classService->getClassDisplayOptions();
    }
    
    public function getSeniorClasses() {
        return $this->classService->getSeniorClasses();
    }
    
    public function getJuniorClasses() {
        return $this->classService->getJuniorClasses();
    }
    
    public function isValidClass($id) {
        return $this->classService->isValidClass($id);
    }
    
    public function isValidClassLevel($classLevel) {
        return $this->classService->isValidClassLevel($classLevel);
    }
    
    // =================================================================
    // TERM METHODS
    // =================================================================
    
    public function getAllTerms() {
        return $this->termService->getAllTerms();
    }
    
    public function getTermById($id) {
        return $this->termService->getTermById($id);
    }
    
    public function getTermName($id) {
        return $this->termService->getTermName($id);
    }
    
    public function getTermOptions() {
        return $this->termService->getTermOptions();
    }
    
    public function getCurrentTerm() {
        return $this->termService->getCurrentTerm();
    }
    
    public function getTermByName($name) {
        return $this->termService->getTermByName($name);
    }
    
    public function isValidTerm($id) {
        return $this->termService->isValidTerm($id);
    }
    
    // =================================================================
    // SESSION METHODS
    // =================================================================
    
    public function getAllSessions() {
        return $this->sessionService->getAllSessions();
    }
    
    public function getSessionById($id) {
        return $this->sessionService->getSessionById($id);
    }
    
    public function getSessionName($id) {
        return $this->sessionService->getSessionName($id);
    }
    
    public function getSessionOptions() {
        return $this->sessionService->getSessionOptions();
    }
    
    public function getCurrentSession() {
        return $this->sessionService->getCurrentSession();
    }
    
    public function getLatestSession() {
        return $this->sessionService->getLatestSession();
    }
    
    public function getSessionByName($name) {
        return $this->sessionService->getSessionByName($name);
    }
    
    public function isValidSession($id) {
        return $this->sessionService->isValidSession($id);
    }
    
    public function isDateInSession($sessionId, $date = null) {
        return $this->sessionService->isDateInSession($sessionId, $date);
    }
    
    // =================================================================
    // SUBJECT METHODS
    // =================================================================
    
    public function getAllSubjects() {
        return $this->subjectService->getAllSubjects();
    }
    
    public function getSubjectById($id) {
        return $this->subjectService->getSubjectById($id);
    }
    
    public function getSubjectName($id) {
        return $this->subjectService->getSubjectName($id);
    }
    
    public function getSubjectCode($id) {
        return $this->subjectService->getSubjectCode($id);
    }
    
    public function getSubjectOptions() {
        return $this->subjectService->getSubjectOptions();
    }
    
    public function getSubjectCodeOptions() {
        return $this->subjectService->getSubjectCodeOptions();
    }
    
    public function getSubjectByCode($code) {
        return $this->subjectService->getSubjectByCode($code);
    }
    
    public function getSubjectByName($name) {
        return $this->subjectService->getSubjectByName($name);
    }
    
    public function searchSubjects($query) {
        return $this->subjectService->searchSubjects($query);
    }
    
    public function isValidSubject($id) {
        return $this->subjectService->isValidSubject($id);
    }
    
    // =================================================================
    // ASSIGNMENT METHODS (Test Types: First CA, Second CA, Examination)
    // =================================================================
    
    public function getAllAssignments() {
        return $this->assignmentService->getAllAssignments();
    }
    
    public function getAssignmentByName($name) {
        return $this->assignmentService->getAssignmentByName($name);
    }
    
    public function getAssignmentDisplayName($name) {
        return $this->assignmentService->getAssignmentDisplayName($name);
    }
    
    public function getAssignmentCode($name) {
        return $this->assignmentService->getAssignmentCode($name);
    }
    
    public function isValidAssignment($name) {
        return $this->assignmentService->isValidAssignment($name);
    }
    
    public function getAssignmentOptions() {
        return $this->assignmentService->getAssignmentOptions();
    }
    
    public function getAssignmentCodeOptions() {
        return $this->assignmentService->getAssignmentCodeOptions();
    }
    
    public function getAssignmentsOrdered() {
        return $this->assignmentService->getAssignmentsOrdered();
    }
    
    public function getQuestionsCountByAssignment($subjectId = null, $classLevel = null, $termId = null, $sessionId = null) {
        return $this->assignmentService->getQuestionsCountByAssignment($subjectId, $classLevel, $termId, $sessionId);
    }
    
    public function getTestCodesCountByType($subjectId = null, $classLevel = null, $termId = null, $sessionId = null) {
        return $this->assignmentService->getTestCodesCountByType($subjectId, $classLevel, $termId, $sessionId);
    }
    
    public function getAssignmentStats($subjectId, $classLevel, $termId, $sessionId) {
        return $this->assignmentService->getAssignmentStats($subjectId, $classLevel, $termId, $sessionId);
    }
    
    public function getAvailableAssignments($subjectId, $classLevel, $termId, $sessionId) {
        return $this->assignmentService->getAvailableAssignments($subjectId, $classLevel, $termId, $sessionId);
    }
    
    public function validateAssignmentForTest($assignmentName, $subjectId, $classLevel, $termId, $sessionId, $requiredQuestions = 1) {
        return $this->assignmentService->validateAssignmentForTest($assignmentName, $subjectId, $classLevel, $termId, $sessionId, $requiredQuestions);
    }
    
    public function mapAssignmentToTestType($assignmentName) {
        return $this->assignmentService->mapAssignmentToTestType($assignmentName);
    }
    
    // =================================================================
    // TEACHER ASSIGNMENT METHODS (Which teacher teaches what)
    // =================================================================
    
    public function getAllTeacherAssignments() {
        return $this->teacherAssignmentService->getAllTeacherAssignments();
    }
    
    public function getTeacherAssignmentById($id) {
        return $this->teacherAssignmentService->getTeacherAssignmentById($id);
    }
    
    public function getAssignmentsByTeacher($teacherId) {
        return $this->teacherAssignmentService->getAssignmentsByTeacher($teacherId);
    }
    
    public function getAssignmentsBySubject($subjectId) {
        return $this->teacherAssignmentService->getAssignmentsBySubject($subjectId);
    }
    
    public function getAssignmentsByClass($classLevel) {
        return $this->teacherAssignmentService->getAssignmentsByClass($classLevel);
    }
    
    public function isTeacherAssigned($teacherId, $subjectId, $classLevel, $sessionId, $termId) {
        return $this->teacherAssignmentService->isTeacherAssigned($teacherId, $subjectId, $classLevel, $sessionId, $termId);
    }
    
    public function getTeacherSubjects($teacherId, $classLevel = null, $sessionId = null, $termId = null) {
        return $this->teacherAssignmentService->getTeacherSubjects($teacherId, $classLevel, $sessionId, $termId);
    }
    
    public function getTeacherClasses($teacherId, $subjectId = null, $sessionId = null, $termId = null) {
        return $this->teacherAssignmentService->getTeacherClasses($teacherId, $subjectId, $sessionId, $termId);
    }
    
    // =================================================================
    // UTILITY METHODS
    // =================================================================
    
    /**
     * Get all lookup data in one call for dropdowns/selects
     */
    public function getAllLookupData() {
        return [
            'classes' => $this->getAllClasses(),
            'terms' => $this->getAllTerms(),
            'sessions' => $this->getAllSessions(),
            'subjects' => $this->getAllSubjects(),
            'assignments' => $this->getAllAssignments(),
            'class_options' => $this->getClassOptions(),
            'term_options' => $this->getTermOptions(),
            'session_options' => $this->getSessionOptions(),
            'subject_options' => $this->getSubjectOptions(),
            'assignment_options' => $this->getAssignmentOptions(),
            'current_session' => $this->getCurrentSession(),
            'current_term' => $this->getCurrentTerm()
        ];
    }
    
    /**
     * Get dropdown options for forms
     */
    public function getFormOptions() {
        return [
            'classes' => $this->getClassDisplayOptions(),
            'terms' => $this->getTermOptions(),
            'sessions' => $this->getSessionOptions(),
            'subjects' => $this->getSubjectOptions(),
            'assignments' => $this->getAssignmentOptions()
        ];
    }
    
    /**
     * Validate a complete test context
     */
    public function validateTestContext($classLevel, $termId, $sessionId, $subjectId, $assignmentName = null) {
        $errors = [];
        
        if (!$this->isValidClassLevel($classLevel)) {
            $errors[] = 'Invalid class level';
        }
        
        if (!$this->isValidTerm($termId)) {
            $errors[] = 'Invalid term';
        }
        
        if (!$this->isValidSession($sessionId)) {
            $errors[] = 'Invalid session';
        }
        
        if (!$this->isValidSubject($subjectId)) {
            $errors[] = 'Invalid subject';
        }
        
        if ($assignmentName && !$this->isValidAssignment($assignmentName)) {
            $errors[] = 'Invalid assignment type';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    /**
     * Get formatted test context (for display purposes)
     */
    public function getTestContext($classLevel, $termId, $sessionId, $subjectId, $assignmentName = null) {
        $context = [
            'class_name' => $this->getClassDisplayName($classLevel),
            'term_name' => $this->getTermName($termId),
            'session_name' => $this->getSessionName($sessionId),
            'subject_name' => $this->getSubjectName($subjectId),
            'subject_code' => $this->getSubjectCode($subjectId)
        ];
        
        if ($assignmentName) {
            $context['assignment_name'] = $assignmentName;
            $context['assignment_display_name'] = $this->getAssignmentDisplayName($assignmentName);
            $context['assignment_code'] = $this->getAssignmentCode($assignmentName);
        }
        
        return $context;
    }
    
    /**
     * Clear all service caches
     */
    public function clearAllCaches() {
        $this->classService->clearCache();
        $this->termService->clearCache();
        $this->sessionService->clearCache();
        $this->subjectService->clearCache();
        $this->assignmentService->clearCache();
        $this->teacherAssignmentService->clearCache();
    }
    
    /**
     * Get service instance directly (for advanced usage)
     */
    public function getClassService() {
        return $this->classService;
    }
    
    public function getTermService() {
        return $this->termService;
    }
    
    public function getSessionService() {
        return $this->sessionService;
    }
    
    public function getSubjectService() {
        return $this->subjectService;
    }
    
    public function getAssignmentService() {
        return $this->assignmentService;
    }
    
    public function getTeacherAssignmentService() {
        return $this->teacherAssignmentService;
    }
}

?>