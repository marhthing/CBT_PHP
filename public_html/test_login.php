<?php
// Simple login test for InfinityFree debugging

// Handle AJAX requests
if (isset($_GET['ajax']) || (isset($_SERVER['HTTP_CONTENT_TYPE']) && $_SERVER['HTTP_CONTENT_TYPE'] === 'application/json')) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}

try {
    // Load database configuration
    require_once __DIR__ . '/config/database.php';
    
    // Test database connection
    $conn = getDatabaseConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle both JSON and form data
        if (isset($_GET['ajax'])) {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                echo json_encode(['success' => false, 'message' => 'Invalid JSON input', 'debug' => 'JSON decode failed']);
                exit;
            }
        } else {
            $input = $_POST;
        }
        
        $identifier = $input['identifier'] ?? '';
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? '';
        
        if (!$identifier || !$password || !$role) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields', 'debug' => compact('identifier', 'password', 'role')]);
            exit;
        }
        
        // Simple authentication test
        if ($role === 'admin') {
            $stmt = $conn->prepare("SELECT id, username, email, password, role, full_name FROM users WHERE email = ? AND role = 'admin' AND is_active = 1");
            $stmt->execute([$identifier]);
        } elseif ($role === 'teacher') {
            $stmt = $conn->prepare("SELECT id, username, email, password, role, full_name FROM users WHERE email = ? AND role = 'teacher' AND is_active = 1");
            $stmt->execute([$identifier]);
        } else {
            $stmt = $conn->prepare("SELECT id, username, email, reg_number, password, role, full_name FROM users WHERE reg_number = ? AND role = 'student' AND is_active = 1");
            $stmt->execute([$identifier]);
        }
        
        $user = $stmt->fetch();
        
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User not found', 'debug' => "No user found for $identifier with role $role"]);
            exit;
        }
        
        // Check password
        if (password_verify($password, $user['password'])) {
            unset($user['password']);
            $result = ['success' => true, 'message' => 'Login successful', 'user' => $user];
        } else {
            $result = ['success' => false, 'message' => 'Invalid password', 'debug' => 'Password verification failed'];
        }
        
        // Return JSON for AJAX requests, redirect for form submissions
        if (isset($_GET['ajax'])) {
            echo json_encode($result);
        } else {
            $success = $result['success'] ? 'SUCCESS' : 'FAILED';
            $message = $result['message'];
            header("Location: ?result=$success&msg=" . urlencode($message));
            exit;
        }
        
    } else {
        if (isset($_GET['ajax'])) {
            echo json_encode(['success' => true, 'message' => 'Test endpoint ready', 'method' => $_SERVER['REQUEST_METHOD']]);
        }
    }
    
} catch (Exception $e) {
    $error = ['success' => false, 'message' => 'Server error', 'error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()];
    
    if (isset($_GET['ajax'])) {
        echo json_encode($error);
    } else {
        header("Location: ?result=ERROR&msg=" . urlencode($error['message'] . ' - ' . $error['error']));
        exit;
    }
}

// Show HTML form if not AJAX request
if (!isset($_GET['ajax'])):
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CBT Portal - Login Test</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #333; 
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group { 
            margin-bottom: 20px; 
        }
        label { 
            display: block; 
            margin-bottom: 5px; 
            font-weight: bold;
            color: #555;
        }
        input, select { 
            width: 100%; 
            padding: 12px; 
            border: 2px solid #ddd; 
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        input:focus, select:focus {
            border-color: #4CAF50;
            outline: none;
        }
        button { 
            background: #4CAF50; 
            color: white; 
            padding: 12px 30px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 10px;
        }
        button:hover { 
            background: #45a049; 
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
            font-weight: bold;
        }
        .success { 
            background: #d4edda; 
            color: #155724; 
            border: 1px solid #c3e6cb;
        }
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            border: 1px solid #f5c6cb;
        }
        .test-accounts {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #2196F3;
        }
        .test-accounts h3 {
            margin-top: 0;
            color: #1976D2;
        }
        .account {
            margin: 10px 0;
            font-family: monospace;
            background: white;
            padding: 8px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 CBT Portal Login Test</h1>
        
        <div class="test-accounts">
            <h3>Test Accounts (Password: password123)</h3>
            <div class="account"><strong>Admin:</strong> admin@sfgs.edu.ng</div>
            <div class="account"><strong>Teacher:</strong> teacher1@sfgs.edu.ng</div>
            <div class="account"><strong>Student:</strong> SFGS/2024/001</div>
        </div>

        <?php if (isset($_GET['result'])): ?>
            <div class="result <?php echo $_GET['result'] === 'SUCCESS' ? 'success' : 'error'; ?>">
                <?php echo htmlspecialchars($_GET['msg']); ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="">
            <div class="form-group">
                <label for="role">Role:</label>
                <select name="role" id="role" required onchange="updatePlaceholder()">
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                </select>
            </div>

            <div class="form-group">
                <label for="identifier">Email/Username/Reg Number:</label>
                <input type="text" name="identifier" id="identifier" required 
                       placeholder="Enter email for admin/teacher or reg number for student">
            </div>

            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" name="password" id="password" required 
                       placeholder="Enter password (default: password123)">
            </div>

            <button type="submit">🔐 Test Login</button>
        </form>
    </div>

    <script>
        function updatePlaceholder() {
            const role = document.getElementById('role').value;
            const identifier = document.getElementById('identifier');
            
            switch(role) {
                case 'admin':
                    identifier.placeholder = 'admin@sfgs.edu.ng';
                    identifier.value = 'admin@sfgs.edu.ng';
                    break;
                case 'teacher':
                    identifier.placeholder = 'teacher1@sfgs.edu.ng';
                    identifier.value = 'teacher1@sfgs.edu.ng';
                    break;
                case 'student':
                    identifier.placeholder = 'SFGS/2024/001';
                    identifier.value = 'SFGS/2024/001';
                    break;
                default:
                    identifier.placeholder = 'Enter email for admin/teacher or reg number for student';
                    identifier.value = '';
            }
        }
        
        // Auto-fill password
        document.getElementById('password').value = 'password123';
    </script>
</body>
</html>
<?php endif; ?>