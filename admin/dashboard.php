<?php
session_start();
require_once '../includes/functions.php';
validateRole(['admin']);

$page_title = 'Admin Dashboard';

// Get system statistics
$stats = [];

// Total students
$query = "SELECT COUNT(*) as total FROM users WHERE role = 'student' AND active = true";
$stats['students'] = $db->fetch($query)['total'];

// Total teachers
$query = "SELECT COUNT(*) as total FROM users WHERE role = 'teacher' AND active = true";
$stats['teachers'] = $db->fetch($query)['total'];

// Total questions
$query = "SELECT COUNT(*) as total FROM questions";
$stats['questions'] = $db->fetch($query)['total'];

// Active test codes
$query = "SELECT COUNT(*) as total FROM test_codes WHERE active = true";
$stats['active_codes'] = $db->fetch($query)['total'];

// Recent test results
$query = "SELECT tr.*, u.full_name as student_name, tc.subject_name, tc.test_type, tc.code
          FROM test_results tr
          JOIN users u ON tr.student_id = u.id
          JOIN test_codes tc ON tr.test_code_id = tc.id
          ORDER BY tr.completed_at DESC
          LIMIT 10";
$recentResults = $db->fetchAll($query);

// Test codes by class and subject
$query = "SELECT tc.class_name, tc.subject_name, COUNT(*) as total_codes, 
          SUM(CASE WHEN tc.active = true THEN 1 ELSE 0 END) as active_codes
          FROM test_codes tc
          GROUP BY tc.class_name, tc.subject_name
          ORDER BY tc.class_name, tc.subject_name";
$codesBySubject = $db->fetchAll($query);

// Recent activity
$query = "SELECT al.*, u.full_name as user_name, u.role
          FROM activity_logs al
          JOIN users u ON al.user_id = u.id
          ORDER BY al.timestamp DESC
          LIMIT 15";
$recentActivity = $db->fetchAll($query);

// Performance metrics
$query = "SELECT 
          AVG(score * 100.0 / total_score) as avg_percentage,
          COUNT(*) as total_tests,
          SUM(CASE WHEN score * 100.0 / total_score >= 70 THEN 1 ELSE 0 END) as pass_count
          FROM test_results";
$performance = $db->fetch($query);
$passRate = $performance['total_tests'] > 0 ? round(($performance['pass_count'] / $performance['total_tests']) * 100, 1) : 0;

include '../includes/header.php';
?>

