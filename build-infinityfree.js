#!/usr/bin/env node

/**
 * Custom build script for InfinityFree deployment
 * Creates a flat file structure without assets folder
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Building for InfinityFree deployment...');

// Clean the public_html directory (except api folder)
const publicHtmlPath = './public_html';
const apiPath = path.join(publicHtmlPath, 'api');

// Remove old frontend files but keep api folder
if (fs.existsSync(publicHtmlPath)) {
  const items = fs.readdirSync(publicHtmlPath);
  items.forEach(item => {
    if (item !== 'api' && item !== '.env') {
      const itemPath = path.join(publicHtmlPath, item);
      if (fs.statSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(itemPath);
      }
    }
  });
}

// Build the frontend with Vite
const { execSync } = require('child_process');
console.log('📦 Building React app...');

// Set environment for InfinityFree
process.env.VITE_API_BASE_URL = '/api';
process.env.VITE_NODE_ENV = 'production';

execSync('cd frontend && npm run build', { stdio: 'inherit' });

// Move files from dist to public_html with flat structure
const distPath = './frontend/dist';
const assetsPath = path.join(distPath, 'assets');

console.log('📁 Restructuring files for InfinityFree...');

// Copy index.html
fs.copyFileSync(
  path.join(distPath, 'index.html'),
  path.join(publicHtmlPath, 'index.html')
);

// Extract and rename asset files
if (fs.existsSync(assetsPath)) {
  const assetFiles = fs.readdirSync(assetsPath);
  
  assetFiles.forEach(file => {
    const ext = path.extname(file);
    const srcPath = path.join(assetsPath, file);
    
    if (ext === '.css') {
      fs.copyFileSync(srcPath, path.join(publicHtmlPath, 'app.css'));
      console.log('✅ Created app.css');
    } else if (ext === '.js') {
      fs.copyFileSync(srcPath, path.join(publicHtmlPath, 'app.js'));
      console.log('✅ Created app.js');
    }
  });
}

// Update index.html to use flat file structure
let indexContent = fs.readFileSync(path.join(publicHtmlPath, 'index.html'), 'utf8');

// Replace asset references with flat file names
indexContent = indexContent.replace(/\/assets\/[^"']+\.css/g, './app.css');
indexContent = indexContent.replace(/\/assets\/[^"']+\.js/g, './app.js');

// Add InfinityFree specific optimizations
indexContent = indexContent.replace(
  '<head>',
  `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- InfinityFree Optimization -->
    <meta http-equiv="Cache-Control" content="max-age=31536000">
    <base href="./">`
);

fs.writeFileSync(path.join(publicHtmlPath, 'index.html'), indexContent);
console.log('✅ Updated index.html for InfinityFree');

// Clean up dist folder
fs.rmSync(distPath, { recursive: true, force: true });

console.log('🎉 InfinityFree build completed successfully!');
console.log('📂 Upload the entire public_html/ folder to your InfinityFree hosting');
console.log('📋 Files created:');
console.log('  - index.html (main page)');
console.log('  - app.css (styles)');
console.log('  - app.js (JavaScript)');
console.log('  - api/ (backend folder)');
console.log('  - .env (configuration)');