<?php

require_once __DIR__ . '/../config/database.php';

class Auth {
    private $db;
    private $jwt_secret;
    private $jwt_expires_in;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->jwt_secret = $_ENV['JWT_SECRET'] ?? 'your-default-secret-key';
        $this->jwt_expires_in = $_ENV['JWT_EXPIRES_IN'] ?? 86400; // 24 hours
    }

    // Generate JWT token
    public function generateToken($user_id, $username, $role) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $user_id,
            'username' => $username,
            'role' => $role,
            'iat' => time(),
            'exp' => time() + $this->jwt_expires_in
        ]);

        $header_encoded = $this->base64url_encode($header);
        $payload_encoded = $this->base64url_encode($payload);
        
        $signature = hash_hmac('sha256', $header_encoded . "." . $payload_encoded, $this->jwt_secret, true);
        $signature_encoded = $this->base64url_encode($signature);

        return $header_encoded . "." . $payload_encoded . "." . $signature_encoded;
    }

    // Verify JWT token
    public function verifyToken($token) {
        if (!$token) {
            return false;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        $header = $this->base64url_decode($parts[0]);
        $payload = $this->base64url_decode($parts[1]);
        $signature = $this->base64url_decode($parts[2]);

        // Verify signature
        $expected_signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], $this->jwt_secret, true);
        
        if (!hash_equals($signature, $expected_signature)) {
            return false;
        }

        $payload_data = json_decode($payload, true);
        
        // Check if token is expired
        if ($payload_data['exp'] < time()) {
            return false;
        }

        return $payload_data;
    }

    // Get current user from token
    public function getCurrentUser() {
        $headers = getallheaders();
        $auth_header = $headers['Authorization'] ?? '';
        
        if (!$auth_header || !str_starts_with($auth_header, 'Bearer ')) {
            return false;
        }

        $token = substr($auth_header, 7);
        $payload = $this->verifyToken($token);
        
        if (!$payload) {
            return false;
        }

        // Get full user data from database
        try {
            $stmt = $this->db->prepare("
                SELECT id, username, email, role, full_name, created_at 
                FROM users 
                WHERE id = ? AND role = ?
            ");
            $stmt->execute([$payload['user_id'], $payload['role']]);
            
            return $stmt->fetch();
        } catch (Exception $e) {
            error_log("Error getting current user: " . $e->getMessage());
            return false;
        }
    }

    // Authenticate user login
    public function authenticate($username, $password, $role) {
        try {
            $stmt = $this->db->prepare("
                SELECT id, username, email, password, role, full_name, created_at 
                FROM users 
                WHERE username = ? AND role = ?
            ");
            $stmt->execute([$username, $role]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                // Update last login
                $update_stmt = $this->db->prepare("
                    UPDATE users 
                    SET last_login = CURRENT_TIMESTAMP 
                    WHERE id = ?
                ");
                $update_stmt->execute([$user['id']]);

                // Remove password from returned data
                unset($user['password']);
                
                return $user;
            }

            return false;
        } catch (Exception $e) {
            error_log("Authentication error: " . $e->getMessage());
            return false;
        }
    }

    // Check if user has required role
    public function requireRole($required_role) {
        $user = $this->getCurrentUser();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Authentication required']);
            exit();
        }

        if ($user['role'] !== $required_role) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Insufficient permissions']);
            exit();
        }

        return $user;
    }

    // Check if user is authenticated (any role)
    public function requireAuth() {
        $user = $this->getCurrentUser();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Authentication required']);
            exit();
        }

        return $user;
    }

    // Hash password
    public function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    // Create new user (for admin use)
    public function createUser($username, $email, $password, $role, $full_name) {
        try {
            // Check if username already exists
            $check_stmt = $this->db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
            $check_stmt->execute([$username, $email]);
            
            if ($check_stmt->fetch()) {
                return ['success' => false, 'message' => 'Username or email already exists'];
            }

            $hashed_password = $this->hashPassword($password);
            
            $stmt = $this->db->prepare("
                INSERT INTO users (username, email, password, role, full_name) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([$username, $email, $hashed_password, $role, $full_name]);
            
            return [
                'success' => true, 
                'message' => 'User created successfully',
                'user_id' => $this->db->lastInsertId()
            ];
        } catch (Exception $e) {
            error_log("Error creating user: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to create user'];
        }
    }

    // Helper functions for base64url encoding
    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64url_decode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }

    // Session management (alternative to JWT)
    public function startSession($user_id, $role) {
        session_start();
        $_SESSION['user_id'] = $user_id;
        $_SESSION['role'] = $role;
        $_SESSION['last_activity'] = time();
    }

    public function destroySession() {
        session_start();
        session_destroy();
    }

    public function checkSession() {
        session_start();
        
        if (!isset($_SESSION['user_id'])) {
            return false;
        }

        // Check session timeout
        $session_lifetime = $_ENV['SESSION_LIFETIME'] ?? 1440; // 24 minutes
        if (time() - $_SESSION['last_activity'] > $session_lifetime * 60) {
            $this->destroySession();
            return false;
        }

        $_SESSION['last_activity'] = time();
        return true;
    }
}

?>
