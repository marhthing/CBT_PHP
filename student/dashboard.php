<?php
session_start();
require_once '../includes/functions.php';
validateRole(['student']);

$page_title = 'Student Dashboard';

// Get student details
$query = "SELECT u.*, c.name as class_name FROM users u 
          LEFT JOIN classes c ON u.class_id = c.id 
          WHERE u.id = ?";
$student = $db->fetch($query, [$_SESSION['user_id']]);

// Get student's test history
$query = "SELECT tr.*, tc.test_type, tc.subject_name, tc.class_name, tc.duration
          FROM test_results tr
          JOIN test_codes tc ON tr.test_code_id = tc.id
          WHERE tr.student_id = ?
          ORDER BY tr.completed_at DESC
          LIMIT 10";
$recentTests = $db->fetchAll($query, [$_SESSION['user_id']]);

include '../includes/header.php';
?>

<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-user me-2"></i>Student Information</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Full Name:</strong> <?php echo htmlspecialchars($student['full_name']); ?></p>
                        <p><strong>Matric Number:</strong> <?php echo htmlspecialchars($student['matric_number']); ?></p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Class:</strong> <?php echo htmlspecialchars($student['class_name'] ?? 'Not Assigned'); ?></p>
                        <p><strong>Username:</strong> <?php echo htmlspecialchars($student['username']); ?></p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0"><i class="fas fa-history me-2"></i>Recent Test Results</h5>
            </div>
            <div class="card-body">
                <?php if (empty($recentTests)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-clipboard-list fa-3x mb-3"></i>
                        <p>No tests taken yet</p>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Type</th>
                                    <th>Score</th>
                                    <th>Duration</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recentTests as $test): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($test['subject_name']); ?></td>
                                        <td>
                                            <span class="badge bg-<?php echo $test['test_type'] === 'Exam' ? 'danger' : 'warning'; ?>">
                                                <?php echo htmlspecialchars($test['test_type']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <strong><?php echo $test['score']; ?>/<?php echo $test['total_score']; ?></strong>
                                            <small class="text-muted">
                                                (<?php echo round(($test['score'] / $test['total_score']) * 100, 1); ?>%)
                                            </small>
                                        </td>
                                        <td><?php echo formatTime($test['time_taken']); ?></td>
                                        <td><?php echo date('M j, Y', strtotime($test['completed_at'])); ?></td>
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
        <div class="card">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="fas fa-play me-2"></i>Quick Actions</h5>
            </div>
            <div class="card-body">
                <a href="take_test.php" class="btn btn-success btn-lg w-100 mb-3">
                    <i class="fas fa-edit me-2"></i>
                    Take a Test
                </a>
                

            </div>
        </div>
        
        <?php if (!empty($recentTests)): ?>
            <div class="card mt-4">
                <div class="card-header bg-warning text-dark">
                    <h6 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Performance Summary</h6>
                </div>
                <div class="card-body">
                    <?php
                    $totalTests = count($recentTests);
                    $totalScore = array_sum(array_column($recentTests, 'score'));
                    $totalPossible = array_sum(array_column($recentTests, 'total_score'));
                    $averagePercentage = $totalPossible > 0 ? round(($totalScore / $totalPossible) * 100, 1) : 0;
                    ?>
                    <p><strong>Tests Taken:</strong> <?php echo $totalTests; ?></p>
                    <p><strong>Average Score:</strong> <?php echo $averagePercentage; ?>%</p>
                    
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-<?php echo $averagePercentage >= 70 ? 'success' : ($averagePercentage >= 50 ? 'warning' : 'danger'); ?>" 
                             style="width: <?php echo $averagePercentage; ?>%">
                            <?php echo $averagePercentage; ?>%
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include '../includes/footer.php'; ?>
