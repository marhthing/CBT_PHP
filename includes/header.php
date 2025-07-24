
<?php
if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.php');
    exit();
}

require_once '../config/config.php';
require_once '../config/db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title . ' - ' . APP_NAME : APP_NAME; ?></title>
    
    <!-- Preconnect to external domains for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    
    <!-- CSS Dependencies -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">

    <!-- JavaScript Dependencies - Load jQuery first -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js" crossorigin="anonymous"></script>
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>">
    
    <!-- Meta tags for better SEO and performance -->
    <meta name="description" content="<?php echo APP_NAME; ?> - Computer Based Testing Portal">
    <meta name="author" content="<?php echo APP_NAME; ?>">
    <meta name="robots" content="noindex, nofollow">
    
    <!-- Performance optimizations -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
</head>
<body>
    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <div class="mt-3">
                <strong>Loading...</strong>
            </div>
        </div>
    </div>

    <!-- Enhanced Navigation -->
    <nav class="navbar navbar-expand-lg">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">
                <i class="fas fa-graduation-cap"></i>
                <?php echo APP_NAME; ?>
            </a>

            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <?php if ($_SESSION['role'] === 'student'): ?>
                        <li class="nav-item">
                            <a class="nav-link <?php echo basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : ''; ?>" href="dashboard.php">
                                <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link <?php echo basename($_SERVER['PHP_SELF']) == 'take_test.php' ? 'active' : ''; ?>" href="take_test.php">
                                <i class="fas fa-edit me-2"></i>Take Test
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link <?php echo basename($_SERVER['PHP_SELF']) == 'result.php' ? 'active' : ''; ?>" href="result.php">
                                <i class="fas fa-chart-line me-2"></i>Results
                            </a>
                        </li>
                    <?php elseif ($_SESSION['role'] === 'teacher'): ?>
                        <li class="nav-item">
                            <a class="nav-link <?php echo basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : ''; ?>" href="dashboard.php">
                                <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link <?php echo basename($_SERVER['PHP_SELF']) == 'upload_questions.php' ? 'active' : ''; ?>" href="upload_questions.php">
                                <i class="fas fa-upload me-2"></i>Upload Questions
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link <?php echo basename($_SERVER['PHP_SELF']) == 'manage_questions.php' ? 'active' : ''; ?>" href="manage_questions.php">
                                <i class="fas fa-list me-2"></i>Manage Questions
                            </a>
                        </li>
                    <?php elseif ($_SESSION['role'] === 'admin'): ?>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fas fa-cogs me-2"></i>Management
                            </a>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="dashboard.php">
                                    <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="teacher_assignment.php">
                                    <i class="fas fa-user-tie me-2"></i>Teacher Assignment
                                </a></li>
                                <li><a class="dropdown-item" href="generate_codes.php">
                                    <i class="fas fa-key me-2"></i>Generate Test Codes
                                </a></li>
                                <li><a class="dropdown-item" href="code_activation.php">
                                    <i class="fas fa-toggle-on me-2"></i>Code Activation
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="upload_questions.php">
                                    <i class="fas fa-upload me-2"></i>Upload Questions
                                </a></li>
                                <li><a class="dropdown-item" href="manage_questions.php">
                                    <i class="fas fa-list me-2"></i>Manage Questions
                                </a></li>
                                <li><a class="dropdown-item" href="activity_logs.php">
                                    <i class="fas fa-history me-2"></i>Activity Logs
                                </a></li>
                            </ul>
                        </li>
                    <?php endif; ?>
                </ul>

                <ul class="navbar-nav">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-user-circle me-2"></i>
                            <?php echo htmlspecialchars($_SESSION['full_name']); ?>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <span class="dropdown-item-text">
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-id-badge me-2 text-primary"></i>
                                        <div>
                                            <div class="fw-bold"><?php echo htmlspecialchars($_SESSION['full_name']); ?></div>
                                            <small class="text-muted"><?php echo ucfirst($_SESSION['role']); ?></small>
                                        </div>
                                    </div>
                                </span>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="../auth/logout.php">
                                <i class="fas fa-sign-out-alt me-2"></i>Logout
                            </a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
