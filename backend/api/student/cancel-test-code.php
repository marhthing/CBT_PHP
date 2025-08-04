
<?php

require_once __DIR__ . '/../../cors.php';
require_once __DIR__ . '/../../includes/response.php';

// This endpoint has been disabled for security reasons
Response::badRequest('Test code cancellation is not allowed');

?>
