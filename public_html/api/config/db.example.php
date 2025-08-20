<?php
// MySQL Database Configuration Example
// Rename this file to 'db.php' and update with your actual MySQL credentials

return [
    'host' => 'sqlXXX.infinityfree.com',    // Your InfinityFree MySQL host
    'database' => 'epiz_XXXXXXXX_cbt',      // Your database name from InfinityFree
    'username' => 'epiz_XXXXXXXX',          // Your MySQL username from InfinityFree
    'password' => 'your_secure_password',    // Your MySQL password
    'port' => 3306,                         // Standard MySQL port
    'charset' => 'utf8mb4',                 // Character set for proper Unicode support
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]
];

/*
INSTRUCTIONS FOR INFINITYFREE HOSTING:

1. Get your MySQL credentials from InfinityFree control panel
2. Copy this file to 'db.php' (remove .example)
3. Update the credentials above with your actual values
4. Upload to htdocs/api/config/db.php

The system will automatically detect db.php and use MySQL instead of PostgreSQL.
If db.php doesn't exist, it will use PostgreSQL (current Replit setup).
*/
?>