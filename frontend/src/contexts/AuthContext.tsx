import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '../types'
import api from '../lib/api'

interface AuthContextType {
  user: User | null
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      console.log('Checking existing token...')
      const response = await api.get('/auth/me')
      const userData = response.data.data?.user || response.data.user
      
      if (userData) {
        console.log('Token valid, user authenticated:', userData)
        setUser(userData)
        setError(null)
      } else {
        console.log('Invalid response format from /auth/me')
        handleAuthFailure()
      }
    } catch (error: any) {
      console.error('Token validation failed:', error)
      // Only clear auth state if it's a real 401 error, not network issues
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleAuthFailure()
      } else {
        console.log('Network or other error during token validation - keeping existing token')
        // Keep the existing user state if we have one and it's just a network issue
        const existingUser = localStorage.getItem('token')
        if (existingUser) {
          console.log('Keeping user logged in despite network error')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAuthFailure = () => {
    console.log('Authentication failed, clearing token and user state')
    localStorage.removeItem('token')
    setUser(null)
    // Don't set error immediately - only set it if it's a real auth failure
  }

  const login = async (identifier: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      console.log('Attempting login for:', identifier)
      
      const response = await api.post('/auth/auto-login', {
        identifier,
        password,
      })

      console.log('Login response:', response.data)
      
      const responseData = response.data.data || response.data
      const { token, user: userData } = responseData
      
      if (!token || !userData) {
        throw new Error('Invalid response from server')
      }

      // Store token and set user
      localStorage.setItem('token', token)
      setUser(userData)
      setError(null)
      
      console.log('Login successful:', userData)
    } catch (error: any) {
      console.error('Login error:', error)
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Login failed. Please check your credentials.'
      
      setError(errorMessage)
      handleAuthFailure()
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.log('Logout API call failed, but continuing with local logout')
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      setError(null)
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
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