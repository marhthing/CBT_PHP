# CBT Portal Deployment Guide

This guide covers how to deploy the CBT Portal with flexible backend URL configuration for both same-server and cross-platform deployments.

## Environment Configuration

The frontend uses environment variables to determine the backend API URL, allowing for flexible deployment scenarios.

### Environment Files

#### `.env` (Default Production)
```bash
# Same-server deployment (recommended for most cases)
VITE_API_BASE_URL=/api
VITE_NODE_ENV=production
```

#### `.env.development` (Local Development)
```bash
# Local development configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_NODE_ENV=development
```

#### `.env.production` (Production Override)
```bash
# For cross-platform deployment, update this file:
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_NODE_ENV=production
```

## Deployment Scenarios

### 1. Same-Server Deployment (Recommended)
Deploy both frontend and backend on the same server/domain.

**Frontend Configuration:**
```bash
VITE_API_BASE_URL=/api
```

**Deployment Structure:**
```
your-domain.com/
├── index.html (Frontend)
├── static/ (Frontend assets)
└── api/ (Backend endpoints)
```

**Examples:**
- Shared hosting (cPanel, InfinityFree, 000webhost)
- Single VPS/server deployment
- Docker container with both services

### 2. Cross-Platform Deployment
Deploy frontend and backend on different platforms.

**Frontend Configuration:**
```bash
VITE_API_BASE_URL=https://your-backend-api.herokuapp.com/api
```

**Examples:**
- Frontend: Netlify/Vercel, Backend: Railway/Render
- Frontend: GitHub Pages, Backend: Heroku
- Frontend: AWS S3, Backend: AWS Lambda

## Platform-Specific Instructions

### Netlify Frontend + Railway Backend
1. **Frontend (Netlify):**
   ```bash
   # netlify.toml or Environment Variables
   VITE_API_BASE_URL=https://your-app.railway.app/api
   ```

2. **Backend (Railway):**
   - Deploy PHP backend using Railway
   - Ensure CORS allows your Netlify domain

### Vercel Frontend + Render Backend
1. **Frontend (Vercel):**
   ```bash
   # vercel.json or Environment Variables
   VITE_API_BASE_URL=https://your-app.onrender.com/api
   ```

2. **Backend (Render):**
   - Deploy PHP backend using Render
   - Configure database connection

### GitHub Pages Frontend + Heroku Backend
1. **Frontend (GitHub Pages):**
   ```bash
   # .env.production
   VITE_API_BASE_URL=https://your-app.herokuapp.com/api
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   # Deploy dist/ folder to GitHub Pages
   ```

## Local Development Setup

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd frontend
   npm install
   ```

2. **Environment configuration:**
   The `.env.development` file is already configured for local development.

3. **Start development servers:**
   ```bash
   # Terminal 1: Backend
   cd backend
   php -S 0.0.0.0:8000 index.php

   # Terminal 2: Frontend  
   cd frontend
   npm run dev
   ```

## Production Build

### Building for Same-Server Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder alongside backend
```

### Building for Cross-Platform Deployment
1. **Update environment:**
   ```bash
   # Create or update .env.production
   VITE_API_BASE_URL=https://your-backend-domain.com/api
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   Deploy the `dist/` folder to your frontend platform.

## Environment Variables Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `/api` | Backend API base URL |
| `VITE_NODE_ENV` | `production` | Environment mode |

## Testing Your Deployment

### Same-Server Deployment Test
```bash
# Should work after deployment
curl https://your-domain.com/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123","role":"admin"}'
```

### Cross-Platform Deployment Test
```bash
# Test backend directly
curl https://your-backend-domain.com/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123","role":"admin"}'

# Test frontend connection
# Open browser dev tools, check Network tab for API calls
```

## Troubleshooting

### Common Issues

1. **CORS Errors in Cross-Platform Deployment:**
   - Update backend CORS configuration to allow your frontend domain
   - Check `backend/cors.php` file

2. **API 404 Errors:**
   - Verify `VITE_API_BASE_URL` is correct
   - Ensure backend is accessible at the configured URL

3. **Build Issues:**
   - Clear Vite cache: `rm -rf node_modules/.vite`
   - Reinstall dependencies: `npm ci`

4. **Environment Variables Not Loading:**
   - Ensure variables start with `VITE_`
   - Restart development server after changes
   - Check browser dev tools for actual values

### Debug Mode

Enable debug logging by adding to your environment:
```bash
VITE_DEBUG=true
```

This will log API configuration details to the browser console.

## Security Considerations

1. **Never expose sensitive data in environment variables**
2. **Use HTTPS for production deployments**
3. **Configure proper CORS policies**
4. **Validate all environment variables**

## Performance Optimization

1. **Same-server deployment** is generally faster (no cross-origin requests)
2. **Enable gzip compression** on your server
3. **Use CDN** for static assets when possible
4. **Configure proper caching headers**

## Quick Start Templates

### Template 1: cPanel Shared Hosting
```bash
# Frontend .env
VITE_API_BASE_URL=/api

# Upload frontend/dist/* to public_html/
# Upload backend/* to public_html/api/
```

### Template 2: Netlify + Railway
```bash
# Frontend .env.production
VITE_API_BASE_URL=https://your-project.railway.app/api

# Deploy frontend to Netlify
# Deploy backend to Railway
```

### Template 3: Vercel + Render
```bash
# Frontend .env.production  
VITE_API_BASE_URL=https://your-service.onrender.com/api

# Deploy frontend to Vercel
# Deploy backend to Render
```

This flexible configuration ensures your CBT Portal can be deployed anywhere while maintaining optimal performance and security.