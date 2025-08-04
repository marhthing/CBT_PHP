# InfinityFree Deployment Guide for CBT Portal

## Step 1: Prepare Files for Upload

### 1.1 Required File Structure
Upload these files to your InfinityFree `htdocs` folder:

```
htdocs/
├── api/ (entire folder from backend/api/)
├── assets/ (from backend/assets/)
├── config/ (from backend/config/)
├── includes/ (from backend/includes/)
├── index.html (from backend/)
├── index.php (from backend/)
├── .htaccess (root file)
└── mysql-schema.sql (for database setup)
```

### 1.2 Files to Update Before Upload

**1. config/env.php:**
Replace these placeholders with your actual values:
```php
'API_BASE_URL' => 'https://YOUR-DOMAIN.infinityfreeapp.com',
'FRONTEND_URL' => 'https://YOUR-DOMAIN.infinityfreeapp.com',
'CORS_ORIGIN' => 'https://YOUR-DOMAIN.infinityfreeapp.com',
'JWT_SECRET' => 'your-unique-32-character-secret-key',
'DB_HOST' => 'sql200.infinityfree.com', // Your actual DB host
'DB_NAME' => 'if0_XXXXXXX_cbt_portal', // Your actual DB name
'DB_USER' => 'if0_XXXXXXX', // Your actual DB user
'DB_PASS' => 'your-database-password'
```

**2. config/cors.php:**
Update the CORS allowed origins on line 10:
```php
$allowed_origins = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'https://YOUR-DOMAIN.infinityfreeapp.com';
```

## Step 2: Database Setup

### 2.1 Create MySQL Database
1. Login to your InfinityFree control panel
2. Go to MySQL Databases
3. Create a new database named: `cbt_portal`
4. Note your database credentials

### 2.2 Import Database Schema
1. Go to phpMyAdmin in your control panel
2. Select your database
3. Import the `mysql-schema.sql` file
4. Verify all tables are created successfully

### 2.3 Update Database Configuration
Replace the database credentials in `config/env.php` with your actual InfinityFree credentials.

## Step 3: Security Configuration

### 3.1 Generate Strong JWT Secret
Generate a strong 32-character secret key and update `JWT_SECRET` in `config/env.php`.

### 3.2 Update Admin Password
After deployment, login with admin/password and immediately change the password.

## Step 4: Upload and Test

### 4.1 Upload Files
1. Use FTP client or InfinityFree File Manager
2. Upload all files to `htdocs` folder
3. Ensure proper file permissions (644 for files, 755 for folders)

### 4.2 Test Installation
1. Visit: `https://YOUR-DOMAIN.infinityfreeapp.com`
2. Try logging in with: admin/password
3. Check all features work correctly

## Step 5: Production Checklist

### 5.1 Security
- [ ] Changed default admin password
- [ ] Updated JWT secret key
- [ ] Verified CORS configuration
- [ ] Tested SSL/HTTPS connections

### 5.2 Database
- [ ] All tables created successfully
- [ ] Default data imported
- [ ] Database connection working
- [ ] All foreign keys properly set

### 5.3 Functionality
- [ ] Login system working
- [ ] Admin dashboard accessible
- [ ] Test code generation working
- [ ] Student test-taking functional
- [ ] Teacher question management working

## Common Issues and Solutions

### Issue: "Mixed Content" errors
**Solution:** Ensure all URLs in `config/env.php` use HTTPS.

### Issue: Database connection failed
**Solution:** Double-check database credentials in `config/env.php`.

### Issue: JWT token issues
**Solution:** Ensure `JWT_SECRET` is set and consistent across all sessions.

### Issue: CORS errors
**Solution:** Update CORS origins to match your exact domain in `config/cors.php`.

## File Backup Recommendations

Before deployment:
1. Backup your local PostgreSQL database
2. Export questions and test data
3. Keep a copy of all customized configuration files

## Support

For technical issues specific to InfinityFree hosting:
- Check InfinityFree documentation
- Use their support forum
- Verify PHP version compatibility (7.4+ recommended)