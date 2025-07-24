<?php
// Application configuration
define('APP_NAME', 'CBT Portal');
define('BASE_URL', '/');
define('UPLOAD_PATH', 'uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif']);

// Session configuration (only if session not started)
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_strict_mode', 1);
    ini_set('session.cookie_secure', 0); // Set to 1 in production with HTTPS
}

// Error reporting - Disable in production
// For production, set these to 0 and false respectively
error_reporting(E_ALL);
ini_set('display_errors', 1); // Set to 0 in production
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error.log');

// Timezone - Set to your local timezone for production
date_default_timezone_set('Africa/Lagos');

// Set PostgreSQL timezone to match PHP timezone
function setDatabaseTimezone() {
    global $db;
    try {
        $db->execute("SET timezone = 'Africa/Lagos'");
    } catch (Exception $e) {
        error_log("Failed to set database timezone: " . $e->getMessage());
    }
}

// CSRF Protection functions are now in includes/functions.php
?>
