<?php
session_start();
require_once '../includes/functions.php';
validateRole(['teacher']);

$page_title = 'Manage Questions';

// Get filter parameters
$classId = $_GET['class_id'] ?? '';
$subjectId = $_GET['subject_id'] ?? '';
$session = $_GET['session'] ?? '';
$term = $_GET['term'] ?? '';
$testType = $_GET['test_type'] ?? '';

// Get teacher assignments
$assignments = getTeacherAssignments($_SESSION['user_id']);

// Build query for teacher's questions
$whereConditions = ['created_by = ?'];
$params = [$_SESSION['user_id']];

if ($classId) {
    $whereConditions[] = 'class_id = ?';
    $params[] = $classId;
}
if ($subjectId) {
    $whereConditions[] = 'subject_id = ?';
    $params[] = $subjectId;
}
if ($session) {
    $whereConditions[] = 'session = ?';
    $params[] = $session;
}
if ($term) {
    $whereConditions[] = 'term = ?';
    $params[] = $term;
}
if ($testType) {
    $whereConditions[] = 'test_type = ?';
    $params[] = $testType;
}

$query = "SELECT q.*, c.name as class_name, s.name as subject_name 
          FROM questions q
          JOIN classes c ON q.class_id = c.id
          JOIN subjects s ON q.subject_id = s.id
          WHERE " . implode(' AND ', $whereConditions) . "
          ORDER BY q.created_at DESC";

$questions = $db->fetchAll($query, $params);

// Handle delete request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'delete' && isset($_POST['question_id'])) {
        $questionId = $_POST['question_id'];
        
        // Verify question belongs to teacher
        $checkQuery = "SELECT id, image FROM questions WHERE id = ? AND created_by = ?";
        $question = $db->fetch($checkQuery, [$questionId, $_SESSION['user_id']]);
        
        if ($question) {
            // Delete image if exists
            if ($question['image'] && file_exists('../uploads/' . $question['image'])) {
                unlink('../uploads/' . $question['image']);
            }
            
            // Delete question
            $deleteQuery = "DELETE FROM questions WHERE id = ?";
            $db->execute($deleteQuery, [$questionId]);
            
            // Log activity
            logActivity($_SESSION['user_id'], 'Question Deleted', "Deleted question ID: {$questionId}");
            
            header('Location: manage_questions.php?success=Question deleted successfully');
            exit();
        }
    }
}

include '../includes/header.php';
?>

