# Production Setup Guide for CBT Portal

## Pre-Production Checklist

### 1. Security Settings
- [ ] Set `ini_set('display_errors', 0)` in config/config.php
- [ ] Set `ini_set('session.cookie_secure', 1)` for HTTPS in production
- [ ] Change default admin password
- [ ] Set strong database passwords
- [ ] Configure proper file permissions (755 for directories, 644 for files)

### 2. Environment Configuration
- [ ] Set proper timezone in config/config.php
- [ ] Configure DATABASE_URL environment variable
- [ ] Set up error logging directory with proper permissions
- [ ] Configure web server (Apache/Nginx) with proper security headers

### 3. Database Setup
- [ ] Create production database
- [ ] Run install/database.sql to create schema
- [ ] Update default user passwords
- [ ] Set up database backups

### 4. File Permissions
```bash
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 755 uploads/
chmod 644 uploads/.htaccess
chmod 644 logs/.htaccess
```

### 5. Apache/Nginx Configuration
#### Apache .htaccess (already included)
- URL rewriting
- Security headers
- File upload restrictions

#### Nginx Configuration Example
```nginx
location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}

location /uploads {
    location ~* \.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$ {
        deny all;
    }
}

location /logs {
    deny all;
}
```

### 6. SSL/TLS Configuration
- Install SSL certificate
- Update session.cookie_secure to 1
- Configure HTTPS redirects

### 7. Backup Strategy
- Set up automated database backups
- Configure file system backups
- Test backup restoration process

## Post-Deployment Verification
1. Test login with all user types
2. Verify test taking functionality
3. Check question upload and management
4. Validate test code generation and activation
5. Confirm proper timezone display
6. Test file upload security
7. Verify activity logging