<?php
session_start();
require_once '../includes/functions.php';
validateRole(['admin']);

$page_title = 'Generate Test Codes';
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
        $numQuestions = (int)($_POST['num_questions'] ?? 0);
        $scorePerQuestion = (int)($_POST['score_per_question'] ?? 0);
        $duration = (int)($_POST['duration'] ?? 0);
        $numCodes = (int)($_POST['num_codes'] ?? 1);

        if (empty($classId) || empty($subjectId) || empty($session) || empty($term) || 
            empty($testType) || $numQuestions <= 0 || $scorePerQuestion <= 0 || $duration <= 0 || $numCodes <= 0) {
            $error = 'All fields are required and must have valid values.';
        } elseif ($numCodes > 50) {
            $error = 'Maximum 50 codes can be generated at once.';
        } else {
            // Check if questions are available
            $questionQuery = "SELECT COUNT(*) as total FROM questions 
                              WHERE class_id = ? AND subject_id = ? AND session = ? AND term = ? AND test_type = ?";
            $questionCount = $db->fetch($questionQuery, [$classId, $subjectId, $session, $term, $testType]);

            if ($questionCount['total'] < $numQuestions) {
                $error = "Only {$questionCount['total']} questions available. Cannot generate test requiring {$numQuestions} questions.";
            } else {
                try {
                    $db->getConnection()->beginTransaction();

                    // Get class and subject names
                    $classQuery = "SELECT name FROM classes WHERE id = ?";
                    $class = $db->fetch($classQuery, [$classId]);
                    $subjectQuery = "SELECT name FROM subjects WHERE id = ?";
                    $subject = $db->fetch($subjectQuery, [$subjectId]);

                    $generatedCodes = [];

                    for ($i = 0; $i < $numCodes; $i++) {
                        // Generate unique code
                        do {
                            $code = strtoupper(bin2hex(random_bytes(4))); // 8 character code
                            $codeCheck = $db->fetch("SELECT id FROM test_codes WHERE code = ?", [$code]);
                        } while ($codeCheck);

                        // Insert test code
                        $insertQuery = "INSERT INTO test_codes (code, class_id, subject_id, session, term, test_type, 
                                        num_questions, score_per_question, duration, class_name, subject_name, 
                                        created_by, created_at, active) 
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), false)";

                        $db->execute($insertQuery, [
                            $code, $classId, $subjectId, $session, $term, $testType,
                            $numQuestions, $scorePerQuestion, $duration, 
                            $class['name'], $subject['name'], $_SESSION['user_id']
                        ]);

                        $generatedCodes[] = $code;
                    }

                    $db->getConnection()->commit();

                    // Log activity
                    logActivity($_SESSION['user_id'], 'Test Codes Generated', 
                               "Generated {$numCodes} codes for {$class['name']} - {$subject['name']} ({$testType})");

                    $success = "Successfully generated {$numCodes} test codes.";
                    $_SESSION['generated_codes'] = $generatedCodes;

                } catch (Exception $e) {
                    $db->getConnection()->rollback();
                    error_log("Code generation error: " . $e->getMessage());
                    $error = 'Failed to generate test codes. Please try again.';
                }
            }
        }
    }
}

$classes = getClasses();
$subjects = getSubjects();

include '../includes/header.php';
?>

