# MySQL Database Setup for InfinityFree

## Quick Setup Instructions

### 1. Get MySQL Credentials from InfinityFree
- Log into your InfinityFree control panel
- Go to "MySQL Databases" section
- Note down your database credentials:
  - Host: `sqlXXX.infinityfree.com`
  - Database: `epiz_XXXXXXXX_cbt`
  - Username: `epiz_XXXXXXXX`
  - Password: (your chosen password)

### 2. Configure Database Connection
- Copy `backend/config/db.example.php` to `backend/config/db.php`
- Update the credentials in `db.php` with your actual values
- Upload `db.php` to `htdocs/api/config/db.php`

### 3. Database Detection
- **With db.php**: System automatically uses MySQL
- **Without db.php**: System uses PostgreSQL (current Replit setup)

### 4. Import Database Schema
You mentioned you already created the MySQL database schema, so just ensure all tables exist:

Required tables:
- users
- subjects  
- terms
- sessions
- class_levels
- questions
- test_codes
- test_results
- test_answers

## Example db.php Configuration

```php
<?php
return [
    'host' => 'sql123.infinityfree.com',
    'database' => 'epiz_12345678_cbt',
    'username' => 'epiz_12345678',
    'password' => 'your_password',
    'port' => 3306,
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]
];
?>
```

The system will automatically handle MySQL vs PostgreSQL differences in SQL syntax!