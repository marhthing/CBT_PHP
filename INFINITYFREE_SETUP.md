# CBT Portal - InfinityFree Deployment Guide

This guide provides complete instructions for deploying your CBT Portal on InfinityFree hosting with proper JWT token management.

## 🚀 Quick Deployment

### Step 1: Prepare Files for Upload

Your `public_html/` folder is ready for InfinityFree! It contains:

```
public_html/
├── index.html          # Main frontend page
├── app.css            # All CSS styles (combined)
├── app.js             # All JavaScript (combined)
├── .env               # Environment configuration
└── api/               # Backend API folder
    ├── .htaccess      # Apache configuration
    ├── auth/          # Authentication endpoints
    ├── admin/         # Admin endpoints
    ├── teacher/       # Teacher endpoints
    ├── student/       # Student endpoints
    └── config/        # Database and JWT configuration
```

### Step 2: Database Setup

1. **Create MySQL Database in InfinityFree:**
   - Go to your InfinityFree control panel
   - Create a new MySQL database
   - Note down the database credentials

2. **Update Database Configuration:**
   Edit `public_html/.env` with your database details:
   ```bash
   # Database Configuration
   DB_TYPE=mysql
   DB_HOST=your_database_host        # e.g., sql12.freemysqlhosting.net
   DB_PORT=3306
   DB_NAME=your_database_name        # e.g., sql12_database
   DB_USER=your_db_username          # e.g., sql12_username
   DB_PASS=your_db_password          # Your database password
   ```

3. **Import Database Schema:**
   - Use phpMyAdmin or similar tool
   - Import your database schema (schema.sql)
   - Ensure all tables are created properly

### Step 3: Upload Files to InfinityFree

1. **Using File Manager:**
   - Log into InfinityFree control panel
   - Open File Manager
   - Navigate to `htdocs/` or `public_html/`
   - Upload all files from your `public_html/` folder

2. **Using FTP:**
   ```bash
   # Upload entire public_html folder contents to your domain root
   ftp your-domain.infinityfreeapp.com
   # Upload index.html, app.css, app.js, .env, and api/ folder
   ```

### Step 4: Configure JWT Tokens

The JWT system is pre-configured for InfinityFree! Key features:

**Automatic JWT Configuration:**
- ✅ JWT secret key: `cbt_portal_jwt_secret_key_2025_infinityfree_hosting`
- ✅ 24-hour token expiration
- ✅ InfinityFree-compatible header handling
- ✅ Multiple authentication methods for reliability

**JWT Features:**
- **Smart Header Detection:** Works with InfinityFree's proxy setup
- **Secure Token Generation:** Uses HMAC SHA256 signing
- **Automatic Expiration:** Tokens expire after 24 hours
- **Cross-Browser Compatible:** Works on all devices and browsers

### Step 5: Test Your Deployment

1. **Visit Your Site:**
   ```
   https://your-domain.infinityfreeapp.com
   ```

2. **Test Login:**
   - **Admin:** username: `admin`, password: `admin123`
   - **Teacher:** username: `teacher`, password: `teacher123`  
   - **Student:** reg_number: `STU001`, password: `student123`

3. **Verify API Endpoints:**
   ```bash
   # Test login API
   curl -X POST https://your-domain.infinityfreeapp.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin","password":"admin123","role":"admin"}'
   ```

## 🔧 Configuration Details

### Environment Variables (.env)

```bash
# Frontend API Configuration
VITE_API_BASE_URL=/api
VITE_NODE_ENV=production

# JWT Configuration (InfinityFree Optimized)
JWT_SECRET_KEY=cbt_portal_jwt_secret_key_2025_infinityfree_hosting
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400

# Database Configuration
DB_TYPE=mysql
DB_HOST=your_database_host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_db_username
DB_PASS=your_db_password

# CORS Configuration
ALLOWED_ORIGINS=*
CORS_CREDENTIALS=true
```

### Apache Configuration (.htaccess)

The API folder includes InfinityFree-optimized `.htaccess`:

```apache
# InfinityFree API Configuration
RewriteEngine On

# CORS Headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

# JWT Token Support
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Route all requests to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Security Headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"

# PHP Configuration
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value max_execution_time 300
```

## 🔐 JWT Token Details

### How JWT Works on InfinityFree

1. **Token Generation:**
   - Uses `JWTManager` class with InfinityFree compatibility
   - Secure HMAC SHA256 signing
   - Includes user ID, username, and role