<div class="row">
    <!-- Statistics Cards -->
    <div class="col-12 mb-4">
        <div class="row">
            <div class="col-md-3 mb-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Total Students</h6>
                                <h3 class="mb-0"><?php echo number_format($stats['students']); ?></h3>
                            </div>
                            <i class="fas fa-user-graduate fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Total Teachers</h6>
                                <h3 class="mb-0"><?php echo number_format($stats['teachers']); ?></h3>
                            </div>
                            <i class="fas fa-chalkboard-teacher fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Total Questions</h6>
                                <h3 class="mb-0"><?php echo number_format($stats['questions']); ?></h3>
                            </div>
                            <i class="fas fa-question-circle fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card bg-warning text-dark">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Active Test Codes</h6>
                                <h3 class="mb-0"><?php echo number_format($stats['active_codes']); ?></h3>
                            </div>
                            <i class="fas fa-code fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Performance Metrics -->
        <div class="row">
            <div class="col-md-6">
                <div class="card border-success">
                    <div class="card-body text-center">
                        <h6 class="card-title text-success">Overall Pass Rate</h6>
                        <h2 class="text-success"><?php echo $passRate; ?>%</h2>
                        <small class="text-muted">Based on 70% passing grade</small>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-info">
                    <div class="card-body text-center">
                        <h6 class="card-title text-info">Average Score</h6>
                        <h2 class="text-info"><?php echo round($performance['avg_percentage'] ?? 0, 1); ?>%</h2>
                        <small class="text-muted">Across all tests</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Main Content -->
    <div class="col-md-8">
        <!-- Recent Test Results -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i>Recent Test Results</h5>
            </div>
            <div class="card-body">
                <?php if (empty($recentResults)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-chart-line fa-3x mb-3"></i>
                        <p>No test results yet</p>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Subject</th>
                                    <th>Type</th>
                                    <th>Score</th>
                                    <th>Percentage</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recentResults as $result): ?>
                                    <?php $percentage = round(($result['score'] / $result['total_score']) * 100, 1); ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($result['student_name']); ?></td>
                                        <td><?php echo htmlspecialchars($result['subject_name']); ?></td>
                                        <td>
                                            <span class="badge bg-<?php echo $result['test_type'] === 'Exam' ? 'danger' : 'warning'; ?>">
                                                <?php echo htmlspecialchars($result['test_type']); ?>
                                            </span>
                                        </td>
                                        <td><?php echo $result['score']; ?>/<?php echo $result['total_score']; ?></td>
                                        <td>
                                            <span class="badge bg-<?php echo $percentage >= 70 ? 'success' : ($percentage >= 50 ? 'warning' : 'danger'); ?>">
                                                <?php echo $percentage; ?>%
                                            </span>
                                        </td>
                                        <td><?php echo date('M j, g:i A', strtotime($result['completed_at'])); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Test Codes by Subject -->
        <div class="card">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Test Codes by Subject</h5>
            </div>
            <div class="card-body">
                <?php if (empty($codesBySubject)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-chart-bar fa-3x mb-3"></i>
                        <p>No test codes generated yet</p>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Class</th>
                                    <th>Subject</th>
                                    <th>Total Codes</th>
                                    <th>Active Codes</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($codesBySubject as $item): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($item['class_name']); ?></td>
                                        <td><?php echo htmlspecialchars($item['subject_name']); ?></td>
                                        <td>
                                            <span class="badge bg-secondary"><?php echo $item['total_codes']; ?></span>
                                        </td>
                                        <td>
                                            <span class="badge bg-success"><?php echo $item['active_codes']; ?></span>
                                        </td>
                                        <td>
                                            <?php if ($item['active_codes'] > 0): ?>
                                                <i class="fas fa-check-circle text-success"></i>
                                            <?php else: ?>
                                                <i class="fas fa-times-circle text-danger"></i>
                                            <?php endif; ?>
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
    
    <!-- Sidebar -->
    <div class="col-md-4">
        <!-- Quick Actions -->
        <div class="card mb-4">
            <div class="card-header bg-success text-white">
                <h6 class="mb-0"><i class="fas fa-bolt me-2"></i>Quick Actions</h6>
            </div>
            <div class="card-body">
                <div class="d-grid gap-2">
                    <a href="generate_codes.php" class="btn btn-primary">
                        <i class="fas fa-plus me-2"></i>Generate Test Codes
                    </a>
                    <a href="teacher_assignment.php" class="btn btn-outline-primary">
                        <i class="fas fa-user-tie me-2"></i>Manage Assignments
                    </a>
                    <a href="upload_questions.php" class="btn btn-outline-success">
                        <i class="fas fa-upload me-2"></i>Upload Questions
                    </a>
                    <a href="code_activation.php" class="btn btn-outline-warning">
                        <i class="fas fa-toggle-on me-2"></i>Activate Codes
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="card">
            <div class="card-header bg-secondary text-white">
                <h6 class="mb-0"><i class="fas fa-history me-2"></i>Recent Activity</h6>
            </div>
            <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                <?php if (empty($recentActivity)): ?>
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-history fa-2x mb-2"></i>
                        <p class="mb-0">No recent activity</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($recentActivity as $activity): ?>
                        <div class="d-flex mb-3">
                            <div class="flex-shrink-0">
                                <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                                     style="width: 32px; height: 32px;">
                                    <i class="fas fa-user text-white" style="font-size: 12px;"></i>
                                </div>
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <div class="small fw-bold">
                                    <?php echo htmlspecialchars($activity['user_name']); ?>
                                    <span class="badge bg-light text-dark ms-1">
                                        <?php echo ucfirst($activity['role']); ?>
                                    </span>
                                </div>
                                <div class="small text-muted">
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
                        <hr class="my-2">
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
            <div class="card-footer">
                <a href="activity_logs.php" class="btn btn-sm btn-outline-primary w-100">
                    View All Activity
                </a>
            </div>
        </div>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
