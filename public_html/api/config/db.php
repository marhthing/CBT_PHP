<?php

return [
    'host' => 'sql100.infinityfree.com',    // Your InfinityFree MySQL host
    'database' => 'if0_39795047_cbt',      // Your database name from InfinityFree
    'username' => 'if0_39795047',          // Your MySQL username from InfinityFree
    'password' => 's5DsRv7k4e6Cz2',    // Your MySQL password
    'port' => 3306,                         // Standard MySQL port
    'charset' => 'utf8mb4',                 // Character set for proper Unicode support
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]
];
?>