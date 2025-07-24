<?php
session_start();
require_once '../includes/functions.php';
validateRole(['student']);

$resultId = $_GET['id'] ?? '';
if (empty($resultId)) {
    header('Location: dashboard.php');
    exit();
}

// Get result details
$query = "SELECT tr.*, tc.code, tc.subject_name, tc.class_name, tc.test_type, tc.num_questions, tc.score_per_question
          FROM test_results tr
          JOIN test_codes tc ON tr.test_code_id = tc.id
          WHERE tr.id = ? AND tr.student_id = ?";
$result = $db->fetch($query, [$resultId, $_SESSION['user_id']]);

if (!$result) {
    header('Location: dashboard.php?error=Result not found');
    exit();
}

// Calculate percentage
$percentage = round(($result['score'] / $result['total_score']) * 100, 1);

// Get grade based on percentage
function getGrade($percentage) {
    if ($percentage >= 80) return ['A', 'success'];
    if ($percentage >= 70) return ['B', 'info'];
    if ($percentage >= 60) return ['C', 'warning'];
    if ($percentage >= 50) return ['D', 'secondary'];
    return ['F', 'danger'];
}

$gradeInfo = getGrade($percentage);

$page_title = 'Test Result';
include '../includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-8 col-lg-6">
        <div class="card">
            <div class="card-header bg-success text-white text-center">
                <h4 class="mb-0"><i class="fas fa-check-circle me-2"></i>Test Completed</h4>
            </div>
            <div class="card-body text-center">
                <div class="mb-4">
                    <h1 class="display-4 fw-bold text-<?php echo $gradeInfo[1]; ?>">
                        <?php echo $percentage; ?>%
                    </h1>
                    <h3 class="text-<?php echo $gradeInfo[1]; ?>">Grade: <?php echo $gradeInfo[0]; ?></h3>
                </div>
                
                <div class="row text-start">
                    <div class="col-sm-6 mb-3">
                        <strong>Subject:</strong><br>
                        <?php echo htmlspecialchars($result['subject_name']); ?>
                    </div>
                    <div class="col-sm-6 mb-3">
                        <strong>Test Type:</strong><br>
                        <span class="badge bg-<?php echo $result['test_type'] === 'Exam' ? 'danger' : 'warning'; ?>">
                            <?php echo htmlspecialchars($result['test_type']); ?>
                        </span>
                    </div>
                    <div class="col-sm-6 mb-3">
                        <strong>Score:</strong><br>
                        <?php echo $result['score']; ?> / <?php echo $result['total_score']; ?> marks
                    </div>
                    <div class="col-sm-6 mb-3">
                        <strong>Questions:</strong><br>
                        <?php echo $result['questions_answered']; ?> / <?php echo $result['num_questions']; ?> answered
                    </div>
                    <div class="col-sm-6 mb-3">
                        <strong>Time Taken:</strong><br>
                        <i class="fas fa-clock me-1"></i>
                        <?php echo formatTime($result['time_taken']); ?>
                    </div>
                    <div class="col-sm-6 mb-3">
                        <strong>Completed:</strong><br>
                        <?php echo date('M j, Y g:i A', strtotime($result['completed_at'])); ?>
                    </div>
                </div>
                
                <hr>
                
                <!-- Performance Analysis -->
                <div class="text-start">
                    <h6><i class="fas fa-chart-bar me-2"></i>Performance Analysis</h6>
                    
                    <div class="progress mb-2" style="height: 25px;">
                        <div class="progress-bar bg-<?php echo $gradeInfo[1]; ?>" 
                             style="width: <?php echo $percentage; ?>%">
                            <?php echo $percentage; ?>%
                        </div>
                    </div>
                    
                    <div class="row text-center">
                        <div class="col-4">
                            <div class="card bg-light">
                                <div class="card-body py-2">
                                    <div class="text-success fw-bold"><?php echo $result['correct_answers']; ?></div>
                                    <small class="text-muted">Correct</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="card bg-light">
                                <div class="card-body py-2">
                                    <div class="text-danger fw-bold"><?php echo $result['wrong_answers']; ?></div>
                                    <small class="text-muted">Wrong</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="card bg-light">
                                <div class="card-body py-2">
                                    <div class="text-warning fw-bold">
                                        <?php echo $result['num_questions'] - $result['questions_answered']; ?>
                                    </div>
                                    <small class="text-muted">Skipped</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <hr>
                
                <!-- Remarks -->
                <div class="alert alert-<?php echo $gradeInfo[1]; ?> text-start">
                    <h6><i class="fas fa-comment me-2"></i>Remarks</h6>
                    <?php if ($percentage >= 80): ?>
                        <p class="mb-0">Excellent performance! You have demonstrated a strong understanding of the subject matter.</p>
                    <?php elseif ($percentage >= 70): ?>
                        <p class="mb-0">Very good performance! You have a good grasp of the concepts with room for minor improvements.</p>
                    <?php elseif ($percentage >= 60): ?>
                        <p class="mb-0">Good performance! You understand the basics but could benefit from additional study.</p>
                    <?php elseif ($percentage >= 50): ?>
                        <p class="mb-0">Fair performance. You need to focus more on understanding the core concepts.</p>
                    <?php else: ?>
                        <p class="mb-0">You need significant improvement. Please review the subject materials and seek additional help.</p>
                    <?php endif; ?>
                </div>
                
                <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                    <a href="dashboard.php" class="btn btn-primary">
                        <i class="fas fa-tachometer-alt me-2"></i>
                        Back to Dashboard
                    </a>
                    <a href="take_test.php" class="btn btn-outline-primary">
                        <i class="fas fa-edit me-2"></i>
                        Take Another Test
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Test Code Reference -->
        <div class="card mt-3">
            <div class="card-body">
                <div class="text-center">
                    <small class="text-muted">
                        Test Code: <code><?php echo htmlspecialchars($result['code']); ?></code>
                    </small>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
