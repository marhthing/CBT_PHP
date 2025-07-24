<?php
session_start();
require_once '../config/config.php';
require_once '../config/db.php';
require_once '../includes/functions.php';
validateRole(['teacher']);

// Ensure $db is available globally
global $db;

$page_title = 'Upload Questions';
$error = '';
$success = '';

// Get teacher assignments
$assignments = getTeacherAssignments($_SESSION['user_id']);

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

        // Validate teacher assignment
        $hasAssignment = false;
        foreach ($assignments as $assignment) {
            if ($assignment['class_id'] == $classId && $assignment['subject_id'] == $subjectId) {
                $hasAssignment = true;
                break;
            }
        }

        if (!$hasAssignment) {
            $error = 'You are not assigned to teach this subject in this class.';
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
                    logActivity($_SESSION['user_id'], 'Questions Uploaded', 
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

include '../includes/header.php';
?>

<div class="row">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-upload me-2"></i>Upload Questions</h5>
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

                <?php if (empty($assignments)): ?>
                    <div class="alert alert-warning">
                        <h6><i class="fas fa-exclamation-triangle me-2"></i>No Assignments</h6>
                        <p class="mb-0">You have not been assigned to any classes or subjects. 
                        Please contact the administrator to get your teaching assignments.</p>
                    </div>
                <?php else: ?>
                    <form method="POST" enctype="multipart/form-data" id="upload-form">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">

                        <!-- Test Details -->
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <label for="class_subject" class="form-label">Class & Subject *</label>
                                <select class="form-select" id="class_subject" name="class_subject" required>
                                    <option value="">Select Class & Subject</option>
                                    <?php foreach ($assignments as $assignment): ?>
                                        <option value="<?php echo $assignment['class_id'] . '_' . $assignment['subject_id']; ?>">
                                            <?php echo htmlspecialchars($assignment['class_name'] . ' - ' . $assignment['subject_name']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="session" class="form-label">Academic Session *</label>
                                <select class="form-select" id="session" name="session" required>
                                    <option value="">Select Session</option>
                                    <?php foreach (getSessions() as $session): ?>
                                        <option value="<?php echo $session; ?>"><?php echo $session; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>

                        <div class="row mb-4">
                            <div class="col-md-6">
                                <label for="term" class="form-label">Term *</label>
                                <select class="form-select" id="term" name="term" required>
                                    <option value="">Select Term</option>
                                    <?php foreach (getTerms() as $term): ?>
                                        <option value="<?php echo $term; ?>"><?php echo $term; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="col-md-6">
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
                <?php endif; ?>
            </div>
        </div>
    </div>


</div>

<script>
let questionIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    // Check filters and show/hide questions container
    function checkFilters() {
        try {
            const classSubjectElement = document.getElementById('class_subject');
            const sessionElement = document.getElementById('session');
            const termElement = document.getElementById('term');
            const testTypeElement = document.getElementById('test_type');
            
            if (!classSubjectElement || !sessionElement || !termElement || !testTypeElement) {
                console.warn('Filter elements not found');
                return;
            }

            const classSubject = classSubjectElement.value;
            const session = sessionElement.value;
            const term = termElement.value;
            const testType = testTypeElement.value;

            const questionsContainer = document.getElementById('questions-container');
            const filterMessage = document.getElementById('filter-message');
            
            if (!questionsContainer || !filterMessage) {
                console.warn('Container elements not found');
                return;
            }
            
            const questionItems = document.querySelectorAll('.question-item');

            if (classSubject && session && term && testType) {
                questionsContainer.style.display = 'block';
                filterMessage.style.display = 'none';
                if (questionItems.length === 0) {
                    addQuestion();
                }
            } else {
                questionsContainer.style.display = 'none';
                filterMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error in checkFilters:', error);
        }
    }

    // Split class_subject selection
    const classSubjectElement = document.getElementById('class_subject');
    if (classSubjectElement) {
        classSubjectElement.addEventListener('change', function() {
            const value = this.value;
            if (value) {
                const [classId, subjectId] = value.split('_');
                
                // Remove existing hidden inputs
                const existingClassInput = document.querySelector('input[name="class_id"]');
                const existingSubjectInput = document.querySelector('input[name="subject_id"]');
                if (existingClassInput) existingClassInput.remove();
                if (existingSubjectInput) existingSubjectInput.remove();
                
                // Create new hidden inputs
                const classInput = document.createElement('input');
                classInput.type = 'hidden';
                classInput.name = 'class_id';
                classInput.value = classId;
                
                const subjectInput = document.createElement('input');
                subjectInput.type = 'hidden';
                subjectInput.name = 'subject_id';
                subjectInput.value = subjectId;
                
                const form = document.getElementById('upload-form');
                if (form) {
                    form.appendChild(classInput);
                    form.appendChild(subjectInput);
                }
            }
            checkFilters();
        });
    }

    // Monitor filter changes
    const sessionElement = document.getElementById('session');
    const termElement = document.getElementById('term');
    const testTypeElement = document.getElementById('test_type');
    
    if (sessionElement) sessionElement.addEventListener('change', checkFilters);
    if (termElement) termElement.addEventListener('change', checkFilters);
    if (testTypeElement) testTypeElement.addEventListener('change', checkFilters);

    // Initial check
    checkFilters();

    // Add question button
    const addQuestionButton = document.getElementById('add-question');
    if (addQuestionButton) {
        addQuestionButton.addEventListener('click', addQuestion);
    }
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

    const questionsContainer = document.getElementById('questions-container');
    if (!questionsContainer) {
        console.error('Questions container not found');
        return;
    }
    
    questionsContainer.insertAdjacentHTML('beforeend', questionHtml);

    // Remove question event
    const newQuestion = document.querySelector(`.question-item[data-index="${questionIndex}"]`);
    if (newQuestion) {
        const removeButton = newQuestion.querySelector('.remove-question');
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                newQuestion.remove();
                updateQuestionNumbers();
            });
        }
    }

    questionIndex++;
}

function updateQuestionNumbers() {
    const questionItems = document.querySelectorAll('.question-item');
    questionItems.forEach((item, index) => {
        const header = item.querySelector('.card-header h6');
        if (header) {
            header.textContent = `Question ${index + 1}`;
        }
    });
}
</script>

<?php include '../includes/footer.php'; ?>