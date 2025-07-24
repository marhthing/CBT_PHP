<?php
session_start();
require_once '../includes/functions.php';
validateRole(['admin']);

$page_title = 'Admin - Upload Questions';
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $error = 'Invalid request. Please try again.';
    } else {
        $classId = $_POST['class_id'] ?? '';
        $subjectId = $_POST['subject_id'] ?? '';
        $session = $_POST['session'] ?? '';
        $term = $_POST['term'] ?? '';
        $testType = $_POST['test_type'] ?? '';
        $questions = $_POST['questions'] ?? [];

        if (empty($classId) || empty($subjectId) || empty($session) || empty($term) || empty($testType)) {
            $error = 'Please select all required fields.';
        } elseif (empty($questions)) {
            $error = 'Please add at least one question.';
        } else {
            $db->getConnection()->beginTransaction();

            try {
                $uploadedCount = 0;

                foreach ($questions as $q) {
                    if (empty($q['question_text']) || empty($q['option_a']) || empty($q['option_b']) || 
                        empty($q['option_c']) || empty($q['option_d']) || empty($q['correct_option'])) {
                        continue;
                    }

                    // Handle image upload
                    $imageName = null;
                    if (isset($_FILES['question_images']['name'][$q['index']]) && 
                        $_FILES['question_images']['name'][$q['index']]) {

                        $imageFile = [
                            'name' => $_FILES['question_images']['name'][$q['index']],
                            'type' => $_FILES['question_images']['type'][$q['index']],
                            'tmp_name' => $_FILES['question_images']['tmp_name'][$q['index']],
                            'error' => $_FILES['question_images']['error'][$q['index']],
                            'size' => $_FILES['question_images']['size'][$q['index']]
                        ];

                        $imageName = uploadImage($imageFile);
                    }

                    // Insert question
                    $query = "INSERT INTO questions (class_id, subject_id, session, term, test_type, 
                              question_text, option_a, option_b, option_c, option_d, correct_option, 
                              image, created_by, created_at) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

                    $db->execute($query, [
                        $classId, $subjectId, $session, $term, $testType,
                        $q['question_text'], $q['option_a'], $q['option_b'], 
                        $q['option_c'], $q['option_d'], $q['correct_option'],
                        $imageName, $_SESSION['user_id']
                    ]);

                    $uploadedCount++;
                }

                if ($uploadedCount > 0) {
                    $db->getConnection()->commit();

                    // Log activity
                    logActivity($_SESSION['user_id'], 'Questions Uploaded (Admin)', 
                               "Uploaded {$uploadedCount} questions for {$session} {$term}");

                    $success = "Successfully uploaded {$uploadedCount} questions.";
                } else {
                    $db->getConnection()->rollback();
                    $error = 'No valid questions were found to upload.';
                }

            } catch (Exception $e) {
                $db->getConnection()->rollback();
                error_log("Question upload error: " . $e->getMessage());
                $error = 'Failed to upload questions. Please try again.';
            }
        }
    }
}

$classes = getClasses();
$subjects = getSubjects();

include '../includes/header.php';
?>