<div class="row">
    <div class="col-md-6">
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-plus me-2"></i>Generate Test Codes</h5>
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

                <?php $csrfToken = generateCSRFToken(); ?>
                <form method="POST" class="needs-validation" novalidate>
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="class_id" class="form-label">Class *</label>
                            <select class="form-select" id="class_id" name="class_id" required>
                                <option value="">Select Class</option>
                                <?php foreach ($classes as $class): ?>
                                    <option value="<?php echo $class['id']; ?>" 
                                            <?php echo ($_POST['class_id'] ?? '') == $class['id'] ? 'selected' : ''; ?>>
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
                                    <option value="<?php echo $subject['id']; ?>"
                                            <?php echo ($_POST['subject_id'] ?? '') == $subject['id'] ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($subject['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="session" class="form-label">Academic Session *</label>
                            <select class="form-select" id="session" name="session" required>
                                <option value="">Select Session</option>
                                <?php foreach (getSessions() as $sess): ?>
                                    <option value="<?php echo $sess; ?>"
                                            <?php echo ($_POST['session'] ?? '') === $sess ? 'selected' : ''; ?>>
                                        <?php echo $sess; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label for="term" class="form-label">Term *</label>
                            <select class="form-select" id="term" name="term" required>
                                <option value="">Select Term</option>
                                <?php foreach (getTerms() as $termOption): ?>
                                    <option value="<?php echo $termOption; ?>"
                                            <?php echo ($_POST['term'] ?? '') === $termOption ? 'selected' : ''; ?>>
                                        <?php echo $termOption; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="test_type" class="form-label">Test Type *</label>
                        <select class="form-select" id="test_type" name="test_type" required>
                            <option value="">Select Type</option>
                            <?php foreach (getTestTypes() as $key => $type): ?>
                                <option value="<?php echo $key; ?>"
                                        <?php echo ($_POST['test_type'] ?? '') === $key ? 'selected' : ''; ?>>
                                    <?php echo $type; ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="num_questions" class="form-label">Number of Questions *</label>
                            <input type="number" class="form-control" id="num_questions" name="num_questions" 
                                   min="1" max="100" value="<?php echo $_POST['num_questions'] ?? '20'; ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label for="score_per_question" class="form-label">Score per Question *</label>
                            <input type="number" class="form-control" id="score_per_question" name="score_per_question" 
                                   min="1" max="10" value="<?php echo $_POST['score_per_question'] ?? '2'; ?>" required>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="duration" class="form-label">Duration (minutes) *</label>
                            <input type="number" class="form-control" id="duration" name="duration" 
                                   min="5" max="300" value="<?php echo $_POST['duration'] ?? '60'; ?>" required>
                        </div>
                        <div class="col-md-6">
                            <label for="num_codes" class="form-label">Number of Codes *</label>
                            <input type="number" class="form-control" id="num_codes" name="num_codes" 
                                   min="1" max="50" value="<?php echo $_POST['num_codes'] ?? '1'; ?>" required>
                            <div class="form-text">Maximum 50 codes per generation</div>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-cogs me-2"></i>Generate Test Codes
                    </button>
                </form>

                <!-- Check Available Questions -->
                <div class="mt-3">
                    <button type="button" class="btn btn-outline-info btn-sm w-100" id="checkQuestions">
                        <i class="fas fa-search me-2"></i>Check Available Questions
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-6">
        <!-- Generated Codes Display -->
        <?php if (isset($_SESSION['generated_codes']) && !empty($_SESSION['generated_codes'])): ?>
            <div class="card">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="fas fa-check me-2"></i>Generated Codes</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Important:</strong> These codes are inactive by default. 
                        Go to <a href="code_activation.php" class="alert-link">Code Activation</a> to activate them.
                    </div>

                    <div class="row">
                        <?php foreach ($_SESSION['generated_codes'] as $code): ?>
                            <div class="col-md-6 mb-2">
                                <div class="card border-success">
                                    <div class="card-body text-center py-2">
                                        <code class="fs-5 fw-bold"><?php echo $code; ?></code>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="text-center mt-3">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="copyAllCodes()">
                            <i class="fas fa-copy me-2"></i>Copy All Codes
                        </button>
                        <a href="code_activation.php" class="btn btn-success btn-sm">
                            <i class="fas fa-toggle-on me-2"></i>Activate Codes
                        </a>
                    </div>
                </div>
            </div>
            <?php unset($_SESSION['generated_codes']); ?>
        <?php endif; ?>



        <!-- Question Availability -->
        <div class="card mt-3" id="questionAvailability" style="display: none;">
            <div class="card-header bg-warning text-dark">
                <h6 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Question Availability</h6>
            </div>
            <div class="card-body" id="questionAvailabilityBody">
                <!-- Content will be loaded here -->
            </div>
        </div>
    </div>
</div>

<script>
$(document).ready(function() {
    // Check available questions
    $('#checkQuestions').click(function() {
        const classId = $('#class_id').val();
        const subjectId = $('#subject_id').val();
        const session = $('#session').val();
        const term = $('#term').val();
        const testType = $('#test_type').val();

        if (!classId || !subjectId || !session || !term || !testType) {
            showToast('Please select all required fields first.', 'warning');
            return;
        }

        // Show loading
        $('#questionAvailabilityBody').html('<div class="text-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></div>');
        $('#questionAvailability').show();

        $.ajax({
            url: '../ajax/check_questions.php',
            method: 'GET',
            data: {
                class_id: classId,
                subject_id: subjectId,
                session: session,
                term: term,
                test_type: testType
            },
            success: function(response) {
                $('#questionAvailabilityBody').html(response);
            },
            error: function() {
                $('#questionAvailabilityBody').html('<div class="alert alert-danger">Failed to check question availability</div>');
            }
        });
    });

    // Form validation
    $('form.needs-validation').on('submit', function(event) {
        if (this.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
            showToast('Please fill in all required fields correctly', 'danger');
        } else {
            // Show loading state
            const submitBtn = $(this).find('button[type="submit"]');
            const originalText = submitBtn.html();
            submitBtn.html('<span class="spinner-border spinner-border-sm me-2"></span>Generating...').prop('disabled', true);

            // Re-enable button after 10 seconds (failsafe)
            setTimeout(function() {
                submitBtn.html(originalText).prop('disabled', false);
            }, 10000);
        }
        $(this).addClass('was-validated');
    });
});

// Copy all codes function (defined globally)
window.copyAllCodes = function() {
    const codes = [];
    $('code.fs-5').each(function() {
        codes.push($(this).text());
    });

    if (codes.length === 0) {
        showToast('No codes found to copy', 'warning');
        return;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(codes.join('\n')).then(function() {
            showToast('All codes copied to clipboard!', 'success');
        }).catch(function() {
            showToast('Failed to copy codes to clipboard', 'danger');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = codes.join('\n');
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('All codes copied to clipboard!', 'success');
        } catch (err) {
            showToast('Failed to copy codes to clipboard', 'danger');
        }
        document.body.removeChild(textArea);
    }
};
</script>

<?php include '../includes/footer.php'; ?>