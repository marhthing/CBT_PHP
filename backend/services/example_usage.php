<?php

/**
 * Example Usage of Data Services
 * This file shows how to use the centralized data access layer
 * 
 * Usage Instructions:
 * 1. Include the DataManager in your PHP files
 * 2. Get the singleton instance
 * 3. Use the methods to access data
 */

// Include the DataManager (this is all you need to include)
require_once __DIR__ . '/DataManager.php';

// Example function showing how to use the DataManager
function exampleUsage() {
    // Get the DataManager instance (singleton pattern)
    $data = DataManager::getInstance();
    
    // =================================================================
    // BASIC DATA RETRIEVAL
    // =================================================================
    
    // Get all classes
    $classes = $data->getAllClasses();
    echo "All Classes:\n";
    foreach ($classes as $class) {
        echo "- {$class['name']} ({$class['display_name']})\n";
    }
    
    // Get all subjects
    $subjects = $data->getAllSubjects();
    echo "\nAll Subjects:\n";
    foreach ($subjects as $subject) {
        echo "- {$subject['name']} ({$subject['code']})\n";
    }
    
    // Get current session and term
    $currentSession = $data->getCurrentSession();
    $currentTerm = $data->getCurrentTerm();
    echo "\nCurrent Context:\n";
    echo "Session: " . ($currentSession ? $currentSession['name'] : 'None') . "\n";
    echo "Term: " . ($currentTerm ? $currentTerm['name'] : 'None') . "\n";
    
    // =================================================================
    // DROPDOWN/SELECT OPTIONS
    // =================================================================
    
    // Get options for dropdowns (returns associative arrays)
    $classOptions = $data->getClassOptions(); // [id => name]
    $subjectOptions = $data->getSubjectOptions(); // [id => name]
    $termOptions = $data->getTermOptions(); // [id => name]
    $sessionOptions = $data->getSessionOptions(); // [id => name]
    
    // All form options at once
    $formOptions = $data->getFormOptions();
    echo "\nForm Options Available:\n";
    echo "Classes: " . count($formOptions['classes']) . " options\n";
    echo "Subjects: " . count($formOptions['subjects']) . " options\n";
    echo "Terms: " . count($formOptions['terms']) . " options\n";
    echo "Sessions: " . count($formOptions['sessions']) . " options\n";
    
    // =================================================================
    // LOOKUP METHODS
    // =================================================================
    
    // Get individual names by ID
    if (!empty($classes)) {
        $firstClass = $classes[0];
        $className = $data->getClassName($firstClass['id']);
        $classDisplayName = $data->getClassDisplayName($firstClass['id']);
        echo "\nFirst Class: $className ($classDisplayName)\n";
    }
    
    if (!empty($subjects)) {
        $firstSubject = $subjects[0];
        $subjectName = $data->getSubjectName($firstSubject['id']);
        $subjectCode = $data->getSubjectCode($firstSubject['id']);
        echo "First Subject: $subjectName ($subjectCode)\n";
    }
    
    // =================================================================
    // TEACHER ASSIGNMENTS
    // =================================================================
    
    // Get all assignments
    $assignments = $data->getAllAssignments();
    echo "\nTotal Assignments: " . count($assignments) . "\n";
    
    // Example: Get assignments for a specific teacher (if any exist)
    if (!empty($assignments)) {
        $firstAssignment = $assignments[0];
        $teacherId = $firstAssignment['teacher_id'];
        
        $teacherAssignments = $data->getAssignmentsByTeacher($teacherId);
        echo "Assignments for Teacher ID $teacherId: " . count($teacherAssignments) . "\n";
        
        // Get teacher's subjects and classes
        $teacherSubjects = $data->getTeacherSubjects($teacherId);
        $teacherClasses = $data->getTeacherClasses($teacherId);
        
        echo "Teacher teaches " . count($teacherSubjects) . " subjects\n";
        echo "Teacher teaches " . count($teacherClasses) . " classes\n";
    }
    
    // =================================================================
    // VALIDATION
    // =================================================================
    
    // Validate assignment context
    if (!empty($classes) && !empty($subjects) && $currentSession && $currentTerm) {
        $validation = $data->validateAssignmentContext(
            $classes[0]['name'], // class level
            $currentTerm['id'],  // term id
            $currentSession['id'], // session id
            $subjects[0]['id']   // subject id
        );
        
        echo "\nValidation Result: " . ($validation['valid'] ? 'Valid' : 'Invalid') . "\n";
        if (!$validation['valid']) {
            echo "Errors: " . implode(', ', $validation['errors']) . "\n";
        }
    }
    
    // =================================================================
    // SEARCH FUNCTIONALITY
    // =================================================================
    
    // Search subjects
    $searchResults = $data->searchSubjects('math');
    echo "\nSubjects matching 'math': " . count($searchResults) . "\n";
    
    // =================================================================
    // ALL DATA AT ONCE (for AJAX endpoints)
    // =================================================================
    
    $allLookupData = $data->getAllLookupData();
    echo "\nAll Lookup Data Keys: " . implode(', ', array_keys($allLookupData)) . "\n";
}

// Only run if called directly (not included)
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    echo "=== CBT Portal Data Services Example ===\n\n";
    exampleUsage();
}

?>

<!-- 
HOW TO USE IN YOUR EXISTING FILES:

1. BASIC USAGE - Replace direct database queries:

OLD WAY:
$stmt = $db->prepare("SELECT * FROM subjects WHERE is_active = true ORDER BY name");
$stmt->execute();
$subjects = $stmt->fetchAll();

NEW WAY:
require_once __DIR__ . '/services/DataManager.php';
$data = DataManager::getInstance();
$subjects = $data->getAllSubjects();

2. IN API ENDPOINTS:

// api/system/lookup.php
require_once __DIR__ . '/../../services/DataManager.php';

$data = DataManager::getInstance();
Response::success('Lookup data retrieved', $data->getAllLookupData());

3. IN FORM PROCESSING:

// Validate form data
$data = DataManager::getInstance();
if (!$data->isValidSubject($subjectId)) {
    Response::validationError('Invalid subject selected');
}

4. FOR TEACHER-SPECIFIC DATA:

$data = DataManager::getInstance();
$teacherSubjects = $data->getTeacherSubjects($teacherId, $classLevel, $sessionId, $termId);
$teacherClasses = $data->getTeacherClasses($teacherId, $subjectId);

5. FOR DROPDOWN POPULATIONS:

$data = DataManager::getInstance();
$formOptions = $data->getFormOptions();
// Send $formOptions to frontend for populating selects

BENEFITS:
✅ No more duplicate database queries
✅ Built-in caching for performance
✅ Consistent data access patterns
✅ Easy to maintain and update
✅ Validation methods included
✅ Relationship handling built-in
-->