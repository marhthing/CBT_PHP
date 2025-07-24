
<?php
session_start();
require_once '../config/db.php';
require_once '../includes/functions.php';

validateRole(['teacher']);

$db = new Database();

$page_title = 'Edit Question';
$error = '';
$success = '';

$questionId = $_GET['id'] ?? '';
if (!$questionId) {
    header('Location: manage_questions.php?error=Invalid question ID');
    exit();
}

// Get question details and verify ownership
$query = "SELECT q.*, c.name as class_name, s.name as subject_name 
          FROM questions q
          JOIN classes c ON q.class_id = c.id
          JOIN subjects s ON q.subject_id = s.id
          WHERE q.id = ? AND q.created_by = ?";
$question = $db->fetch($query, [$questionId, $_SESSION['user_id']]);

if (!$question) {
    header('Location: manage_questions.php?error=Question not found or access denied');
    exit();
}

// Get teacher assignments
$assignments = getTeacherAssignments($_SESSION['user_id']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $error = 'Invalid request. Please try again.';
    } else {
        $questionText = $_POST['question_text'] ?? '';
        $optionA = $_POST['option_a'] ?? '';
        $optionB = $_POST['option_b'] ?? '';
        $optionC = $_POST['option_c'] ?? '';
        $optionD = $_POST['option_d'] ?? '';
        $correctOption = $_POST['correct_option'] ?? '';

        if (empty($questionText) || empty($optionA) || empty($optionB) || 
            empty($optionC) || empty($optionD) || empty($correctOption)) {
            $error = 'All fields are required.';
        } else {
            try {
                // Handle image upload if provided
                $imageName = $question['image']; // Keep existing image by default
                if (isset($_FILES['question_image']) && $_FILES['question_image']['error'] === UPLOAD_ERR_OK) {
                    $newImageName = uploadImage($_FILES['question_image']);
                    if ($newImageName) {
                        // Delete old image if exists
                        if ($question['image'] && file_exists('../uploads/' . $question['image'])) {
                            unlink('../uploads/' . $question['image']);
                        }
                        $imageName = $newImageName;
                    }
                }

                // Update question
                $updateQuery = "UPDATE questions SET 
                                question_text = ?, option_a = ?, option_b = ?, option_c = ?, 
                                option_d = ?, correct_option = ?, image = ?, 
                                edited_by = ?, edited_at = NOW()
                                WHERE id = ?";

                $db->execute($updateQuery, [
                    $questionText, $optionA, $optionB, $optionC, 
                    $optionD, $correctOption, $imageName,
                    $_SESSION['user_id'], $questionId
                ]);

                // Log activity
                logActivity($_SESSION['user_id'], 'Question Edited', 
                           "Edited question ID: {$questionId}");

                $success = 'Question updated successfully.';
                
                // Refresh question data
                $question = $db->fetch($query, [$questionId, $_SESSION['user_id']]);

            } catch (Exception $e) {
                error_log("Question edit error: " . $e->getMessage());
                $error = 'Failed to update question. Please try again.';
            }
        }
    }
}

include '../includes/header.php';
?>

<div class="row">
    <div class="col-md-<?php echo $question['image'] ? '8' : '12'; ?>">
        <div class="card">
            <div class="card-header bg-warning text-dark">
                <h5 class="mb-0"><i class="fas fa-edit me-2"></i>Edit Question</h5>
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

                <form method="POST" enctype="multipart/form-data">
                    <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">

                    <!-- Question Details -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Class</label>
                            <input type="text" class="form-control" value="<?php echo htmlspecialchars($question['class_name']); ?>" readonly>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Subject</label>
                            <input type="text" class="form-control" value="<?php echo htmlspecialchars($question['subject_name']); ?>" readonly>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Session</label>
                            <input type="text" class="form-control" value="<?php echo htmlspecialchars($question['session']); ?>" readonly>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Term</label>
                            <input type="text" class="form-control" value="<?php echo htmlspecialchars($question['term']); ?>" readonly>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Test Type</label>
                            <input type="text" class="form-control" value="<?php echo htmlspecialchars($question['test_type']); ?>" readonly>
                        </div>
                    </div>

                    <hr>

                    <!-- Question Content -->
                    <div class="mb-3">
                        <label for="question_text" class="form-label">Question Text *</label>
                        <textarea class="form-control" id="question_text" name="question_text" 
                                  rows="4" required><?php echo htmlspecialchars($question['question_text']); ?></textarea>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="option_a" class="form-label">Option A *</label>
                            <input type="text" class="form-control" id="option_a" name="option_a" 
                                   value="<?php echo htmlspecialchars($question['option_a']); ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label for="option_b" class="form-label">Option B *</label>
                            <input type="text" class="form-control" id="option_b" name="option_b" 
                                   value="<?php echo htmlspecialchars($question['option_b']); ?>" required>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="option_c" class="form-label">Option C *</label>
                            <input type="text" class="form-control" id="option_c" name="option_c" 
                                   value="<?php echo htmlspecialchars($question['option_c']); ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label for="option_d" class="form-label">Option D *</label>
                            <input type="text" class="form-control" id="option_d" name="option_d" 
                                   value="<?php echo htmlspecialchars($question['option_d']); ?>" required>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="correct_option" class="form-label">Correct Option *</label>
                            <select class="form-select" id="correct_option" name="correct_option" required>
                                <option value="">Select Correct Option</option>
                                <option value="A" <?php echo $question['correct_option'] === 'A' ? 'selected' : ''; ?>>A</option>
                                <option value="B" <?php echo $question['correct_option'] === 'B' ? 'selected' : ''; ?>>B</option>
                                <option value="C" <?php echo $question['correct_option'] === 'C' ? 'selected' : ''; ?>>C</option>
                                <option value="D" <?php echo $question['correct_option'] === 'D' ? 'selected' : ''; ?>>D</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="question_image" class="form-label">Question Image (Optional)</label>
                            <input type="file" class="form-control" id="question_image" name="question_image" accept="image/*">
                            <div class="form-text">Max size: 5MB. Leave empty to keep current image.</div>
                            <?php if ($question['image']): ?>
                                <div class="mt-2">
                                    <small class="text-success">Current image: <?php echo htmlspecialchars($question['image']); ?></small>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                        <a href="manage_questions.php" class="btn btn-outline-secondary me-md-2">
                            <i class="fas fa-arrow-left me-2"></i>Back to Questions
                        </a>
                        <button type="submit" class="btn btn-warning">
                            <i class="fas fa-save me-2"></i>Update Question
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <?php if ($question['image']): ?>
    <div class="col-md-4">
        <div class="card">
            <div class="card-header bg-light">
                <h6 class="mb-0">Current Image</h6>
            </div>
            <div class="card-body text-center">
                <img src="../uploads/<?php echo htmlspecialchars($question['image']); ?>" 
                     class="img-fluid rounded" style="max-height: 200px;" alt="Question Image">
            </div>
        </div>
    </div>
    <?php endif; ?>
</div>

<?php include '../includes/footer.php'; ?>
