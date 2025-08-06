
<?php
require_once __DIR__ . '/../config/database.php';

// Set headers first
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure no output before JSON
ob_clean();

try {
    // Test database connection
    $conn = getDatabaseConnection();

    // Get basic stats
    $stmt = $conn->query("SELECT COUNT(*) as user_count FROM users");
    $user_count = $stmt->fetch()['user_count'] ?? 0;

    $stmt = $conn->query("SELECT COUNT(*) as subject_count FROM subjects");
    $subject_count = $stmt->fetch()['subject_count'] ?? 0;

    $response = [
        'success' => true,
        'message' => 'API is healthy',
        'data' => [
            'database_connected' => true,
            'users_count' => (int)$user_count,
            'subjects_count' => (int)$subject_count,
            'timestamp' => date('c')
        ]
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'Health check failed: ' . $e->getMessage(),
        'timestamp' => date('c')
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

exit();
?>
