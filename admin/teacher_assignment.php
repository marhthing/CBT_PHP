<?php
session_start();
require_once '../includes/functions.php';
validateRole(['admin']);

$page_title = 'Teacher Assignment';
$error = '';
$success = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!validateCSRFToken($_POST['csrf_token'] ?? '')) {
        $error = 'Invalid request. Please try again.';
    } else {
        $action = $_POST['action'] ?? '';
        
        if ($action === 'assign') {
            $teacherId = $_POST['teacher_id'] ?? '';
            $classId = $_POST['class_id'] ?? '';
            $subjectId = $_POST['subject_id'] ?? '';
            
            if (empty($teacherId) || empty($classId) || empty($subjectId)) {
                $error = 'All fields are required.';
            } else {
                // Check if assignment already exists
                $checkQuery = "SELECT id FROM teacher_assignments WHERE teacher_id = ? AND class_id = ? AND subject_id = ?";
                $existing = $db->fetch($checkQuery, [$teacherId, $classId, $subjectId]);
                
                if ($existing) {
                    $error = 'This assignment already exists.';
                } else {
                    try {
                        $query = "INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, created_at) 
                                  VALUES (?, ?, ?, NOW())";
                        $db->execute($query, [$teacherId, $classId, $subjectId]);
                        
                        // Log activity
                        $teacherQuery = "SELECT full_name FROM users WHERE id = ?";
                        $teacher = $db->fetch($teacherQuery, [$teacherId]);
                        $classQuery = "SELECT name FROM classes WHERE id = ?";
                        $class = $db->fetch($classQuery, [$classId]);
                        $subjectQuery = "SELECT name FROM subjects WHERE id = ?";
                        $subject = $db->fetch($subjectQuery, [$subjectId]);
                        
                        logActivity($_SESSION['user_id'], 'Teacher Assignment Created', 
                                   "Assigned {$teacher['full_name']} to {$class['name']} - {$subject['name']}");
                        
                        $success = 'Teacher assignment created successfully.';
                    } catch (Exception $e) {
                        error_log("Assignment error: " . $e->getMessage());
                        $error = 'Failed to create assignment. Please try again.';
                    }
                }
            }
        } elseif ($action === 'delete') {
            $assignmentId = $_POST['assignment_id'] ?? '';
            
            if (!empty($assignmentId)) {
                try {
                    // Get assignment details for logging
                    $query = "SELECT ta.*, u.full_name as teacher_name, c.name as class_name, s.name as subject_name
                              FROM teacher_assignments ta
                              JOIN users u ON ta.teacher_id = u.id
                              JOIN classes c ON ta.class_id = c.id
                              JOIN subjects s ON ta.subject_id = s.id
                              WHERE ta.id = ?";
                    $assignment = $db->fetch($query, [$assignmentId]);
                    
                    if ($assignment) {
                        $deleteQuery = "DELETE FROM teacher_assignments WHERE id = ?";
                        $db->execute($deleteQuery, [$assignmentId]);
                        
                        logActivity($_SESSION['user_id'], 'Teacher Assignment Deleted', 
                                   "Removed {$assignment['teacher_name']} from {$assignment['class_name']} - {$assignment['subject_name']}");
                        
                        $success = 'Teacher assignment deleted successfully.';
                    }
                } catch (Exception $e) {
                    error_log("Delete assignment error: " . $e->getMessage());
                    $error = 'Failed to delete assignment. Please try again.';
                }
            }
        } elseif ($action === 'bulk_delete') {
            $assignmentIds = $_POST['assignment_ids'] ?? [];
            
            if (!empty($assignmentIds) && is_array($assignmentIds)) {
                try {
                    $deletedCount = 0;
                    $deletedAssignments = [];
                    
                    // Get assignment details for logging before deletion
                    foreach ($assignmentIds as $assignmentId) {
                        if (is_numeric($assignmentId)) {
                            $query = "SELECT ta.*, u.full_name as teacher_name, c.name as class_name, s.name as subject_name
                                      FROM teacher_assignments ta
                                      JOIN users u ON ta.teacher_id = u.id
                                      JOIN classes c ON ta.class_id = c.id
                                      JOIN subjects s ON ta.subject_id = s.id
                                      WHERE ta.id = ?";
                            $assignment = $db->fetch($query, [$assignmentId]);
                            
                            if ($assignment) {
                                $deletedAssignments[] = $assignment;
                            }
                        }
                    }
                    
                    // Perform bulk delete
                    $placeholders = str_repeat('?,', count($assignmentIds) - 1) . '?';
                    $deleteQuery = "DELETE FROM teacher_assignments WHERE id IN ($placeholders)";
                    $stmt = $db->getConnection()->prepare($deleteQuery);
                    $stmt->execute($assignmentIds);
                    
                    $deletedCount = $stmt->rowCount();
                    
                    // Log each deletion
                    foreach ($deletedAssignments as $assignment) {
                        logActivity($_SESSION['user_id'], 'Teacher Assignment Deleted', 
                                   "Bulk deletion: Removed {$assignment['teacher_name']} from {$assignment['class_name']} - {$assignment['subject_name']}");
                    }
                    
                    $success = "Successfully deleted {$deletedCount} teacher assignment(s).";
                } catch (Exception $e) {
                    error_log("Bulk delete assignment error: " . $e->getMessage());
                    $error = 'Failed to delete assignments. Please try again.';
                }
            } else {
                $error = 'No assignments selected for deletion.';
            }
        }
    }
}

