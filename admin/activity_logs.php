<?php
session_start();
require_once '../includes/functions.php';
validateRole(['admin']);

$page_title = 'Activity Logs';

// Get filter parameters
$userId = $_GET['user_id'] ?? '';
$action = $_GET['action'] ?? '';
$dateFrom = $_GET['date_from'] ?? '';
$dateTo = $_GET['date_to'] ?? '';
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = 50;
$offset = ($page - 1) * $limit;

// Build query
$whereConditions = ['1=1'];
$params = [];

if ($userId) {
    $whereConditions[] = 'al.user_id = ?';
    $params[] = $userId;
}
if ($action) {
    $whereConditions[] = 'al.action ILIKE ?';
    $params[] = '%' . $action . '%';
}
if ($dateFrom) {
    $whereConditions[] = 'DATE(al.timestamp) >= ?';
    $params[] = $dateFrom;
}
if ($dateTo) {
    $whereConditions[] = 'DATE(al.timestamp) <= ?';
    $params[] = $dateTo;
}

// Get total count
$countQuery = "SELECT COUNT(*) as total 
               FROM activity_logs al 
               JOIN users u ON al.user_id = u.id 
               WHERE " . implode(' AND ', $whereConditions);
$totalCount = $db->fetch($countQuery, $params)['total'];
$totalPages = ceil($totalCount / $limit);

// Get logs with pagination
$query = "SELECT al.*, u.full_name, u.username, u.role 
          FROM activity_logs al 
          JOIN users u ON al.user_id = u.id 
          WHERE " . implode(' AND ', $whereConditions) . "
          ORDER BY al.timestamp DESC 
          LIMIT ? OFFSET ?";

$logs = $db->fetchAll($query, array_merge($params, [$limit, $offset]));