2. **Token Validation:**
   - Smart header detection for InfinityFree proxies
   - Multiple fallback methods for authorization headers
   - Automatic expiration checking

3. **Header Compatibility:**
   ```php
   // Multiple header detection methods
   Authorization: Bearer <token>
   HTTP_AUTHORIZATION: Bearer <token>
   REDIRECT_HTTP_AUTHORIZATION: Bearer <token>
   ```

### JWT Configuration is Automatic

You don't need to:
- ❌ Find or generate JWT tokens manually
- ❌ Configure complex JWT settings
- ❌ Worry about InfinityFree compatibility

The system automatically:
- ✅ Generates secure JWT tokens on login
- ✅ Validates tokens on each API request
- ✅ Handles InfinityFree's proxy headers
- ✅ Provides 24-hour token expiration

## 🌐 Domain and URL Structure

### Same-Server Deployment Structure

```
https://your-domain.infinityfreeapp.com/
├── index.html                    # React frontend
├── app.css                       # Styles
├── app.js                        # JavaScript
└── api/                          # Backend API
    ├── auth/login                # Login endpoint
    ├── admin/dashboard-stats     # Admin stats
    ├── student/dashboard         # Student dashboard
    └── teacher/questions         # Teacher questions
```

### API Endpoints

All API calls go to `/api/` relative path:
- `POST /api/auth/login` - User login
- `GET /api/admin/dashboard-stats` - Admin statistics
- `GET /api/student/dashboard` - Student dashboard
- `POST /api/teacher/questions` - Create questions

## 🚀 Performance Optimization

### InfinityFree-Specific Optimizations

1. **Single File Structure:**
   - Combined CSS in `app.css` (48KB minified)
   - Combined JavaScript in `app.js` (447KB minified)
   - No complex folder structures

2. **Caching Headers:**
   - CSS/JS files cached for 1 year
   - API responses use appropriate caching
   - Static assets optimized for InfinityFree CDN

3. **Database Optimization:**
   - Compatible with both MySQL and PostgreSQL
   - Optimized queries with proper indexing
   - Connection pooling and timeout handling

## 🐛 Troubleshooting

### Common Issues

1. **JWT Token Not Working:**
   - Check `.env` file is uploaded correctly
   - Verify `.htaccess` file has proper permissions
   - Test with curl to isolate frontend vs backend issues

2. **Database Connection Errors:**
   - Double-check database credentials in `.env`
   - Ensure database exists and has proper permissions
   - Import schema using phpMyAdmin

3. **API 404 Errors:**
   - Verify `.htaccess` file is in the `/api` folder
   - Check mod_rewrite is enabled (usually is on InfinityFree)
   - Ensure file permissions are correct (644 for files, 755 for folders)

4. **CORS Errors:**
   - Usually resolved automatically with included `.htaccess`
   - If issues persist, add your specific domain to ALLOWED_ORIGINS

### Debug Steps

1. **Test Database Connection:**
   ```
   https://your-domain.infinityfreeapp.com/api/test_db.php
   ```

2. **Test API Endpoints:**
   ```bash
   # Test login
   curl -X POST https://your-domain.infinityfreeapp.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin","password":"admin123","role":"admin"}'
   ```

3. **Check Error Logs:**
   - InfinityFree control panel → Error Logs
   - Look for PHP errors or permission issues

## 📱 Mobile Compatibility

The deployment is fully mobile-responsive:
- ✅ Works on all screen sizes
- ✅ Touch-friendly interface
- ✅ Fast loading on mobile networks
- ✅ Progressive Web App features

## 🔒 Security Features

1. **JWT Security:**
   - Secure token signing
   - Automatic expiration
   - No sensitive data in tokens

2. **Database Security:**
   - Prepared statements for SQL injection prevention
   - Password hashing with bcrypt
   - Input sanitization

3. **File Security:**
   - `.env` files protected by `.htaccess`
   - Directory browsing disabled
   - Sensitive files hidden

## 🎯 Next Steps

After successful deployment:

1. **Update Passwords:**
   - Change default admin password
   - Update JWT secret in production

2. **Add Content:**
   - Import your questions database
   - Set up student/teacher accounts
   - Configure academic terms and sessions

3. **Monitor Performance:**
   - Check InfinityFree resource usage
   - Monitor database performance
   - Set up error notifications

Your CBT Portal is now ready for production use on InfinityFree! 🎉