<?php
define('FRONTEND_URL', $_SERVER['HTTP_ORIGIN'] ?? '*');
header("Access-Control-Allow-Origin: " . FRONTEND_URL);
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Content-Type: application/json");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>