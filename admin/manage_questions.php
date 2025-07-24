<?php
session_start();
require_once '../includes/functions.php';
validateRole(['admin']);

$page_title = 'Manage All Questions';

// Get filter parameters
$classId = $_GET['class_id'] ?? '';
$subjectId = $_GET['subject_id'] ?? '';
$session = $_GET['session'] ?? '';
$term = $_GET['term'] ?? '';
$testType = $_GET['test_type'] ?? '';
$createdBy = $_GET['created_by'] ?? '';

// Build query for all questions
$whereConditions = ['1=1'];
$params = [];

if ($classId) {
    $whereConditions[] = 'q.class_id = ?';
    $params[] = $classId;
}
if ($subjectId) {
    $whereConditions[] = 'q.subject_id = ?';
    $params[] = $subjectId;
}
if ($session) {
    $whereConditions[] = 'q.session = ?';
    $params[] = $session;
}
if ($term) {
    $whereConditions[] = 'q.term = ?';
    $params[] = $term;
}
if ($testType) {
    $whereConditions[] = 'q.test_type = ?';
    $params[] = $testType;
}
if ($createdBy) {
    $whereConditions[] = 'q.created_by = ?';
    $params[] = $createdBy;
}

$query = "SELECT q.*, c.name as class_name, s.name as subject_name, u.full_name as creator_name, u.role as creator_role
          FROM questions q
          JOIN classes c ON q.class_id = c.id
          JOIN subjects s ON q.subject_id = s.id
          JOIN users u ON q.created_by = u.id
          WHERE " . implode(' AND ', $whereConditions) . "
          ORDER BY q.created_at DESC";

$questions = $db->fetchAll($query, $params);

// Get creators for filter
$creators = $db->fetchAll("SELECT DISTINCT u.id, u.full_name, u.role 
                           FROM users u 
                           JOIN questions q ON u.id = q.created_by 
                           ORDER BY u.full_name");

// Handle delete request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'delete' && isset($_POST['question_id'])) {
        $questionId = $_POST['question_id'];
        
        // Get question details
        $checkQuery = "SELECT id, image FROM questions WHERE id = ?";
        $question = $db->fetch($checkQuery, [$questionId]);
        
        if ($question) {
            // Delete image if exists
            if ($question['image'] && file_exists('../uploads/' . $question['image'])) {
                unlink('../uploads/' . $question['image']);
            }
            
            // Delete question
            $deleteQuery = "DELETE FROM questions WHERE id = ?";
            $db->execute($deleteQuery, [$questionId]);
            
            // Log activity
            logActivity($_SESSION['user_id'], 'Question Deleted (Admin)', "Deleted question ID: {$questionId}");
            
            header('Location: manage_questions.php?success=Question deleted successfully');
            exit();
        }
    }
}

$classes = getClasses();
$subjects = getSubjects();

include '../includes/header.php';
?>

