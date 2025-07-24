<?php
session_start();
require_once '../includes/functions.php';
validateRole(['student']);

$testCode = $_GET['code'] ?? '';
if (empty($testCode)) {
    header('Location: take_test.php');
    exit();
}

// Get test details
$query = "SELECT tc.*, c.name as class_name, s.name as subject_name 
          FROM test_codes tc
          JOIN classes c ON tc.class_id = c.id
          JOIN subjects s ON tc.subject_id = s.id
          WHERE tc.code = ? AND tc.active = true";
$test = $db->fetch($query, [$testCode]);

if (!$test) {
    header('Location: take_test.php?error=Invalid test code');
    exit();
}

// Check if student has already taken this test
$query = "SELECT id FROM test_results WHERE student_id = ? AND test_code_id = ?";
$existingResult = $db->fetch($query, [$_SESSION['user_id'], $test['id']]);

if ($existingResult) {
    header('Location: take_test.php?error=You have already taken this test');
    exit();
}

// Count available questions
$query = "SELECT COUNT(*) as total FROM questions 
          WHERE class_id = ? AND subject_id = ? AND session = ? AND term = ? AND test_type = ?";
$questionCount = $db->fetch($query, [
    $test['class_id'], 
    $test['subject_id'], 
    $test['session'], 
    $test['term'], 
    $test['test_type']
]);

$page_title = 'Test Preview';
include '../includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-8 col-lg-6">
        <div class="card">
            <div class="card-header bg-info text-white text-center">
                <h4 class="mb-0"><i class="fas fa-eye me-2"></i>Test Preview</h4>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-sm-4"><strong>Test Code:</strong></div>
                    <div class="col-sm-8">
                        <code class="bg-light p-1 rounded"><?php echo htmlspecialchars($test['code']); ?></code>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-4"><strong>Subject:</strong></div>
                    <div class="col-sm-8"><?php echo htmlspecialchars($test['subject_name']); ?></div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-4"><strong>Class:</strong></div>
                    <div class="col-sm-8"><?php echo htmlspecialchars($test['class_name']); ?></div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-4"><strong>Test Type:</strong></div>
                    <div class="col-sm-8">
                        <span class="badge bg-<?php echo $test['test_type'] === 'Exam' ? 'danger' : 'warning'; ?>">
                            <?php echo htmlspecialchars($test['test_type']); ?>
                        </span>
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-4"><strong>Session:</strong></div>
                    <div class="col-sm-8"><?php echo htmlspecialchars($test['session']); ?></div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-4"><strong>Term:</strong></div>
                    <div class="col-sm-8"><?php echo htmlspecialchars($test['term']); ?></div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-4"><strong>Duration:</strong></div>
                    <div class="col-sm-8">
                        <i class="fas fa-clock me-1"></i>
                        <?php echo $test['duration']; ?> minutes
                    </div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-sm-4"><strong>Total Questions:</strong></div>
                    <div class="col-sm-8">
                        <i class="fas fa-question-circle me-1"></i>
                        <?php echo $test['num_questions']; ?>
                        <?php if ($questionCount['total'] < $test['num_questions']): ?>
                            <small class="text-warning">
                                (Only <?php echo $questionCount['total']; ?> available)
                            </small>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-sm-4"><strong>Score per Question:</strong></div>
                    <div class="col-sm-8">
                        <?php echo $test['score_per_question']; ?> marks
                        <small class="text-muted">
                            (Total: <?php echo $test['num_questions'] * $test['score_per_question']; ?> marks)
                        </small>
                    </div>
                </div>
                
                <?php if ($questionCount['total'] < $test['num_questions']): ?>
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Warning:</strong> Only <?php echo $questionCount['total']; ?> questions are available for this test, 
                        but <?php echo $test['num_questions']; ?> were requested. You will only get <?php echo $questionCount['total']; ?> questions.
                    </div>
                <?php endif; ?>
                

                
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    <a href="take_test.php" class="btn btn-outline-secondary me-md-2">
                        <i class="fas fa-arrow-left me-2"></i>Back
                    </a>
                    <a href="test_session.php?code=<?php echo urlencode($testCode); ?>" 
                       class="btn btn-success btn-lg"
                       onclick="return confirm('Are you ready to start the test? You cannot go back once you begin.')">
                        <i class="fas fa-play me-2"></i>Start Test
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
