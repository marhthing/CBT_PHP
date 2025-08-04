// Global type definitions for the CBT Portal application

interface AppConfig {
  API_BASE_URL: string
  FRONTEND_URL: string
  APP_ENV: string
}

declare global {
  interface Window {
    APP_CONFIG?: AppConfig
  }
}

export {}