# Environment Setup Guide

This guide ensures your CBT Portal is properly configured for both development and production deployments with flexible backend API communication.

## Quick Setup

### 1. Development Setup
```bash
cd frontend
npm install
# The .env.development file is already configured for local development
npm run dev
```

### 2. Production Setup

#### Same-Server Deployment (Recommended)
```bash
# Use default configuration (no changes needed)
cd frontend
npm run build
# Deploy dist/ folder alongside backend
```

#### Cross-Platform Deployment
```bash
# Update .env.production with your backend URL
echo 'VITE_API_BASE_URL=https://your-backend-domain.com/api' > frontend/.env.production
cd frontend
npm run build
# Deploy dist/ folder to your frontend platform
```

## Environment Files Overview

| File | Purpose | Example |
|------|---------|---------|
| `.env` | Default production config | `VITE_API_BASE_URL=/api` |
| `.env.development` | Local development | `VITE_API_BASE_URL=http://localhost:8000/api` |
| `.env.production` | Production override | `VITE_API_BASE_URL=https://api.example.com/api` |

## Configuration Examples

### Same-Server Deployment
Perfect for shared hosting, VPS, or single-server deployments.

**Frontend .env:**
```bash
VITE_API_BASE_URL=/api
VITE_NODE_ENV=production
```

**Server Structure:**
```
/public_html/
├── index.html          # Frontend
├── assets/            # Frontend assets
└── api/              # Backend PHP files
    ├── auth/
    ├── admin/
    └── student/
```

### Cross-Platform Deployment
Perfect for JAMstack, microservices, or distributed deployments.

**Frontend .env.production:**
```bash
VITE_API_BASE_URL=https://your-backend.railway.app/api
VITE_NODE_ENV=production
```

**Deployment Structure:**
```
Frontend: https://your-app.netlify.app
Backend:  https://your-api.railway.app/api
```

## Platform-Specific Examples

### Netlify + Railway
```bash
# Frontend (Netlify Environment Variables)
VITE_API_BASE_URL=https://your-project.railway.app/api

# Backend (Railway)
# Deploy PHP backend normally
```

### Vercel + Render
```bash
# Frontend (.env.production)
VITE_API_BASE_URL=https://your-service.onrender.com/api

# Backend (Render)
# Deploy PHP backend normally
```

### cPanel Shared Hosting
```bash
# Frontend (.env - default is perfect)
VITE_API_BASE_URL=/api

# Upload Structure:
# public_html/ -> frontend build files
# public_html/api/ -> backend PHP files
```

### GitHub Pages + Heroku
```bash
# Frontend (.env.production)
VITE_API_BASE_URL=https://your-app.herokuapp.com/api

# Note: CORS configuration required on Heroku backend
```

## Validation & Testing

### Environment Validation Script
```bash
# Test your configuration
cd frontend
npm run dev
# Check browser console for configuration details
```

### API Connection Test
```bash
# Test backend directly
curl -X POST "https://your-backend-url/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123","role":"admin"}'
```

### Build Test
```bash
# Test production build
cd frontend
npm run build
# Verify dist/ folder contains proper configuration
```

## Common Issues & Solutions

### Issue: "Network Error" in production
**Solution:** Verify VITE_API_BASE_URL is correctly set for your deployment platform.

### Issue: CORS errors in cross-platform deployment
**Solution:** Update backend CORS configuration to allow your frontend domain.

### Issue: Environment variables not loading
**Solution:** Ensure variables start with `VITE_` prefix and restart development server.

### Issue: 404 on API calls in same-server deployment
**Solution:** Verify backend is uploaded to `/api` subdirectory with correct file structure.

## Advanced Configuration

### Custom Environment Variables
```bash
# Add custom variables (always prefix with VITE_)
VITE_APP_NAME=CBT Portal
VITE_VERSION=1.0.0
VITE_DEBUG=true
```

### Environment Detection
The system automatically detects:
- Development vs Production mode
- Same-server vs Cross-platform deployment
- Proper URL formatting and validation

### Build Optimization
```bash
# Production build with optimization
cd frontend
npm run build

# Build output:
# dist/index.html - Main HTML file
# dist/assets/ - Optimized JS/CSS bundles
```

## Security Best Practices

1. **Never commit sensitive data** to environment files
2. **Use HTTPS** for production APIs in cross-platform deployments
3. **Validate environment variables** before deployment
4. **Configure proper CORS** policies on backend

## Troubleshooting Checklist

- [ ] Environment variables start with `VITE_` prefix
- [ ] Backend is accessible at configured URL
- [ ] CORS is properly configured for cross-platform deployments
- [ ] No hardcoded URLs in the codebase
- [ ] Production build includes environment variables
- [ ] Database compatibility is properly set up

## Support

For deployment-specific issues:
1. Check browser developer console for configuration logs
2. Verify backend accessibility with direct API calls
3. Test environment variable loading in development mode
4. Review platform-specific deployment documentation

The CBT Portal's flexible environment configuration ensures seamless deployment across any platform while maintaining optimal performance and security.