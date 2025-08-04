# CBT Portal - InfinityFree Deployment Guide

## Folder Structure for InfinityFree

### Upload Instructions:
1. **Frontend (React build files)**: Upload contents of `/dist/` folder to `htdocs/`
2. **Backend (PHP API)**: Upload contents of `/backend/` folder to `htdocs/api/`

### Final InfinityFree Structure:
```
htdocs/
├── index.html              (React app entry)
├── assets/                 (React build assets)
│   ├── index-*.css
│   └── index-*.js
└── api/                    (PHP backend)
    ├── con.php             (CORS configuration)
    ├── config/
    ├── includes/
    ├── api/
    └── index.php
```

## Configuration Files

### Frontend Environment (.env)
- **Current**: `VITE_API_BASE=/api`
- **For different domains**: Change to full URL like `https://yourbackend.com/api`

### Backend CORS (con.php)
- Automatically handles CORS for same-domain and cross-domain setups
- Detects origin and sets appropriate headers
- Handles preflight OPTIONS requests

## Build Process
```bash
# Build React app
cd frontend
npm run build

# Copy to deployment folder
cp -r frontend/dist/* dist/
```

## Alternative Hosting Options

### Frontend Only (Vercel/Netlify)
1. Update `frontend/.env`: `VITE_API_BASE=https://yourdomain.com/api`
2. Deploy `/dist/` contents to Vercel/Netlify

### Backend Only (Traditional PHP Hosting)
1. Upload `/backend/` contents to web root
2. Update frontend's `VITE_API_BASE` to point to backend domain

## Database Connection
- Backend uses environment variables from hosting provider
- No code changes needed for database migration