<div class="row">
    <div class="col-12">
        <!-- Filter Form -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-filter me-2"></i>Filter Questions</h5>
            </div>
            <div class="card-body">
                <form method="GET" class="row g-3">
                    <div class="col-md-3">
                        <label for="class_id" class="form-label">Class</label>
                        <select class="form-select" id="class_id" name="class_id">
                            <option value="">All Classes</option>
                            <?php 
                            $teacherClasses = array_unique(array_column($assignments, 'class_id'));
                            $classes = getClasses();
                            foreach ($classes as $class):
                                if (in_array($class['id'], $teacherClasses)):
                            ?>
                                <option value="<?php echo $class['id']; ?>" <?php echo $classId == $class['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($class['name']); ?>
                                </option>
                            <?php 
                                endif;
                            endforeach; 
                            ?>
                        </select>
                    </div>
                    
                    <div class="col-md-3">
                        <label for="subject_id" class="form-label">Subject</label>
                        <select class="form-select" id="subject_id" name="subject_id">
                            <option value="">All Subjects</option>
                            <?php 
                            $teacherSubjects = array_unique(array_column($assignments, 'subject_id'));
                            $subjects = getSubjects();
                            foreach ($subjects as $subject):
                                if (in_array($subject['id'], $teacherSubjects)):
                            ?>
                                <option value="<?php echo $subject['id']; ?>" <?php echo $subjectId == $subject['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($subject['name']); ?>
                                </option>
                            <?php 
                                endif;
                            endforeach; 
                            ?>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label for="session" class="form-label">Session</label>
                        <select class="form-select" id="session" name="session">
                            <option value="">All Sessions</option>
                            <?php foreach (getSessions() as $sess): ?>
                                <option value="<?php echo $sess; ?>" <?php echo $session === $sess ? 'selected' : ''; ?>>
                                    <?php echo $sess; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label for="term" class="form-label">Term</label>
                        <select class="form-select" id="term" name="term">
                            <option value="">All Terms</option>
                            <?php foreach (getTerms() as $t): ?>
                                <option value="<?php echo $t; ?>" <?php echo $term === $t ? 'selected' : ''; ?>>
                                    <?php echo $t; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label for="test_type" class="form-label">Type</label>
                        <select class="form-select" id="test_type" name="test_type">
                            <option value="">All Types</option>
                            <?php foreach (getTestTypes() as $key => $type): ?>
                                <option value="<?php echo $key; ?>" <?php echo $testType === $key ? 'selected' : ''; ?>>
                                    <?php echo $type; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-search me-2"></i>Filter
                        </button>
                        <a href="manage_questions.php" class="btn btn-outline-secondary">
                            <i class="fas fa-redo me-2"></i>Reset
                        </a>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Questions List -->
        <div class="card">
            <div class="card-header bg-info text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="fas fa-list me-2"></i>
                        My Questions (<?php echo count($questions); ?>)
                    </h5>
                    <a href="upload_questions.php" class="btn btn-success btn-sm">
                        <i class="fas fa-plus me-2"></i>Add Questions
                    </a>
                </div>
            </div>
            <div class="card-body">
                <?php if (isset($_GET['success'])): ?>
                    <div class="alert alert-success" role="alert">
                        <i class="fas fa-check-circle me-2"></i>
                        <?php echo htmlspecialchars($_GET['success']); ?>
                    </div>
                <?php endif; ?>
                
                <?php if (empty($questions)): ?>
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-question-circle fa-3x mb-3"></i>
                        <h5>No Questions Found</h5>
                        <p>No questions match your current filter criteria.</p>
                        <a href="upload_questions.php" class="btn btn-primary">
                            <i class="fas fa-upload me-2"></i>Upload Your First Questions
                        </a>
                    </div>
                <?php else: ?>
                    <div class="row">
                        <?php foreach ($questions as $question): ?>
                            <div class="col-md-6 col-lg-4 mb-4">
                                <div class="card h-100">
                                    <?php if ($question['image']): ?>
                                        <img src="../uploads/<?php echo htmlspecialchars($question['image']); ?>" 
                                             class="card-img-top" 
                                             style="height: 200px; object-fit: cover;"
                                             alt="Question Image">
                                    <?php endif; ?>
                                    
                                    <div class="card-body">
                                        <div class="mb-2">
                                            <span class="badge bg-primary"><?php echo htmlspecialchars($question['class_name']); ?></span>
                                            <span class="badge bg-info"><?php echo htmlspecialchars($question['subject_name']); ?></span>
                                            <span class="badge bg-<?php echo $question['test_type'] === 'Exam' ? 'danger' : 'warning'; ?>">
                                                <?php echo htmlspecialchars($question['test_type']); ?>
                                            </span>
                                        </div>
                                        
                                        <p class="card-text">
                                            <?php echo strlen($question['question_text']) > 100 
                                                ? htmlspecialchars(substr($question['question_text'], 0, 100)) . '...'
                                                : htmlspecialchars($question['question_text']); ?>
                                        </p>
                                        
                                        <div class="small text-muted mb-3">
                                            <div><strong>Session:</strong> <?php echo htmlspecialchars($question['session']); ?></div>
                                            <div><strong>Term:</strong> <?php echo htmlspecialchars($question['term']); ?></div>
                                            <div><strong>Correct:</strong> Option <?php echo htmlspecialchars($question['correct_option']); ?></div>
                                            <div><strong>Created:</strong> <?php echo date('M j, Y', strtotime($question['created_at'])); ?></div>
                                        </div>
                                    </div>
                                    
                                    <div class="card-footer bg-transparent">
                                        <div class="d-flex gap-2">
                                            <button type="button" class="btn btn-outline-primary btn-sm flex-fill" 
                                                    onclick="viewQuestion(<?php echo $question['id']; ?>)">
                                                <i class="fas fa-eye me-1"></i>View
                                            </button>
                                            <button type="button" class="btn btn-outline-warning btn-sm flex-fill"
                                                    onclick="editQuestion(<?php echo $question['id']; ?>)">
                                                <i class="fas fa-edit me-1"></i>Edit
                                            </button>
                                            <button type="button" class="btn btn-outline-danger btn-sm flex-fill"
                                                    onclick="deleteQuestion(<?php echo $question['id']; ?>)">
                                                <i class="fas fa-trash me-1"></i>Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<!-- Question View Modal -->
<div class="modal fade" id="questionModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Question Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="questionModalBody">
                <!-- Content will be loaded here -->
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Form -->
<form id="deleteForm" method="POST" style="display: none;">
    <input type="hidden" name="action" value="delete">
    <input type="hidden" name="question_id" id="deleteQuestionId">
</form>

<script>
function viewQuestion(questionId) {
    // Load question details via AJAX
    $.ajax({
        url: '../ajax/get_question_details.php',
        method: 'GET',
        data: { id: questionId },
        success: function(response) {
            $('#questionModalBody').html(response);
            new bootstrap.Modal(document.getElementById('questionModal')).show();
        },
        error: function() {
            alert('Failed to load question details');
        }
    });
}

function editQuestion(questionId) {
    // Redirect to edit page (you can implement this)
    alert('Edit functionality will be implemented');
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
        $('#deleteQuestionId').val(questionId);
        $('#deleteForm').submit();
    }
}
</script>

<?php include '../includes/footer.php'; ?>
