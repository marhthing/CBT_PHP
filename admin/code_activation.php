<?php
session_start();
require_once '../includes/functions.php';
validateRole(['admin']);

$page_title = 'Code Activation';
$error = '';
$success = '';

// Handle activation/deactivation requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $error = 'Invalid request. Please try again.';
    } else {
        $action = $_POST['action'] ?? '';
        $codeIds = $_POST['code_ids'] ?? [];

        if ($action === 'toggle' && !empty($codeIds)) {
            try {
                $db->getConnection()->beginTransaction();

                $toggledCount = 0;
                foreach ($codeIds as $codeId) {
                    // Get current status
                    $codeQuery = "SELECT id, code, active, subject_name, class_name FROM test_codes WHERE id = ?";
                    $code = $db->fetch($codeQuery, [$codeId]);

                    if ($code) {
                        $newStatus = !$code['active'];
                        $updateQuery = "UPDATE test_codes SET active = ? WHERE id = ?";
                        $db->execute($updateQuery, [$newStatus, $codeId]);

                        // Log activity
                        $statusText = $newStatus ? 'activated' : 'deactivated';
                        logActivity($_SESSION['user_id'], 'Test Code ' . ucfirst($statusText), 
                                   "Code {$code['code']} for {$code['class_name']} - {$code['subject_name']}");

                        $toggledCount++;
                    }
                }

                $db->getConnection()->commit();
                $success = "Successfully updated {$toggledCount} test codes.";

            } catch (Exception $e) {
                $db->getConnection()->rollback();
                error_log("Code activation error: " . $e->getMessage());
                $error = 'Failed to update test codes. Please try again.';
            }
        }
    }
}

// Get filter parameters
$classId = $_GET['class_id'] ?? '';
$subjectId = $_GET['subject_id'] ?? '';
$status = $_GET['status'] ?? '';

// Build query
$whereConditions = ['1=1'];
$params = [];

if ($classId) {
    $whereConditions[] = 'class_id = ?';
    $params[] = $classId;
}
if ($subjectId) {
    $whereConditions[] = 'subject_id = ?';
    $params[] = $subjectId;
}
if ($status !== '') {
    $whereConditions[] = 'active = ?';
    $params[] = ($status === 'active');
}

$query = "SELECT tc.*, u.full_name as created_by_name, 
          COUNT(tr.id) as students_taken
          FROM test_codes tc
          LEFT JOIN users u ON tc.created_by = u.id
          LEFT JOIN test_results tr ON tc.id = tr.test_code_id
          WHERE " . implode(' AND ', $whereConditions) . "
          GROUP BY tc.id, tc.code, tc.class_id, tc.subject_id, tc.class_name, tc.subject_name, 
                   tc.test_type, tc.num_questions, tc.score_per_question, tc.duration, 
                   tc.active, tc.disabled, tc.created_by, tc.created_at, u.full_name
          ORDER BY tc.created_at DESC";