<div class="row">
    <div class="col-12">
        <!-- Statistics -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Total Questions</h6>
                                <h4 class="mb-0"><?php echo count($questions); ?></h4>
                            </div>
                            <i class="fas fa-question-circle fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Classes Covered</h6>
                                <h4 class="mb-0"><?php echo count(array_unique(array_column($questions, 'class_id'))); ?></h4>
                            </div>
                            <i class="fas fa-school fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Subjects Covered</h6>
                                <h4 class="mb-0"><?php echo count(array_unique(array_column($questions, 'subject_id'))); ?></h4>
                            </div>
                            <i class="fas fa-book fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-dark">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">With Images</h6>
                                <h4 class="mb-0"><?php echo count(array_filter($questions, function($q) { return !empty($q['image']); })); ?></h4>
                            </div>
                            <i class="fas fa-image fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filter Form -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-filter me-2"></i>Filter Questions</h5>
            </div>
            <div class="card-body">
                <form method="GET" class="row g-3">
                    <div class="col-md-2">
                        <label for="class_id" class="form-label">Class</label>
                        <select class="form-select form-select-sm" id="class_id" name="class_id">
                            <option value="">All Classes</option>
                            <?php foreach ($classes as $class): ?>
                                <option value="<?php echo $class['id']; ?>" <?php echo $classId == $class['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($class['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label for="subject_id" class="form-label">Subject</label>
                        <select class="form-select form-select-sm" id="subject_id" name="subject_id">
                            <option value="">All Subjects</option>
                            <?php foreach ($subjects as $subject): ?>
                                <option value="<?php echo $subject['id']; ?>" <?php echo $subjectId == $subject['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($subject['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label for="session" class="form-label">Session</label>
                        <select class="form-select form-select-sm" id="session" name="session">
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
                        <select class="form-select form-select-sm" id="term" name="term">
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
                        <select class="form-select form-select-sm" id="test_type" name="test_type">
                            <option value="">All Types</option>
                            <?php foreach (getTestTypes() as $key => $type): ?>
                                <option value="<?php echo $key; ?>" <?php echo $testType === $key ? 'selected' : ''; ?>>
                                    <?php echo $type; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-2">
                        <label for="created_by" class="form-label">Creator</label>
                        <select class="form-select form-select-sm" id="created_by" name="created_by">
                            <option value="">All Creators</option>
                            <?php foreach ($creators as $creator): ?>
                                <option value="<?php echo $creator['id']; ?>" <?php echo $createdBy == $creator['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($creator['full_name']); ?>
                                    (<?php echo ucfirst($creator['role']); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary btn-sm">
                            <i class="fas fa-search me-2"></i>Filter
                        </button>
                        <a href="manage_questions.php" class="btn btn-outline-secondary btn-sm">
                            <i class="fas fa-redo me-2"></i>Reset
                        </a>
                        <a href="upload_questions.php" class="btn btn-success btn-sm ms-2">
                            <i class="fas fa-plus me-2"></i>Add Questions
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
                        Questions (<?php echo count($questions); ?>)
                    </h5>
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
                            <i class="fas fa-upload me-2"></i>Upload Questions
                        </a>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Question</th>
                                    <th>Class</th>
                                    <th>Subject</th>
                                    <th>Type</th>
                                    <th>Creator</th>
                                    <th>Correct</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($questions as $question): ?>
                                    <tr>
                                        <td style="max-width: 300px;">
                                            <?php if ($question['image']): ?>
                                                <i class="fas fa-image text-success me-1" title="Has image"></i>
                                            <?php endif; ?>
                                            <div class="text-truncate">
                                                <?php echo htmlspecialchars(substr($question['question_text'], 0, 100)); ?>
                                                <?php if (strlen($question['question_text']) > 100): ?>...<?php endif; ?>
                                            </div>
                                            <small class="text-muted">
                                                <?php echo htmlspecialchars($question['session'] . ' • ' . $question['term']); ?>
                                            </small>
                                        </td>
                                        <td>
                                            <span class="badge bg-primary">
                                                <?php echo htmlspecialchars($question['class_name']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge bg-info">
                                                <?php echo htmlspecialchars($question['subject_name']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge bg-<?php echo $question['test_type'] === 'Exam' ? 'danger' : 'warning'; ?>">
                                                <?php echo htmlspecialchars($question['test_type']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <small class="fw-bold"><?php echo htmlspecialchars($question['creator_name']); ?></small>
                                                <br>
                                                <span class="badge bg-secondary">
                                                    <?php echo ucfirst($question['creator_role']); ?>
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge bg-success">
                                                <?php echo htmlspecialchars($question['correct_option']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <small><?php echo date('M j, Y', strtotime($question['created_at'])); ?></small>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button type="button" class="btn btn-outline-primary btn-sm" 
                                                        onclick="viewQuestion(<?php echo $question['id']; ?>)">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button type="button" class="btn btn-outline-warning btn-sm"
                                                        onclick="editQuestion(<?php echo $question['id']; ?>)">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button type="button" class="btn btn-outline-danger btn-sm"
                                                        onclick="deleteQuestion(<?php echo $question['id']; ?>)">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div></old_str>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
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
    window.location.href = 'edit_question.php?id=' + questionId;
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
        $('#deleteQuestionId').val(questionId);
        $('#deleteForm').submit();
    }
}
</script>

<?php include '../includes/footer.php'; ?>
