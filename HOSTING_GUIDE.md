# CBT Portal - Multi-Platform Hosting Guide

This guide covers deployment on various hosting platforms with automatic platform detection and configuration.

## 🚀 Quick Deployment Summary

### Upload Structure
- **Frontend**: Upload `/dist/` contents to `htdocs/` (or public folder)
- **Backend**: Upload `/backend/` contents to `htdocs/api/` (or api subfolder)

### Database Setup
- **MySQL**: Create `backend/config/db.php` with your credentials
- **PostgreSQL**: Use environment variables (automatic for some platforms)

---

## 📋 Supported Hosting Platforms

### 1. InfinityFree (Free)
**Frontend**: Upload to `htdocs/`  
**Backend**: Upload to `htdocs/api/`  
**Database**: Free MySQL included

**Steps:**
1. Create MySQL database in control panel
2. Copy `backend/config/db.example.php` to `db.php`
3. Update with your MySQL credentials
4. Upload files via File Manager

**Configuration:**
```php
// backend/config/db.php
return [
    'host' => 'sql123.infinityfree.com',
    'database' => 'epiz_12345678_cbt',
    'username' => 'epiz_12345678',
    'password' => 'your_password',
    'port' => 3306,
    'charset' => 'utf8mb4'
];
```

---

### 2. 000webhost (Free)
**Frontend**: Upload to `public_html/`  
**Backend**: Upload to `public_html/api/`  
**Database**: Free MySQL included

**Steps:**
1. Create MySQL database in control panel
2. Create `backend/config/db.php` with credentials
3. Upload via File Manager or FTP

---

### 3. Netlify (Frontend + Serverless)
**Frontend**: Deploy `/dist/` via Git or drag-and-drop  
**Backend**: Use Netlify Functions or external API host

**Configuration:**
```bash
# Update frontend/.env for Netlify
VITE_API_BASE=https://your-api-domain.com/api
```

---

### 4. Vercel (Frontend + Serverless)
**Frontend**: Deploy via Git connection  
**Backend**: Use Vercel Functions or external host

**Configuration:**
```bash
# Update frontend/.env for Vercel
VITE_API_BASE=https://your-api-domain.com/api
```

---

### 5. Heroku (Full Stack)
**Frontend + Backend**: Deploy via Git  
**Database**: PostgreSQL included

**Steps:**
1. Create Heroku app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy via Git

---

### 6. Render (Full Stack)
**Frontend + Backend**: Deploy via Git  
**Database**: PostgreSQL included

**Steps:**
1. Connect GitHub repository
2. Add PostgreSQL database
3. Configure environment variables
4. Auto-deploy enabled

---

## 🔧 Platform-Specific Features

### Automatic Detection
The system automatically detects your hosting platform and adjusts:
- Database SSL settings
- Memory limits
- Execution times
- CORS policies
- Error handling

### Supported Configurations
- **Same Domain**: Frontend and API on same domain
- **Cross Domain**: Frontend and API on different domains
- **Subdomain**: API on subdomain of main site

---

## 🗄️ Database Configuration

### MySQL (Most Shared Hosts)
Create `backend/config/db.php`:
```php
<?php
return [
    'host' => 'your-mysql-host',
    'database' => 'your-database-name',
    'username' => 'your-username',  
    'password' => 'your-password',
    'port' => 3306,
    'charset' => 'utf8mb4'
];
?>
```

### PostgreSQL (Cloud Platforms)
Use environment variables:
```bash
PGHOST=your-postgres-host
PGDATABASE=your-database-name
PGUSER=your-username
PGPASSWORD=your-password
PGPORT=5432
```

---

## 🌐 Frontend Configuration

### Same Domain Setup
```bash
# frontend/.env
VITE_API_BASE=/api
```
Frontend and API on same domain (e.g., `yourmysite.com` and `yoursite.com/api`)

### Cross Domain Setup
```bash
# frontend/.env  
VITE_API_BASE=https://api.yoursite.com
```
Frontend and API on different domains

---

## 🔒 Security Features

### CORS Protection
- Automatic origin detection
- Whitelist common hosting platforms
- Flexible cross-domain support

### Security Headers
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Content Security Policy ready

### File Protection
- Sensitive config files hidden
- Database credentials protected
- Proper .htaccess rules

---

## 🧪 Testing Your Deployment

### 1. API Health Check
Visit: `https://yoursite.com/api/system/lookup`  
Should return JSON with subjects and terms data.

### 2. CORS Test
Open browser console on your frontend and check for CORS errors.

### 3. Database Connection
Visit: `https://yoursite.com/api/auth/login`  
Should return proper JSON error (not PHP errors).

### 4. Frontend Routes
Navigate through the app - all routes should work without 404 errors.

---

## 🚨 Troubleshooting

### Common Issues

**1. API Returns HTML Instead of JSON**
- Check .htaccess files are uploaded
- Verify API folder structure
- Check file permissions

**2. CORS Errors**
- Update `backend/con.php` with your domain
- Check CORS headers in browser developer tools

**3. Database Connection Failed**
- Verify credentials in `db.php`
- Check database host and port
- Ensure database exists

**4. 404 on React Routes**
- Upload frontend `.htaccess` file
- Enable mod_rewrite on your hosting

### Platform-Specific Help

**InfinityFree:**
- PHP errors? Check error logs in control panel
- Database issues? Verify MySQL credentials
- File upload problems? Use File Manager, not FTP

**000webhost:**
- Enable PHP error reporting in control panel
- Check file permissions (755 for folders, 644 for files)

**Netlify/Vercel:**
- Set build command: `cd frontend && npm run build`
- Set publish directory: `frontend/dist`
- Configure environment variables in platform dashboard

---

## 📞 Support

The CBT Portal includes automatic platform detection and error handling for maximum compatibility across hosting providers. The system adapts to your hosting platform's limitations and capabilities automatically.

For platform-specific issues, consult your hosting provider's documentation or support team.