$codes = $db->fetchAll($query, $params);

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
                                <h6 class="card-title">Total Codes</h6>
                                <h4 class="mb-0"><?php echo count($codes); ?></h4>
                            </div>
                            <i class="fas fa-code fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Active Codes</h6>
                                <h4 class="mb-0">
                                    <?php echo count(array_filter($codes, function($c) { return $c['active']; })); ?>
                                </h4>
                            </div>
                            <i class="fas fa-toggle-on fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-dark">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Inactive Codes</h6>
                                <h4 class="mb-0">
                                    <?php echo count(array_filter($codes, function($c) { return !$c['active']; })); ?>
                                </h4>
                            </div>
                            <i class="fas fa-toggle-off fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Tests Taken</h6>
                                <h4 class="mb-0">
                                    <?php echo array_sum(array_column($codes, 'students_taken')); ?>
                                </h4>
                            </div>
                            <i class="fas fa-users fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filter and Bulk Actions -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-filter me-2"></i>Filter & Bulk Actions</h5>
            </div>
            <div class="card-body">
                <form method="GET" class="row g-3 mb-3">
                    <div class="col-md-3">
                        <label for="class_id" class="form-label">Class</label>
                        <select class="form-select" id="class_id" name="class_id">
                            <option value="">All Classes</option>
                            <?php foreach ($classes as $class): ?>
                                <option value="<?php echo $class['id']; ?>" <?php echo $classId == $class['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($class['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="col-md-3">
                        <label for="subject_id" class="form-label">Subject</label>
                        <select class="form-select" id="subject_id" name="subject_id">
                            <option value="">All Subjects</option>
                            <?php foreach ($subjects as $subject): ?>
                                <option value="<?php echo $subject['id']; ?>" <?php echo $subjectId == $subject['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($subject['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="col-md-3">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-select" id="status" name="status">
                            <option value="">All Status</option>
                            <option value="active" <?php echo $status === 'active' ? 'selected' : ''; ?>>Active</option>
                            <option value="inactive" <?php echo $status === 'inactive' ? 'selected' : ''; ?>>Inactive</option>
                        </select>
                    </div>

                    <div class="col-md-3 d-flex align-items-end">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-search me-2"></i>Filter
                        </button>
                        <a href="code_activation.php" class="btn btn-outline-secondary ms-2">
                            <i class="fas fa-redo me-2"></i>Reset
                        </a>
                    </div>
                </form>

                <hr>

                <!-- Bulk Actions -->
                <form method="POST" id="bulkForm">
                    <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                    <input type="hidden" name="action" value="toggle">

                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <button type="button" class="btn btn-success btn-sm" onclick="selectAll()">
                                <i class="fas fa-check-square me-1"></i>Select All
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="selectNone()">
                                <i class="fas fa-square me-1"></i>Select None
                            </button>
                        </div>
                        <div>
                            <span id="selectedCount" class="text-muted me-3">0 selected</span>
                            <button type="submit" class="btn btn-warning btn-sm" id="toggleSelected" disabled>
                                <i class="fas fa-toggle-on me-1"></i>Toggle Selected
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Test Codes List -->
        <div class="card">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0">
                    <i class="fas fa-code me-2"></i>Test Codes (<?php echo count($codes); ?>)
                </h5>
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

                <?php if (empty($codes)): ?>
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-code fa-3x mb-3"></i>
                        <h5>No Test Codes Found</h5>
                        <p>No test codes match your current filter criteria.</p>
                        <a href="generate_codes.php" class="btn btn-primary">
                            <i class="fas fa-plus me-2"></i>Generate Test Codes
                        </a>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" id="selectAllCheckbox" onchange="toggleAllSelection()">
                                    </th>
                                    <th>Code</th>
                                    <th>Class</th>
                                    <th>Subject</th>
                                    <th>Test Type</th>
                                    <th>Questions</th>
                                    <th>Duration</th>
                                    <th>Students</th>
                                    <th>Status</th>
                                    <th>Disabled</th>
                                    <th>Created</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($codes as $code): ?>
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="code-checkbox" name="code_ids[]" value="<?php echo $code['id']; ?>" form="bulkForm">
                                        </td>
                                        <td>
                                            <code class="bg-light p-1 rounded fw-bold">
                                                <?php echo htmlspecialchars($code['code']); ?>
                                            </code>
                                        </td>
                                        <td>
                                            <span class="badge bg-primary">
                                                <?php echo htmlspecialchars($code['class_name']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge bg-info">
                                                <?php echo htmlspecialchars($code['subject_name']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge bg-<?php echo $code['test_type'] === 'Exam' ? 'danger' : 'warning'; ?>">
                                                <?php echo htmlspecialchars($code['test_type']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="fw-bold"><?php echo $code['num_questions']; ?></span>
                                            <small class="text-muted">(<?php echo $code['score_per_question']; ?>pts each)</small>
                                        </td>
                                        <td>
                                            <i class="fas fa-clock me-1"></i>
                                            <?php echo $code['duration']; ?> min
                                        </td>
                                        <td>
                                            <span class="badge bg-secondary">
                                                <?php echo $code['students_taken']; ?>
                                            </span>
                                        </td>
                                        <td>
                                            <?php if ($code['active']): ?>
                                                <span class="badge bg-success">
                                                    <i class="fas fa-toggle-on me-1"></i>Active
                                                </span>
                                            <?php else: ?>
                                                <span class="badge bg-secondary">
                                                    <i class="fas fa-toggle-off me-1"></i>Inactive
                                                </span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($code['disabled']): ?>
                                                <span class="badge bg-danger">Disabled</span>
                                            <?php else: ?>
                                                <span class="badge bg-success">Available</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <small>
                                                <?php echo date('M j, Y', strtotime($code['created_at'])); ?>
                                                <br>
                                                <span class="text-muted"><?php echo htmlspecialchars($code['created_by_name']); ?></span>
                                            </small>
                                        </td>
                                        <td>
                                            <button type="button" 
                                                    class="btn btn-sm btn-<?php echo $code['active'] ? 'warning' : 'success'; ?>"
                                                    onclick="toggleSingleCode(<?php echo $code['id']; ?>)">
                                                <i class="fas fa-toggle-<?php echo $code['active'] ? 'off' : 'on'; ?>"></i>
                                            </button>
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

<!-- Single Toggle Form -->
<form id="singleToggleForm" method="POST" style="display: none;">
    <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
    <input type="hidden" name="action" value="toggle">
    <input type="hidden" name="code_ids[]" id="singleCodeId">
</form>

<script>
// Update selected count
function updateSelectedCount() {
    const selected = document.querySelectorAll('.code-checkbox:checked').length;
    document.getElementById('selectedCount').textContent = selected + ' selected';
    document.getElementById('toggleSelected').disabled = selected === 0;
}

// Select all checkboxes
function selectAll() {
    document.querySelectorAll('.code-checkbox').forEach(cb => cb.checked = true);
    document.getElementById('selectAllCheckbox').checked = true;
    updateSelectedCount();
}

// Select none
function selectNone() {
    document.querySelectorAll('.code-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('selectAllCheckbox').checked = false;
    updateSelectedCount();
}

// Toggle all selection from header checkbox
function toggleAllSelection() {
    const selectAll = document.getElementById('selectAllCheckbox').checked;
    document.querySelectorAll('.code-checkbox').forEach(cb => cb.checked = selectAll);
    updateSelectedCount();
}

// Toggle single code
function toggleSingleCode(codeId) {
    if (confirm('Are you sure you want to toggle the status of this test code?')) {
        document.getElementById('singleCodeId').value = codeId;
        document.getElementById('singleToggleForm').submit();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add change event to all checkboxes
    document.querySelectorAll('.code-checkbox').forEach(cb => {
        cb.addEventListener('change', updateSelectedCount);
    });

    // Bulk form submission
    document.getElementById('bulkForm').addEventListener('submit', function(e) {
        const selected = document.querySelectorAll('.code-checkbox:checked').length;
        if (selected === 0) {
            e.preventDefault();
            alert('Please select at least one test code.');
            return;
        }

        if (!confirm(`Are yousure you want to toggle the status of ${selected} test codes?`)) {
            e.preventDefault();
        }
    });

    updateSelectedCount();
});
</script>

<?php include '../includes/footer.php'; ?>