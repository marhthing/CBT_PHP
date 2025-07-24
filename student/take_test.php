<?php
// Added check for disabled test codes in take_test
session_start();
require_once '../includes/functions.php';
validateRole(['student']);

$page_title = 'Take Test';
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $testCode = trim($_POST['test_code'] ?? '');

    if (empty($testCode)) {
        $error = 'Please enter a test code';
    } else {
        // Validate test code
        $query = "SELECT tc.*, c.name as class_name, s.name as subject_name 
                  FROM test_codes tc
                  JOIN classes c ON tc.class_id = c.id
                  JOIN subjects s ON tc.subject_id = s.id
                  WHERE tc.code = ? AND tc.active = true";
        $test = $db->fetch($query, [$testCode]);

        if (!$test) {
            $error = 'Invalid or inactive test code.';
        } elseif ($test['disabled']) {
            $error = 'This test code has been disabled.';
        } else {
            // Check if student has already taken this test
            $query = "SELECT id FROM test_results WHERE student_id = ? AND test_code_id = ?";
            $existingResult = $db->fetch($query, [$_SESSION['user_id'], $test['id']]);

            if ($existingResult) {
                $error = 'You have already taken this test. Retakes are not allowed.';
            } else {
                // Check if student's class matches test class
                $studentQuery = "SELECT class_id FROM users WHERE id = ?";
                $student = $db->fetch($studentQuery, [$_SESSION['user_id']]);

                if ($student['class_id'] != $test['class_id']) {
                    $error = 'This test is not for your class';
                } else {
                    // Redirect to test preview
                    header("Location: test_preview.php?code=" . urlencode($testCode));
                    exit();
                }
            }
        }
    }
}

include '../includes/header.php';
?>

<div class="row justify-content-center">
    <div class="col-md-8 col-lg-6">
        <div class="card">
            <div class="card-header bg-primary text-white text-center">
                <h4 class="mb-0"><i class="fas fa-edit me-2"></i>Enter Test Code</h4>
            </div>
            <div class="card-body p-5">
                <?php if ($error): ?>
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <?php echo htmlspecialchars($error); ?>
                    </div>
                <?php endif; ?>

                <form method="POST" class="needs-validation" novalidate>
                    <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">

                    <div class="mb-4">
                        <label for="test_code" class="form-label">Test Code</label>
                        <input type="text" 
                               class="form-control form-control-lg text-center" 
                               id="test_code" 
                               name="test_code" 
                               placeholder="Enter your test code"
                               value="<?php echo htmlspecialchars($_POST['test_code'] ?? ''); ?>"
                               required
                               style="letter-spacing: 2px; font-family: monospace;">
                        <div class="invalid-feedback">
                            Please enter a valid test code.
                        </div>
                        <div class="form-text">
                            <i class="fas fa-info-circle me-1"></i>
                            Enter the test code provided by your teacher
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary btn-lg w-100">
                        <i class="fas fa-search me-2"></i>
                        Find Test
                    </button>
                </form>

                <hr class="my-4">


            </div>
        </div>

        <div class="text-center mt-4">
            <a href="dashboard.php" class="btn btn-outline-secondary">
                <i class="fas fa-arrow-left me-2"></i>
                Back to Dashboard
            </a>
        </div>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
`