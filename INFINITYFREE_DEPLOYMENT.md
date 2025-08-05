# InfinityFree Deployment Guide for CBT Portal

## Overview
Your CBT Portal has been restructured to work with InfinityFree shared hosting. The PHP development server approach won't work on shared hosts, so I've created a traditional web hosting structure.

## Directory Structure for InfinityFree

```
public_html/
├── index.php              # Main entry point (replaces both frontend and backend)
├── index.html            # React frontend build
├── .htaccess            # Apache configuration for routing
├── assets/              # CSS, JS, and other static files
├── vite.svg            # Favicon
├── config/              # Backend configuration files
│   ├── cors.php
│   ├── database.php
│   └── environment.php
├── includes/            # Helper functions
│   ├── auth.php
│   └── response.php
└── api/                 # All API endpoints
    ├── auth/
    ├── admin/
    ├── teacher/
    ├── student/
    ├── system/
    └── health.php
```

## How It Works

1. **Single Entry Point**: `index.php` handles both frontend and API requests
2. **API Routing**: URLs like `/api/auth/login` are routed to appropriate PHP files
3. **Static Assets**: CSS, JS, images served directly by Apache
4. **React Router**: All non-API routes serve the React frontend for client-side routing
5. **Database**: Uses MySQL on InfinityFree (auto-detected by environment.php)

## Deployment Steps for InfinityFree

1. **Upload Files**: Copy entire `public_html/` folder to your InfinityFree account
2. **Database Setup**: 
   - Create MySQL database in InfinityFree control panel
   - Import your schema.sql file
   - Update database credentials in config files
3. **File Permissions**: Ensure PHP files have proper permissions (755)
4. **Test**: Access your domain - should show the React login page

## Key Differences from Development

- **No PHP Server**: Uses Apache mod_rewrite instead of `php -S`
- **Database**: MySQL instead of PostgreSQL (InfinityFree limitation)
- **File Structure**: Everything in public_html root directory
- **CORS**: Handled via .htaccess headers instead of PHP CORS file
- **Error Handling**: Optimized for shared hosting limitations

## Database Migration for InfinityFree

Since InfinityFree uses MySQL, you'll need to:
1. Convert PostgreSQL schema to MySQL format
2. Update connection strings in config/database.php
3. Adjust any PostgreSQL-specific SQL queries

## Testing the Deployment

1. Health Check: `https://yourdomain.com/api/health`
2. Login Page: `https://yourdomain.com/` 
3. API Test: `https://yourdomain.com/api/system/lookup`

The structure is now compatible with all major shared hosting providers including InfinityFree, 000webhost, and others.