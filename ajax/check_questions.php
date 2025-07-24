<?php
session_start();
require_once '../config/db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo '<div class="alert alert-danger">Access denied</div>';
    exit;
}

$classId = $_GET['class_id'] ?? '';
$subjectId = $_GET['subject_id'] ?? '';
$session = $_GET['session'] ?? '';
$term = $_GET['term'] ?? '';
$testType = $_GET['test_type'] ?? '';

if (empty($classId) || empty($subjectId) || empty($session) || empty($term) || empty($testType)) {
    echo '<div class="alert alert-warning">Please provide all required parameters</div>';
    exit;
}

try {
    // Get total questions available
    $query = "SELECT COUNT(*) as total FROM questions 
              WHERE class_id = ? AND subject_id = ? AND session = ? AND term = ? AND test_type = ?";
    $result = $db->fetch($query, [$classId, $subjectId, $session, $term, $testType]);
    $totalQuestions = $result['total'];
    
    // Get class and subject names
    $classQuery = "SELECT name FROM classes WHERE id = ?";
    $class = $db->fetch($classQuery, [$classId]);
    
    $subjectQuery = "SELECT name FROM subjects WHERE id = ?";
    $subject = $db->fetch($subjectQuery, [$subjectId]);
    
    // Get questions by creator
    $creatorQuery = "SELECT u.full_name, u.role, COUNT(q.id) as question_count
                     FROM questions q
                     JOIN users u ON q.created_by = u.id
                     WHERE q.class_id = ? AND q.subject_id = ? AND q.session = ? AND q.term = ? AND q.test_type = ?
                     GROUP BY u.id, u.full_name, u.role
                     ORDER BY question_count DESC";
    $creators = $db->fetchAll($creatorQuery, [$classId, $subjectId, $session, $term, $testType]);
    
    ?>
    <div class="alert alert-info">
        <h6><i class="fas fa-info-circle me-2"></i>Question Availability Report</h6>
        <div class="mt-2">
            <strong>Class:</strong> <?php echo htmlspecialchars($class['name'] ?? 'Unknown'); ?><br>
            <strong>Subject:</strong> <?php echo htmlspecialchars($subject['name'] ?? 'Unknown'); ?><br>
            <strong>Session:</strong> <?php echo htmlspecialchars($session); ?><br>
            <strong>Term:</strong> <?php echo htmlspecialchars($term); ?><br>
            <strong>Type:</strong> <?php echo htmlspecialchars($testType); ?>
        </div>
    </div>
    
    <div class="row">
        <div class="col-md-6">
            <div class="card">
                <div class="card-body text-center">
                    <h3 class="text-<?php echo $totalQuestions > 0 ? 'success' : 'danger'; ?>">
                        <?php echo $totalQuestions; ?>
                    </h3>
                    <p class="mb-0">Total Questions Available</p>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card">
                <div class="card-body text-center">
                    <h3 class="text-info"><?php echo count($creators); ?></h3>
                    <p class="mb-0">Contributors</p>
                </div>
            </div>
        </div>
    </div>
    
    <?php if ($totalQuestions === 0): ?>
        <div class="alert alert-danger mt-3">
            <h6><i class="fas fa-exclamation-triangle me-2"></i>No Questions Found</h6>
            <p class="mb-0">No questions are available for the selected criteria. You need to upload questions before generating test codes.</p>
        </div>
    <?php else: ?>
        <div class="alert alert-success mt-3">
            <h6><i class="fas fa-check-circle me-2"></i>Questions Available</h6>
            <p class="mb-0">You can generate test codes with up to <strong><?php echo $totalQuestions; ?></strong> questions.</p>
        </div>
        
        <?php if (!empty($creators)): ?>
            <div class="mt-3">
                <h6>Questions by Creator:</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Creator</th>
                                <th>Role</th>
                                <th>Questions</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($creators as $creator): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($creator['full_name']); ?></td>
                                    <td>
                                        <span class="badge bg-<?php echo $creator['role'] === 'admin' ? 'danger' : 'warning'; ?>">
                                            <?php echo ucfirst($creator['role']); ?>
                                        </span>
                                    </td>
                                    <td><?php echo $creator['question_count']; ?></td>
                                    <td>
                                        <div class="progress" style="height: 15px;">
                                            <div class="progress-bar" style="width: <?php echo round(($creator['question_count'] / $totalQuestions) * 100, 1); ?>%">
                                                <?php echo round(($creator['question_count'] / $totalQuestions) * 100, 1); ?>%
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        <?php endif; ?>
    <?php endif; ?>
    
    <div class="alert alert-info mt-3">
        <h6><i class="fas fa-lightbulb me-2"></i>Recommendations</h6>
        <ul class="mb-0">
            <?php if ($totalQuestions < 20): ?>
                <li>Consider adding more questions to provide better variety</li>
            <?php endif; ?>
            <?php if ($totalQuestions > 100): ?>
                <li>Good question pool - allows for varied test generation</li>
            <?php endif; ?>
            <li>Recommended: 2-3 times more questions than test length</li>
            <li>Ensure questions cover different difficulty levels</li>
        </ul>
    </div>
    <?php
    
} catch (Exception $e) {
    error_log("Check questions error: " . $e->getMessage());
    echo '<div class="alert alert-danger">Failed to check question availability</div>';
}
?>
