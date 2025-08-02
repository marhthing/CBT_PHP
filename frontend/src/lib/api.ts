import axios from 'axios'

// Use the Vite proxy configuration
const API_URL = '/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('Token added to request:', token.substring(0, 20) + '...')
  } else {
    console.log('No token found in localStorage')
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url, 'Headers:', config.headers)
  return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data, error.config?.url)
    
    // If 401 unauthorized, clear token and redirect to login
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - clearing token')
      localStorage.removeItem('token')
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
