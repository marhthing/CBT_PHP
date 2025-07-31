<?php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/response.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::methodNotAllowed();
}

try {
    $auth = new Auth();
    $user = $auth->requireRole('student');
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if requesting limited results
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : null;
    
    // Build query
    $sql = "
        SELECT 
            tr.id,
            tr.score,
            tr.total_questions,
            tr.time_taken,
            tr.submitted_at,
            tc.code,
            tc.title,
            tc.subject,
            tc.class_level,
            tc.duration_minutes
        FROM test_results tr
        JOIN test_codes tc ON tr.test_code_id = tc.id
        WHERE tr.student_id = ?
        ORDER BY tr.submitted_at DESC
    ";
    
    if ($limit) {
        $sql .= " LIMIT " . $limit;
    }
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$user['id']]);
    $results = $stmt->fetchAll();
    
    // Add calculated fields
    foreach ($results as &$result) {
        $result['percentage'] = round(($result['score'] / $result['total_questions']) * 100, 2);
        $result['grade'] = calculateGrade($result['percentage']);
        $result['test_code'] = [
            'code' => $result['code'],
            'title' => $result['title'],
            'subject' => $result['subject'],
            'class_level' => $result['class_level'],
            'duration_minutes' => $result['duration_minutes']
        ];
        
        // Remove redundant fields
        unset($result['code'], $result['title'], $result['subject'], 
             $result['class_level'], $result['duration_minutes']);
    }
    
    Response::logRequest('student/results', 'GET', $user['id']);
    
    Response::success('Test results retrieved', [
        'results' => $results
    ]);
    
} catch (Exception $e) {
    error_log("Error getting student results: " . $e->getMessage());
    Response::serverError('Failed to get test results');
}

// Helper function to calculate grade
function calculateGrade($percentage) {
    if ($percentage >= 90) return 'A';
    if ($percentage >= 80) return 'B';
    if ($percentage >= 70) return 'C';
    if ($percentage >= 60) return 'D';
    return 'F';
}

?>
