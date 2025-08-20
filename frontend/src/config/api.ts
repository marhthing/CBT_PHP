/**
 * API Configuration
 * 
 * This file manages the base URL for API requests, supporting both
 * same-server deployment (/api) and cross-platform deployment (full URLs).
 */

// Get the API base URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Environment check
export const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development' || import.meta.env.DEV;
export const isProduction = import.meta.env.VITE_NODE_ENV === 'production' || import.meta.env.PROD;

// API endpoint builder
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If API_BASE_URL is relative (starts with /), it's same-server deployment
  if (API_BASE_URL.startsWith('/')) {
    return `${API_BASE_URL}/${cleanEndpoint}`;
  }
  
  // If API_BASE_URL is absolute (starts with http), it's cross-platform deployment
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
  REFRESH_TOKEN: 'auth/refresh',
  
  // Admin endpoints
  ADMIN: {
    DASHBOARD_STATS: 'admin/dashboard-stats',
    TEST_CODES: 'admin/test-codes',
    USERS: 'admin/users',
    QUESTIONS: 'admin/questions',
    SUBJECTS: 'admin/subjects',
    TERMS: 'admin/terms',
    SESSIONS: 'admin/sessions',
    CLASS_LEVELS: 'admin/class-levels'
  },
  
  // Teacher endpoints
  TEACHER: {
    QUESTIONS: 'teacher/questions',
    ASSIGNMENTS: 'teacher/assignments',
    BULK_UPLOAD: 'teacher/bulk-upload'
  },
  
  // Student endpoints
  STUDENT: {
    DASHBOARD: 'student/dashboard',
    VALIDATE_CODE: 'student/validate-code',
    TAKE_TEST: 'student/take-test',
    SUBMIT_TEST: 'student/submit-test',
    RESULTS: 'student/results'
  }
} as const;

// Helper function to get full URL for an endpoint
export const getApiUrl = (endpoint: string): string => {
  return buildApiUrl(endpoint);
};

// Initialize configuration logging
if (isDevelopment) {
  // Defer logging to avoid circular import
  setTimeout(() => {
    import('../utils/configChecker').then(({ logConfigurationStatus }) => {
      logConfigurationStatus();
    });
  }, 100);
}