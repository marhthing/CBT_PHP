<?php
session_start();
require_once '../config/db.php';
require_once '../includes/functions.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo '<div class="alert alert-danger">Access denied</div>';
    exit;
}

$questionId = $_GET['id'] ?? '';

if (empty($questionId)) {
    echo '<div class="alert alert-danger">Question ID required</div>';
    exit;
}

try {
    // Get question details with class and subject info
    $query = "SELECT q.*, c.name as class_name, s.name as subject_name, u.full_name as creator_name, u.role as creator_role
              FROM questions q
              JOIN classes c ON q.class_id = c.id
              JOIN subjects s ON q.subject_id = s.id
              JOIN users u ON q.created_by = u.id
              WHERE q.id = ?";
    
    $question = $db->fetch($query, [$questionId]);
    
    if (!$question) {
        echo '<div class="alert alert-danger">Question not found</div>';
        exit;
    }
    
    // Check permissions
    if ($_SESSION['role'] === 'teacher' && $question['created_by'] != $_SESSION['user_id']) {
        echo '<div class="alert alert-danger">You can only view your own questions</div>';
        exit;
    }
    
    ?>
    <div class="row">
        <div class="col-12">
            <!-- Question Metadata -->
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted">Class:</small>
                            <span class="badge bg-primary"><?php echo htmlspecialchars($question['class_name']); ?></span>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">Subject:</small>
                            <span class="badge bg-info"><?php echo htmlspecialchars($question['subject_name']); ?></span>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-4">
                            <small class="text-muted">Session:</small> <?php echo htmlspecialchars($question['session']); ?>
                        </div>
                        <div class="col-md-4">
                            <small class="text-muted">Term:</small> <?php echo htmlspecialchars($question['term']); ?>
                        </div>
                        <div class="col-md-4">
                            <small class="text-muted">Type:</small>
                            <span class="badge bg-<?php echo $question['test_type'] === 'Exam' ? 'danger' : 'warning'; ?>">
                                <?php echo htmlspecialchars($question['test_type']); ?>
                            </span>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <small class="text-muted">Created by:</small> 
                            <?php echo htmlspecialchars($question['creator_name']); ?>
                            <span class="badge bg-secondary"><?php echo ucfirst($question['creator_role']); ?></span>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted">Created:</small> <?php echo date('M j, Y g:i A', strtotime($question['created_at'])); ?>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Question Content -->
            <div class="card">
                <div class="card-body">
                    <?php if ($question['image']): ?>
                        <div class="text-center mb-4">
                            <img src="../uploads/<?php echo htmlspecialchars($question['image']); ?>" 
                                 class="img-fluid rounded shadow" 
                                 style="max-height: 400px;"
                                 alt="Question Image">
                        </div>
                    <?php endif; ?>
                    
                    <div class="mb-4">
                        <h6 class="text-primary">Question:</h6>
                        <p class="fs-6"><?php echo nl2br(htmlspecialchars($question['question_text'])); ?></p>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="card <?php echo $question['correct_option'] === 'A' ? 'border-success bg-light' : 'border-light'; ?>">
                                <div class="card-body">
                                    <strong>A.</strong> <?php echo htmlspecialchars($question['option_a']); ?>
                                    <?php if ($question['correct_option'] === 'A'): ?>
                                        <i class="fas fa-check-circle text-success float-end"></i>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="card <?php echo $question['correct_option'] === 'B' ? 'border-success bg-light' : 'border-light'; ?>">
                                <div class="card-body">
                                    <strong>B.</strong> <?php echo htmlspecialchars($question['option_b']); ?>
                                    <?php if ($question['correct_option'] === 'B'): ?>
                                        <i class="fas fa-check-circle text-success float-end"></i>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="card <?php echo $question['correct_option'] === 'C' ? 'border-success bg-light' : 'border-light'; ?>">
                                <div class="card-body">
                                    <strong>C.</strong> <?php echo htmlspecialchars($question['option_c']); ?>
                                    <?php if ($question['correct_option'] === 'C'): ?>
                                        <i class="fas fa-check-circle text-success float-end"></i>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="card <?php echo $question['correct_option'] === 'D' ? 'border-success bg-light' : 'border-light'; ?>">
                                <div class="card-body">
                                    <strong>D.</strong> <?php echo htmlspecialchars($question['option_d']); ?>
                                    <?php if ($question['correct_option'] === 'D'): ?>
                                        <i class="fas fa-check-circle text-success float-end"></i>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>Correct Answer:</strong> Option <?php echo htmlspecialchars($question['correct_option']); ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php
    
} catch (Exception $e) {
    error_log("Get question details error: " . $e->getMessage());
    echo '<div class="alert alert-danger">Failed to load question details</div>';
}
?>
