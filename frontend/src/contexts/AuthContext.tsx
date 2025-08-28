import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { User } from '../types'
import api from '../lib/api'

interface AuthContextType {
  user: User | null
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  loginLoading: boolean
  error: string | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Auto-logout functionality
  const IDLE_TIME = 5 * 60 * 1000 // 5 minutes in milliseconds
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/auth/me')

      if (response.data.success && response.data.data) {
        const userData = response.data.data.user || response.data.data
        setUser(userData)
        setError(null)
      } else {
        handleAuthFailure()
      }
    } catch (error: any) {
      handleAuthFailure()
    } finally {
      setLoading(false)
    }
  }

  const handleAuthFailure = () => {
    localStorage.removeItem('token')
    setUser(null)
    // Don't set error immediately - only set it if it's a real auth failure
  }

  const login = async (identifier: string, password: string) => {
    setError(null)
    setLoginLoading(true)

    try {
      const response = await api.post('/auth/auto-login', {
        identifier,
        password,
      })

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Login failed')
      }

      const { token, user: userData } = response.data.data

      if (!token || !userData) {
        throw new Error('Invalid response from server - missing token or user data')
      }

      // Store token and set user
      localStorage.setItem('token', token)
      setUser(userData)
      setError(null)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Login failed. Please check your credentials.'

      setError(errorMessage)
      handleAuthFailure()
      throw new Error(errorMessage)
    } finally {
      setLoginLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)

    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Logout API call failed, but continuing with local logout
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      setError(null)
      setLoading(false)
      clearTimeout(timeoutRef.current!)
    }
  }

  // Auto-logout functionality
  const resetIdleTimer = useCallback(() => {
    if (!user) return
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Update last activity time
    lastActivityRef.current = Date.now()
    
    // Set new timeout for auto-logout
    timeoutRef.current = setTimeout(() => {
      logout()
    }, IDLE_TIME)
  }, [user])

  const handleUserActivity = useCallback(() => {
    if (user) {
      resetIdleTimer()
    }
  }, [user, resetIdleTimer])

  // Set up activity listeners when user is logged in
  useEffect(() => {
    if (user) {
      // Start the idle timer
      resetIdleTimer()

      // Add event listeners for user activity
      const events = [
        'mousedown',
        'mousemove', 
        'keypress',
        'scroll',
        'touchstart',
        'click'
      ]

      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, true)
      })

      // Cleanup function
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity, true)
        })
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [user, handleUserActivity, resetIdleTimer])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, loginLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}