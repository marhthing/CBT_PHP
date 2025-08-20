/**
 * Configuration Checker Utility
 * 
 * This utility helps verify that the environment variables are properly
 * configured for both development and production deployments.
 */

import { API_BASE_URL, isDevelopment, isProduction, buildApiUrl } from '../config/api';

export interface ConfigCheckResult {
  isValid: boolean;
  environment: 'development' | 'production';
  apiBaseUrl: string;
  deploymentType: 'same-server' | 'cross-platform';
  recommendations: string[];
  warnings: string[];
}

export const checkConfiguration = (): ConfigCheckResult => {
  const result: ConfigCheckResult = {
    isValid: true,
    environment: isDevelopment ? 'development' : 'production',
    apiBaseUrl: API_BASE_URL,
    deploymentType: API_BASE_URL.startsWith('http') ? 'cross-platform' : 'same-server',
    recommendations: [],
    warnings: []
  };

  // Check if API_BASE_URL is properly configured
  if (!API_BASE_URL || API_BASE_URL === 'undefined') {
    result.isValid = false;
    result.warnings.push('VITE_API_BASE_URL is not properly configured');
    result.recommendations.push('Set VITE_API_BASE_URL in your .env file');
  }

  // Development-specific checks
  if (isDevelopment) {
    if (!API_BASE_URL.includes('localhost') && !API_BASE_URL.startsWith('/')) {
      result.warnings.push('Development environment detected but API URL does not point to localhost');
      result.recommendations.push('Consider using http://localhost:8000/api for local development');
    }
  }

  // Production-specific checks
  if (isProduction) {
    if (API_BASE_URL.includes('localhost')) {
      result.isValid = false;
      result.warnings.push('Production environment detected but API URL points to localhost');
      result.recommendations.push('Update VITE_API_BASE_URL for production deployment');
    }

    // Cross-platform deployment checks
    if (result.deploymentType === 'cross-platform') {
      if (!API_BASE_URL.startsWith('https://')) {
        result.warnings.push('Cross-platform deployment should use HTTPS for security');
        result.recommendations.push('Use https:// URLs for production APIs');
      }
    }
  }

  // URL format validation
  if (result.deploymentType === 'cross-platform') {
    try {
      new URL(API_BASE_URL);
    } catch {
      result.isValid = false;
      result.warnings.push('Invalid URL format for API_BASE_URL');
      result.recommendations.push('Ensure API_BASE_URL is a valid URL (e.g., https://api.example.com/api)');
    }
  }

  return result;
};

export const logConfigurationStatus = (): void => {
  if (!isDevelopment) return; // Only log in development

  const config = checkConfiguration();
  
  console.group('🔧 CBT Portal Configuration Check');
  console.log(`Environment: ${config.environment}`);
  console.log(`API Base URL: ${config.apiBaseUrl}`);
  console.log(`Deployment Type: ${config.deploymentType}`);
  console.log(`Status: ${config.isValid ? '✅ Valid' : '❌ Invalid'}`);
  
  if (config.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    config.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  if (config.recommendations.length > 0) {
    console.info('💡 Recommendations:');
    config.recommendations.forEach(rec => console.info(`  - ${rec}`));
  }

  // Test URL building
  const testEndpoints = ['auth/login', 'admin/dashboard-stats', 'student/dashboard'];
  console.log('🔗 Test URLs:');
  testEndpoints.forEach(endpoint => {
    console.log(`  ${endpoint}: ${buildApiUrl(endpoint)}`);
  });
  
  console.groupEnd();
};

export const getDeploymentInstructions = (targetPlatform?: string): string[] => {
  const config = checkConfiguration();
  const instructions: string[] = [];

  if (targetPlatform) {
    switch (targetPlatform.toLowerCase()) {
      case 'netlify':
        instructions.push('For Netlify deployment:');
        instructions.push('1. Set VITE_API_BASE_URL in Netlify environment variables');
        instructions.push('2. Use your backend URL (e.g., https://your-api.railway.app/api)');
        instructions.push('3. Ensure CORS is configured on your backend');
        break;
      case 'vercel':
        instructions.push('For Vercel deployment:');
        instructions.push('1. Create .env.production with your API URL');
        instructions.push('2. Or set VITE_API_BASE_URL in Vercel dashboard');
        instructions.push('3. Redeploy after environment changes');
        break;
      case 'cpanel':
      case 'shared-hosting':
        instructions.push('For shared hosting (cPanel):');
        instructions.push('1. Keep VITE_API_BASE_URL=/api');
        instructions.push('2. Upload built files to public_html/');
        instructions.push('3. Upload backend to public_html/api/');
        break;
      default:
        instructions.push('Generic deployment instructions:');
        instructions.push('1. Update VITE_API_BASE_URL for your target platform');
        instructions.push('2. Run npm run build');
        instructions.push('3. Deploy the dist/ folder');
    }
  } else {
    if (config.deploymentType === 'same-server') {
      instructions.push('Same-server deployment detected:');
      instructions.push('✅ Upload frontend build to web root');
      instructions.push('✅ Upload backend to /api subdirectory');
      instructions.push('✅ Configure web server routing');
    } else {
      instructions.push('Cross-platform deployment detected:');
      instructions.push('✅ Deploy frontend to static hosting service');
      instructions.push('✅ Deploy backend to API hosting service');
      instructions.push('✅ Verify CORS configuration');
    }
  }

  return instructions;
};