// Get data for form
$teachers = $db->fetchAll("SELECT id, full_name, username FROM users WHERE role = 'teacher' AND active = true ORDER BY full_name");
$classes = getClasses();
$subjects = getSubjects();

// Get current assignments
$query = "SELECT ta.*, u.full_name as teacher_name, u.username, c.name as class_name, s.name as subject_name
          FROM teacher_assignments ta
          JOIN users u ON ta.teacher_id = u.id
          JOIN classes c ON ta.class_id = c.id
          JOIN subjects s ON ta.subject_id = s.id
          ORDER BY u.full_name, c.name, s.name";
$assignments = $db->fetchAll($query);

include '../includes/header.php';
?>

<div class="row">
    <div class="col-md-4">
        <!-- Assignment Form -->
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-plus me-2"></i>New Assignment</h5>
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
                
                <form method="POST">
                    <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                    <input type="hidden" name="action" value="assign">
                    
                    <div class="mb-3">
                        <label for="teacher_id" class="form-label">Teacher *</label>
                        <select class="form-select" id="teacher_id" name="teacher_id" required>
                            <option value="">Select Teacher</option>
                            <?php foreach ($teachers as $teacher): ?>
                                <option value="<?php echo $teacher['id']; ?>">
                                    <?php echo htmlspecialchars($teacher['full_name']); ?>
                                    (<?php echo htmlspecialchars($teacher['username']); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="mb-3">
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
                    
                    <div class="mb-3">
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
                    
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-plus me-2"></i>Create Assignment
                    </button>
                </form>
            </div>
        </div>
        
        <!-- Statistics -->
        <div class="card mt-4">
            <div class="card-header bg-info text-white">
                <h6 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Assignment Statistics</h6>
            </div>
            <div class="card-body">
                <div class="row text-center">
                    <div class="col-6">
                        <div class="border rounded p-2">
                            <h4 class="text-primary mb-1"><?php echo count($teachers); ?></h4>
                            <small class="text-muted">Teachers</small>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="border rounded p-2">
                            <h4 class="text-success mb-1"><?php echo count($assignments); ?></h4>
                            <small class="text-muted">Assignments</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-8">
        <!-- Current Assignments -->
        <div class="card">
            <div class="card-header bg-success text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="fas fa-list me-2"></i>Current Assignments (<?php echo count($assignments); ?>)
                    </h5>
                    <div class="d-flex gap-2" id="bulkActions" style="display: none;">
                        <button type="button" class="btn btn-sm btn-danger" onclick="bulkDeleteAssignments()">
                            <i class="fas fa-trash me-1"></i>Delete Selected
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="clearSelection()">
                            <i class="fas fa-times me-1"></i>Clear
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <?php if (empty($assignments)): ?>
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-user-tie fa-3x mb-3"></i>
                        <h5>No Assignments Yet</h5>
                        <p>Create teacher assignments using the form on the left.</p>
                    </div>
                <?php else: ?>
                    <!-- Bulk Actions Notice -->
                    <div class="alert alert-info alert-dismissible fade show mb-3" id="bulkActionsNotice">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Tip:</strong> Select multiple assignments using checkboxes to delete them in bulk.
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th width="40">
                                        <input type="checkbox" class="form-check-input" id="selectAll" onchange="toggleSelectAll()">
                                    </th>
                                    <th>Teacher</th>
                                    <th>Class</th>
                                    <th>Subject</th>
                                    <th>Assigned Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($assignments as $assignment): ?>
                                    <tr>
                                        <td>
                                            <input type="checkbox" class="form-check-input assignment-checkbox" 
                                                   value="<?php echo $assignment['id']; ?>" onchange="updateBulkActions()">
                                        </td>
                                        <td>
                                            <div>
                                                <strong><?php echo htmlspecialchars($assignment['teacher_name']); ?></strong>
                                                <br>
                                                <small class="text-muted"><?php echo htmlspecialchars($assignment['username']); ?></small>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge bg-primary">
                                                <?php echo htmlspecialchars($assignment['class_name']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge bg-info">
                                                <?php echo htmlspecialchars($assignment['subject_name']); ?>
                                            </span>
                                        </td>
                                        <td><?php echo date('M j, Y', strtotime($assignment['created_at'])); ?></td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-outline-danger"
                                                    onclick="deleteAssignment(<?php echo $assignment['id']; ?>, '<?php echo htmlspecialchars($assignment['teacher_name']); ?>', '<?php echo htmlspecialchars($assignment['class_name']); ?>', '<?php echo htmlspecialchars($assignment['subject_name']); ?>')">
                                                <i class="fas fa-trash"></i>
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

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirm Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this assignment?</p>
                <div id="deleteDetails" class="alert alert-warning"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" id="confirmDelete" class="btn btn-danger">Delete Assignment</button>
            </div>
        </div>
    </div>
</div>

<!-- Bulk Delete Confirmation Modal -->
<div class="modal fade" id="bulkDeleteModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirm Bulk Delete</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete the selected assignments?</p>
                <div id="bulkDeleteDetails" class="alert alert-warning"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" id="confirmBulkDelete" class="btn btn-danger">Delete Selected</button>
            </div>
        </div>
    </div>
</div>

<!-- Delete Form -->
<form id="deleteForm" method="POST" style="display: none;">
    <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
    <input type="hidden" name="action" value="delete">
    <input type="hidden" name="assignment_id" id="deleteAssignmentId">
</form>

<!-- Bulk Delete Form -->
<form id="bulkDeleteForm" method="POST" style="display: none;">
    <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
    <input type="hidden" name="action" value="bulk_delete">
    <div id="bulkDeleteInputs"></div>
</form>

<script>
function deleteAssignment(id, teacher, className, subject) {
    $('#deleteDetails').html(`
        <strong>Teacher:</strong> ${teacher}<br>
        <strong>Class:</strong> ${className}<br>
        <strong>Subject:</strong> ${subject}
    `);
    
    $('#deleteAssignmentId').val(id);
    
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
    
    $('#confirmDelete').off('click').on('click', function() {
        $('#deleteForm').submit();
    });
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.assignment-checkbox');
    
    if (!selectAll) return;
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
    
    updateBulkActions();
}

function updateBulkActions() {
    const checkboxes = document.querySelectorAll('.assignment-checkbox:checked');
    const bulkActions = document.getElementById('bulkActions');
    const selectAll = document.getElementById('selectAll');
    const allCheckboxes = document.querySelectorAll('.assignment-checkbox');
    
    // Check if elements exist
    if (!bulkActions) return;
    
    if (checkboxes.length > 0) {
        bulkActions.style.display = 'flex';
        bulkActions.classList.add('show');
        
        // Update delete button text with count
        const deleteBtn = bulkActions.querySelector('.btn-danger');
        if (deleteBtn) {
            deleteBtn.innerHTML = `<i class="fas fa-trash me-1"></i>Delete Selected (${checkboxes.length})`;
        }
    } else {
        bulkActions.classList.remove('show');
        setTimeout(() => {
            if (!document.querySelectorAll('.assignment-checkbox:checked').length) {
                bulkActions.style.display = 'none';
            }
        }, 300);
    }
    
    // Update select all checkbox state
    if (selectAll) {
        selectAll.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
        selectAll.indeterminate = checkboxes.length > 0 && checkboxes.length < allCheckboxes.length;
    }
}

function clearSelection() {
    const checkboxes = document.querySelectorAll('.assignment-checkbox');
    const selectAll = document.getElementById('selectAll');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    if (selectAll) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    }
    
    updateBulkActions();
}

function bulkDeleteAssignments() {
    const checkedBoxes = document.querySelectorAll('.assignment-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
        alert('Please select assignments to delete.');
        return;
    }
    
    // Build details for confirmation
    let detailsHtml = `<strong>You are about to delete ${checkedBoxes.length} assignment(s):</strong><br><br>`;
    checkedBoxes.forEach((checkbox, index) => {
        const row = checkbox.closest('tr');
        const teacherName = row.cells[1].querySelector('strong').textContent;
        const className = row.cells[2].querySelector('.badge').textContent;
        const subjectName = row.cells[3].querySelector('.badge').textContent;
        
        detailsHtml += `${index + 1}. ${teacherName} - ${className} - ${subjectName}<br>`;
    });
    
    $('#bulkDeleteDetails').html(detailsHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('bulkDeleteModal'));
    modal.show();
    
    $('#confirmBulkDelete').off('click').on('click', function() {
        // Prepare form data
        const inputs = document.getElementById('bulkDeleteInputs');
        inputs.innerHTML = '';
        
        checkedBoxes.forEach(checkbox => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'assignment_ids[]';
            input.value = checkbox.value;
            inputs.appendChild(input);
        });
        
        document.getElementById('bulkDeleteForm').submit();
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if elements exist
    const selectAll = document.getElementById('selectAll');
    const bulkActions = document.getElementById('bulkActions');
    
    if (selectAll && bulkActions) {
        updateBulkActions();
    }
});
</script>

<?php include '../includes/footer.php'; ?>
