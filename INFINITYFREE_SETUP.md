# InfinityFree Setup Guide - Simple & Clear

## Files You Need to Edit

**ONLY ONE FILE needs your database details:**
- `public_html/config/database.php` - Edit lines 15-19 with your InfinityFree database info

**Files you can ignore/delete:**
- `env.example` - Just an example, you can delete it
- Any other database config files - not needed

## Step-by-Step InfinityFree Setup

### 1. Create Database on InfinityFree
1. Log into your InfinityFree control panel
2. Go to "MySQL Databases" 
3. Create a new database
4. Note down these details:
   - Database Host (usually: sql105.infinityfree.com)
   - Database Name (usually: if0_XXXXXXX_databasename)
   - Username (usually: if0_XXXXXXX)
   - Password (what you set)

### 2. Edit Database Configuration
Open `public_html/config/database.php` and edit ONLY these lines:

```php
// EDIT THESE VALUES WITH YOUR INFINITYFREE DATABASE DETAILS:
$db_config = [
    'host' => 'sql105.infinityfree.com',                    // Your MySQL server
    'database' => 'if0_XXXXXXX_cbt_portal',                 // Your database name
    'username' => 'if0_XXXXXXX',                            // Your username  
    'password' => 'your_actual_password',                   // Your password
    'port' => 3306,
    'charset' => 'utf8mb4'
];
```

### 3. Import Database Schema
1. In InfinityFree control panel, go to phpMyAdmin
2. Select your database
3. Click "Import" tab
4. Upload the `schema_mysql.sql` file
5. Click "Go"

### 4. Upload Files
1. Upload the entire `public_html/` folder to your InfinityFree account
2. Make sure all files are in the root directory (not in a subfolder)

### 5. Test
Visit your InfinityFree domain - you should see the login page!

## That's It!
- Only edit `public_html/config/database.php`
- Import `schema_mysql.sql`  
- Upload `public_html/` folder
- Done!

## Default Login Credentials
- **Admin**: admin@sfgs.edu.ng / password123
- **Teacher**: teacher1@sfgs.edu.ng / password123  
- **Student**: SFGS/2024/001 / password123