<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-upload me-2"></i>Upload Questions (Admin)</h5>
            </div>
            <div class="card-body">
                <?php if ($error): ?>
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <?php echo htmlspecialchars($error); ?>
                    </div>
                <?php endif; ?>

                <?php if ($success): ?>
                    <div class="alert alert-success" role="alert">
                        <i class="fas fa-check-circle me-2"></i>
                        <?php echo htmlspecialchars($success); ?>
                    </div>
                <?php endif; ?>

                <form method="POST" enctype="multipart/form-data" id="upload-form">
                    <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">

                    <!-- Test Details -->
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <label for="class_id" class="form-label">Class *</label>
                            <select class="form-select" id="class_id" name="class_id" required>
                                <option value="">Select Class</option>
                                <?php foreach ($classes as $class): ?>
                                    <option value="<?php echo $class['id']; ?>">
                                        <?php echo htmlspecialchars($class['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="subject_id" class="form-label">Subject *</label>
                            <select class="form-select" id="subject_id" name="subject_id" required>
                                <option value="">Select Subject</option>
                                <?php foreach ($subjects as $subject): ?>
                                    <option value="<?php echo $subject['id']; ?>">
                                        <?php echo htmlspecialchars($subject['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="row mb-4">
                        <div class="col-md-4">
                            <label for="session" class="form-label">Academic Session *</label>
                            <select class="form-select" id="session" name="session" required>
                                <option value="">Select Session</option>
                                <?php foreach (getSessions() as $session): ?>
                                    <option value="<?php echo $session; ?>"><?php echo $session; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="term" class="form-label">Term *</label>
                            <select class="form-select" id="term" name="term" required>
                                <option value="">Select Term</option>
                                <?php foreach (getTerms() as $term): ?>
                                    <option value="<?php echo $term; ?>"><?php echo $term; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="test_type" class="form-label">Test Type *</label>
                            <select class="form-select" id="test_type" name="test_type" required>
                                <option value="">Select Type</option>
                                <?php foreach (getTestTypes() as $key => $type): ?>
                                    <option value="<?php echo $key; ?>"><?php echo $type; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <hr>

                    <!-- Questions Container -->
                    <div id="questions-container" style="display: none;">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6><i class="fas fa-question-circle me-2"></i>Questions</h6>
                            <button type="button" id="add-question" class="btn btn-success btn-sm">
                                <i class="fas fa-plus me-1"></i>Add Question
                            </button>
                        </div>
                    </div>

                    <div id="filter-message" class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Please fill in all required fields above before adding questions.
                    </div>

                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button type="button" class="btn btn-outline-secondary me-md-2" onclick="location.reload()">
                            <i class="fas fa-redo me-2"></i>Reset
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-upload me-2"></i>Upload Questions
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card">
            <div class="card-header bg-info text-white">
                <h6 class="mb-0"><i class="fas fa-info-circle me-2"></i>Admin Upload Guidelines</h6>
            </div>
            <div class="card-body">
                <div class="alert alert-success">
                    <h6><i class="fas fa-crown me-2"></i>Admin Privileges</h6>
                    <ul class="mb-0 small">
                        <li>Upload questions for any class and subject</li>
                        <li>No assignment restrictions</li>
                        <li>Bulk upload capabilities</li>
                        <li>Override teacher permissions</li>
                    </ul>
                </div>

                <ul class="list-unstyled mb-0">
                    <li class="mb-2">
                        <i class="fas fa-check text-success me-2"></i>
                        Select any class and subject combination
                    </li>
                    <li class="mb-2">
                        <i class="fas fa-check text-success me-2"></i>
                        Choose correct session and term
                    </li>
                    <li class="mb-2">
                        <i class="fas fa-check text-success me-2"></i>
                        Write clear, objective questions
                    </li>
                    <li class="mb-2">
                        <i class="fas fa-check text-success me-2"></i>
                        Provide exactly 4 options (A-D)
                    </li>
                    <li class="mb-2">
                        <i class="fas fa-check text-success me-2"></i>
                        Mark the correct option clearly
                    </li>
                    <li class="mb-2">
                        <i class="fas fa-check text-success me-2"></i>
                        Images are optional but helpful
                    </li>
                    <li class="mb-0">
                        <i class="fas fa-check text-success me-2"></i>
                        Maximum file size: 5MB per image
                    </li>
                </ul>
            </div>
        </div>

        <div class="card mt-3">
            <div class="card-header bg-warning text-dark">
                <h6 class="mb-0"><i class="fas fa-shield-alt me-2"></i>Best Practices</h6>
            </div>
            <div class="card-body">
                <div class="alert alert-warning mb-2">
                    <small><strong>Quality Control:</strong> Review questions before generating test codes. Ensure accuracy and clarity.</small>
                </div>
                <div class="alert alert-info mb-0">
                    <small><strong>Organization:</strong> Group similar questions by topic and difficulty. Maintain consistency in formatting.</small>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
let questionIndex = 0;

$(document).ready(function() {
    // Check filters and show/hide questions container
    function checkFilters() {
        const classId = $('#class_id').val();
        const subjectId = $('#subject_id').val();
        const session = $('#session').val();
        const term = $('#term').val();
        const testType = $('#test_type').val();
        
        if (classId && subjectId && session && term && testType) {
            $('#questions-container').show();
            $('#filter-message').hide();
            if ($('.question-item').length === 0) {
                addQuestion();
            }
        } else {
            $('#questions-container').hide();
            $('#filter-message').show();
        }
    }
    
    // Monitor filter changes
    $('#class_id, #subject_id, #session, #term, #test_type').change(checkFilters);
    
    // Initial check
    checkFilters();

    // Add question button
    $('#add-question').click(addQuestion);
});

function addQuestion() {
    const questionHtml = `
        <div class="card mb-3 question-item" data-index="${questionIndex}">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Question ${questionIndex + 1}</h6>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-question">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <input type="hidden" name="questions[${questionIndex}][index]" value="${questionIndex}">

                <div class="mb-3">
                    <label class="form-label">Question Text *</label>
                    <textarea class="form-control" name="questions[${questionIndex}][question_text]" 
                              rows="3" required placeholder="Enter your question here..."></textarea>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label">Option A *</label>
                        <input type="text" class="form-control" name="questions[${questionIndex}][option_a]" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Option B *</label>
                        <input type="text" class="form-control" name="questions[${questionIndex}][option_b]" required>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label">Option C *</label>
                        <input type="text" class="form-control" name="questions[${questionIndex}][option_c]" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Option D *</label>
                        <input type="text" class="form-control" name="questions[${questionIndex}][option_d]" required>
                    </div>
                </div>

                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label">Correct Option *</label>
                        <select class="form-select" name="questions[${questionIndex}][correct_option]" required>
                            <option value="">Select Correct Option</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Question Image (Optional)</label>
                        <input type="file" class="form-control" name="question_images[${questionIndex}]" 
                               accept="image/*">
                        <div class="form-text">Max size: 5MB. Formats: JPG, PNG, GIF</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    $('#questions-container').append(questionHtml);

    // Remove question event
    $(`.question-item[data-index="${questionIndex}"] .remove-question`).click(function() {
        $(this).closest('.question-item').remove();
        updateQuestionNumbers();
    });

    questionIndex++;
}

function updateQuestionNumbers() {
    $('.question-item').each(function(index) {
        $(this).find('.card-header h6').text(`Question ${index + 1}`);
    });
}
</script>

<?php include '../includes/footer.php'; ?>