// Get users for filter
$users = $db->fetchAll("SELECT DISTINCT u.id, u.full_name, u.username, u.role 
                        FROM users u 
                        JOIN activity_logs al ON u.id = al.user_id 
                        ORDER BY u.full_name");

// Get unique actions for filter
$actions = $db->fetchAll("SELECT DISTINCT action FROM activity_logs ORDER BY action");

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
                                <h6 class="card-title">Total Logs</h6>
                                <h4 class="mb-0"><?php echo number_format($totalCount); ?></h4>
                            </div>
                            <i class="fas fa-history fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Today's Activities</h6>
                                <?php
                                $todayQuery = "SELECT COUNT(*) as total FROM activity_logs WHERE DATE(timestamp) = CURRENT_DATE";
                                $todayCount = $db->fetch($todayQuery)['total'];
                                ?>
                                <h4 class="mb-0"><?php echo number_format($todayCount); ?></h4>
                            </div>
                            <i class="fas fa-calendar-day fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Active Users</h6>
                                <?php
                                $activeUsersQuery = "SELECT COUNT(DISTINCT user_id) as total FROM activity_logs WHERE DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'";
                                $activeUsers = $db->fetch($activeUsersQuery)['total'];
                                ?>
                                <h4 class="mb-0"><?php echo number_format($activeUsers); ?></h4>
                            </div>
                            <i class="fas fa-users fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-dark">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="card-title">Action Types</h6>
                                <h4 class="mb-0"><?php echo count($actions); ?></h4>
                            </div>
                            <i class="fas fa-list fa-2x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filter Form -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-filter me-2"></i>Filter Activity Logs</h5>
            </div>
            <div class="card-body">
                <form method="GET" class="row g-3">
                    <div class="col-md-3">
                        <label for="user_id" class="form-label">User</label>
                        <select class="form-select" id="user_id" name="user_id">
                            <option value="">All Users</option>
                            <?php foreach ($users as $user): ?>
                                <option value="<?php echo $user['id']; ?>" <?php echo $userId == $user['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($user['full_name']); ?>
                                    (<?php echo ucfirst($user['role']); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-3">
                        <label for="action" class="form-label">Action</label>
                        <select class="form-select" id="action" name="action">
                            <option value="">All Actions</option>
                            <?php foreach ($actions as $actionItem): ?>
                                <option value="<?php echo htmlspecialchars($actionItem['action']); ?>" 
                                        <?php echo $action === $actionItem['action'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($actionItem['action']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="col-md-3">
                        <label for="date_from" class="form-label">From Date</label>
                        <input type="date" class="form-control" id="date_from" name="date_from" value="<?php echo htmlspecialchars($dateFrom); ?>">
                    </div>
                    
                    <div class="col-md-3">
                        <label for="date_to" class="form-label">To Date</label>
                        <input type="date" class="form-control" id="date_to" name="date_to" value="<?php echo htmlspecialchars($dateTo); ?>">
                    </div>
                    
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-search me-2"></i>Filter
                        </button>
                        <a href="activity_logs.php" class="btn btn-outline-secondary">
                            <i class="fas fa-redo me-2"></i>Reset
                        </a>
                        <button type="button" class="btn btn-success" onclick="exportLogs()">
                            <i class="fas fa-download me-2"></i>Export
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Activity Logs -->
        <div class="card">
            <div class="card-header bg-info text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">
                        <i class="fas fa-list me-2"></i>Activity Logs
                    </h5>
                    <span class="badge bg-light text-dark">
                        Showing <?php echo count($logs); ?> of <?php echo number_format($totalCount); ?>
                    </span>
                </div>
            </div>
            <div class="card-body">
                <?php if (empty($logs)): ?>
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-history fa-3x mb-3"></i>
                        <h5>No Activity Logs Found</h5>
                        <p>No activity logs match your current filter criteria.</p>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($logs as $log): ?>
                                    <tr>
                                        <td>
                                            <div class="fw-bold"><?php echo date('M j, Y', strtotime($log['timestamp'])); ?></div>
                                            <small class="text-muted"><?php echo date('g:i A', strtotime($log['timestamp'])); ?></small>
                                        </td>
                                        <td>
                                            <div class="fw-bold"><?php echo htmlspecialchars($log['full_name']); ?></div>
                                            <small class="text-muted"><?php echo htmlspecialchars($log['username']); ?></small>
                                        </td>
                                        <td>
                                            <span class="badge bg-<?php 
                                                echo $log['role'] === 'admin' ? 'danger' : 
                                                    ($log['role'] === 'teacher' ? 'warning' : 'primary'); 
                                            ?>">
                                                <?php echo ucfirst($log['role']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="fw-bold text-primary">
                                                <?php echo htmlspecialchars($log['action']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <div style="max-width: 300px;">
                                                <?php if ($log['details']): ?>
                                                    <span class="text-muted">
                                                        <?php echo htmlspecialchars($log['details']); ?>
                                                    </span>
                                                <?php else: ?>
                                                    <span class="text-muted fst-italic">No additional details</span>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <?php if ($totalPages > 1): ?>
                        <nav aria-label="Activity logs pagination">
                            <ul class="pagination justify-content-center">
                                <li class="page-item <?php echo $page <= 1 ? 'disabled' : ''; ?>">
                                    <a class="page-link" href="?<?php echo http_build_query(array_merge($_GET, ['page' => $page - 1])); ?>">Previous</a>
                                </li>
                                
                                <?php
                                $startPage = max(1, $page - 2);
                                $endPage = min($totalPages, $page + 2);
                                ?>
                                
                                <?php if ($startPage > 1): ?>
                                    <li class="page-item">
                                        <a class="page-link" href="?<?php echo http_build_query(array_merge($_GET, ['page' => 1])); ?>">1</a>
                                    </li>
                                    <?php if ($startPage > 2): ?>
                                        <li class="page-item disabled"><span class="page-link">...</span></li>
                                    <?php endif; ?>
                                <?php endif; ?>
                                
                                <?php for ($i = $startPage; $i <= $endPage; $i++): ?>
                                    <li class="page-item <?php echo $i === $page ? 'active' : ''; ?>">
                                        <a class="page-link" href="?<?php echo http_build_query(array_merge($_GET, ['page' => $i])); ?>"><?php echo $i; ?></a>
                                    </li>
                                <?php endfor; ?>
                                
                                <?php if ($endPage < $totalPages): ?>
                                    <?php if ($endPage < $totalPages - 1): ?>
                                        <li class="page-item disabled"><span class="page-link">...</span></li>
                                    <?php endif; ?>
                                    <li class="page-item">
                                        <a class="page-link" href="?<?php echo http_build_query(array_merge($_GET, ['page' => $totalPages])); ?>"><?php echo $totalPages; ?></a>
                                    </li>
                                <?php endif; ?>
                                
                                <li class="page-item <?php echo $page >= $totalPages ? 'disabled' : ''; ?>">
                                    <a class="page-link" href="?<?php echo http_build_query(array_merge($_GET, ['page' => $page + 1])); ?>">Next</a>
                                </li>
                            </ul>
                        </nav>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<script>
function exportLogs() {
    // Create export URL with current filters
    const params = new URLSearchParams(window.location.search);
    params.set('export', '1');
    
    // You can implement CSV export functionality here
    alert('Export functionality will be implemented');
}

// Set max date to today
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date_from').setAttribute('max', today);
    document.getElementById('date_to').setAttribute('max', today);
});
</script>

<?php include '../includes/footer.php'; ?>
