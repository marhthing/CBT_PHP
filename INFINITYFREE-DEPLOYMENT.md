# Complete InfinityFree Deployment Guide for CBT Portal

## What You Need to Upload

**Upload ONLY these files/folders from the `backend` folder to your InfinityFree `htdocs` directory:**

```
htdocs/
├── api/ (entire folder)
├── assets/ (entire folder) 
├── config/ (entire folder)
├── includes/ (entire folder)
├── index.html
├── index.php
├── .htaccess (from root, not backend)
```

**DO NOT upload:**
- The `backend` folder itself
- Any `node_modules` folders
- Any `.git` folders
- The `frontend` folder

## Step-by-Step Deployment

### Step 1: Get Your InfinityFree Database Info
1. Login to your InfinityFree control panel
2. Go to "MySQL Databases"
3. Create a new database (name it something like `cbt_portal`)
4. Write down these details:
   - Database Host (usually `sql200.infinityfree.com`)
   - Database Name (like `if0_37849913_cbt_portal`)
   - Database Username (like `if0_37849913`)
   - Database Password

### Step 2: Configure Your Files BEFORE Upload

**Edit `backend/config/env.php` (lines 19-33):**
Replace these values with YOUR actual details:
```php
'API_BASE_URL' => 'https://YOUR-DOMAIN.infinityfreeapp.com',
'FRONTEND_URL' => 'https://YOUR-DOMAIN.infinityfreeapp.com', 
'CORS_ORIGIN' => 'https://YOUR-DOMAIN.infinityfreeapp.com',
'JWT_SECRET' => 'generate-a-32-character-secret-key-here',
'DB_HOST' => 'sql200.infinityfree.com', // Your actual DB host
'DB_NAME' => 'if0_XXXXXXX_cbt_portal', // Your actual DB name
'DB_USER' => 'if0_XXXXXXX', // Your actual DB username
'DB_PASS' => 'your-database-password' // Your actual DB password
```

**Edit `backend/config/cors.php` (line 10):**
```php
$allowed_origins = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'https://YOUR-DOMAIN.infinityfreeapp.com';
```

### Step 3: Generate Strong JWT Secret
1. Go to: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
2. Generate a 256-bit key
3. Copy it and use as your `JWT_SECRET` in step 2

### Step 4: Upload Files
1. Use FTP client or InfinityFree File Manager
2. Upload all files from `backend` folder (NOT the backend folder itself) to `htdocs`
3. Upload `.htaccess` from root to `htdocs`
4. Set file permissions: 644 for files, 755 for folders

### Step 5: Setup Database
1. Go to phpMyAdmin in your InfinityFree control panel
2. Select your database
3. Import the `mysql-schema.sql` file
4. Verify all tables are created (should see: users, subjects, terms, sessions, class_levels, questions, test_codes, test_results, test_answers)

### Step 6: Test Your Site
1. Visit: `https://YOUR-DOMAIN.infinityfreeapp.com`
2. You should see the login page
3. Login with: `admin` / `password`
4. **IMMEDIATELY change the admin password after first login**

## Security Checklist After Deployment

- [ ] Changed default admin password
- [ ] Updated JWT secret key (32+ characters)
- [ ] Verified CORS configuration matches your domain
- [ ] Tested SSL/HTTPS connections work
- [ ] All database tables created successfully
- [ ] Login system working properly

## What Each File Does

- **index.php**: Main server file that handles both frontend and API
- **index.html**: Your React app homepage
- **assets/**: Your built React app files (CSS, JavaScript)
- **api/**: All your API endpoints (login, questions, tests, etc.)
- **config/**: Database and app configuration
- **includes/**: Authentication and response helpers
- **.htaccess**: URL routing and security headers

## Common Issues & Solutions

**Problem: "Mixed Content" errors**
**Solution:** Make sure all URLs in `config/env.php` use `https://`

**Problem: Database connection failed**
**Solution:** Double-check database credentials in `config/env.php`

**Problem: Login not working**
**Solution:** Verify JWT_SECRET is set and database has admin user

**Problem: 404 errors**
**Solution:** Make sure `.htaccess` file is uploaded to root of `htdocs`

## File Structure After Upload
Your `htdocs` folder should look like this:
```
htdocs/
├── api/
│   ├── auth/
│   ├── admin/
│   ├── teacher/
│   ├── student/
│   └── system/
├── assets/
│   ├── index-CwAifkRx.js
│   └── index-R9fMkRiC.css
├── config/
│   ├── app.php
│   ├── cors.php
│   ├── database.php
│   └── env.php
├── includes/
│   ├── auth.php
│   └── response.php
├── index.html
├── index.php
└── .htaccess
```

## Default Login Credentials
- **Username:** admin
- **Password:** password
- **Role:** Administrator

**IMPORTANT:** Change this password immediately after your first login!

## Need Help?
If something doesn't work:
1. Check your InfinityFree error logs
2. Verify all file permissions are correct
3. Make sure database credentials are exactly right
4. Test the site in an incognito/private browser window