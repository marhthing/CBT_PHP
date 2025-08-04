<?php

require_once __DIR__ . '/../../con.php';
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
            s.name as subject,
            tc.class_level,
            tc.duration_minutes,
            tc.score_per_question
        FROM test_results tr
        JOIN test_codes tc ON tr.test_code_id = tc.id
        LEFT JOIN subjects s ON tc.subject_id = s.id
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
        $max_possible_score = $result['total_questions'] * $result['score_per_question'];
        $result['percentage'] = round(($result['score'] / $max_possible_score) * 100, 2);
        $result['grade'] = calculateGrade($result['percentage']);
        $result['max_possible_score'] = $max_possible_score;
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
