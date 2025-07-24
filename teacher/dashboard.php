<?php
session_start();
require_once '../includes/functions.php';
validateRole(['teacher']);

$page_title = 'Teacher Dashboard';

// Get teacher statistics
$teacherId = $_SESSION['user_id'];

// Count uploaded questions
$query = "SELECT COUNT(*) as total FROM questions WHERE created_by = ?";
$questionStats = $db->fetch($query, [$teacherId]);

// Get teacher assignments
$assignments = getTeacherAssignments($teacherId);

// Get active test codes for teacher's subjects
$query = "SELECT tc.*, COUNT(tr.id) as students_taken
          FROM test_codes tc
          LEFT JOIN test_results tr ON tc.id = tr.test_code_id
          WHERE tc.active = true AND tc.id IN (
              SELECT DISTINCT tc2.id FROM test_codes tc2
              JOIN teacher_assignments ta ON tc2.class_id = ta.class_id AND tc2.subject_id = ta.subject_id
              WHERE ta.teacher_id = ?
          )
          GROUP BY tc.id
          ORDER BY tc.created_at DESC
          LIMIT 10";
$activeCodes = $db->fetchAll($query, [$teacherId]);

// Recent activity
$query = "SELECT al.*, tc.code as test_code
          FROM activity_logs al
          LEFT JOIN test_codes tc ON al.details LIKE CONCAT('%', tc.id, '%')
          WHERE al.user_id = ?
          ORDER BY al.timestamp DESC
          LIMIT 5";
$recentActivity = $db->fetchAll($query, [$teacherId]);

include '../includes/header.php';
?>

<div class="row">
    <div class="col-md-8">
        <!-- Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Questions Uploaded</h6>
                                <h3 class="mb-0"><?php echo $questionStats['total']; ?></h3>
                            </div>
                            <i class="fas fa-question-circle fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Class Assignments</h6>
                                <h3 class="mb-0"><?php echo count($assignments); ?></h3>
                            </div>
                            <i class="fas fa-chalkboard-teacher fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Active Tests</h6>
                                <h3 class="mb-0"><?php echo count($activeCodes); ?></h3>
                            </div>
                            <i class="fas fa-clipboard-list fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Teacher Assignments -->
        <div class="card mb-4">
            <div class="card-header bg-warning text-dark">
                <h5 class="mb-0"><i class="fas fa-chalkboard-teacher me-2"></i>My Class Assignments</h5>
            </div>
            <div class="card-body">
                <?php if (empty($assignments)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                        <p>No class assignments yet. Please contact the administrator.</p>
                    </div>
                <?php else: ?>
                    <div class="row">
                        <?php foreach ($assignments as $assignment): ?>
                            <div class="col-md-6 mb-3">
                                <div class="card border-left-primary">
                                    <div class="card-body">
                                        <h6 class="card-title text-primary">
                                            <?php echo htmlspecialchars($assignment['subject_name']); ?>
                                        </h6>
                                        <p class="card-text mb-1">
                                            <strong>Class:</strong> <?php echo htmlspecialchars($assignment['class_name']); ?>
                                        </p>
                                        <small class="text-muted">
                                            Assigned: <?php echo date('M j, Y', strtotime($assignment['created_at'])); ?>
                                        </small>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Active Test Codes -->
        <div class="card">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0"><i class="fas fa-code me-2"></i>Active Test Codes (My Subjects)</h5>
            </div>
            <div class="card-body">
                <?php if (empty($activeCodes)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-clipboard-list fa-3x mb-3"></i>
                        <p>No active test codes for your subjects</p>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Subject</th>
                                    <th>Class</th>
                                    <th>Type</th>
                                    <th>Students</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($activeCodes as $code): ?>
                                    <tr>
                                        <td>
                                            <code class="bg-light p-1 rounded">
                                                <?php echo htmlspecialchars($code['code']); ?>
                                            </code>
                                        </td>
                                        <td><?php echo htmlspecialchars($code['subject_name']); ?></td>
                                        <td><?php echo htmlspecialchars($code['class_name']); ?></td>
                                        <td>
                                            <span class="badge bg-<?php echo $code['test_type'] === 'Exam' ? 'danger' : 'warning'; ?>">
                                                <?php echo htmlspecialchars($code['test_type']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge bg-primary">
                                                <?php echo $code['students_taken']; ?>
                                            </span>
                                        </td>
                                        <td><?php echo date('M j', strtotime($code['created_at'])); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <!-- Quick Actions -->
        <div class="card mb-4">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="fas fa-bolt me-2"></i>Quick Actions</h5>
            </div>
            <div class="card-body">
                <div class="d-grid gap-2">
                    <a href="upload_questions.php" class="btn btn-primary">
                        <i class="fas fa-upload me-2"></i>
                        Upload Questions
                    </a>
                    <a href="manage_questions.php" class="btn btn-outline-primary">
                        <i class="fas fa-list me-2"></i>
                        Manage Questions
                    </a>
                </div>
                
                <hr>
                

            </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="card">
            <div class="card-header bg-secondary text-white">
                <h6 class="mb-0"><i class="fas fa-clock me-2"></i>Recent Activity</h6>
            </div>
            <div class="card-body">
                <?php if (empty($recentActivity)): ?>
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-history fa-2x mb-2"></i>
                        <p class="mb-0">No recent activity</p>
                    </div>
                <?php else: ?>
                    <div class="timeline">
                        <?php foreach ($recentActivity as $activity): ?>
                            <div class="timeline-item mb-3">
                                <div class="d-flex">
                                    <div class="flex-shrink-0">
                                        <i class="fas fa-circle text-primary" style="font-size: 8px;"></i>
                                    </div>
                                    <div class="flex-grow-1 ms-2">
                                        <div class="small fw-bold">
                                            <?php echo htmlspecialchars($activity['action']); ?>
                                        </div>
                                        <?php if ($activity['details']): ?>
                                            <div class="small text-muted">
                                                <?php echo htmlspecialchars($activity['details']); ?>
                                            </div>
                                        <?php endif; ?>
                                        <div class="small text-muted">
                                            <?php echo date('M j, g:i A', strtotime($activity['timestamp'])); ?>
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

<?php include '../includes/footer.php'; ?>
