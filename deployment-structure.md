# InfinityFree Deployment Structure

## Required File Structure for InfinityFree:
```
htdocs/
├── api/
│   ├── auth/
│   │   ├── login.php
│   │   ├── auto-login.php
│   │   ├── logout.php
│   │   └── me.php
│   ├── student/
│   ├── teacher/
│   ├── admin/
│   └── system/
├── assets/
│   ├── index-CwAifkRx.js
│   ├── index-R9fMkRiC.css
│   └── (other static files)
├── config/
│   ├── database.php
│   ├── cors.php
│   ├── app.php
│   └── env.php
├── includes/
│   ├── auth.php
│   └── response.php
├── index.html
├── index.php
└── .htaccess
```

## Changes Needed:
1. Convert PostgreSQL to MySQL
2. Update CORS for InfinityFree domain
3. Add .htaccess for proper routing
4. Update JWT token handling for production
5. Configure database connection for MySQL