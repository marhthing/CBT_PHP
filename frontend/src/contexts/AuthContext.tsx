import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '../types'
import api from '../lib/api'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, role: string) => Promise<void>
  autoLogin: (identifier: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string, role: string) => {
    try {
      const response = await api.post('/auth/login', {
        identifier: username,
        password,
        role,
      })

      const { token, user } = response.data
      localStorage.setItem('token', token)
      setUser(user)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const autoLogin = async (identifier: string, password: string) => {
    try {
      console.log('Making API request to:', '/auth/auto-login')
      console.log('API Base URL:', api.defaults.baseURL)
      const response = await api.post('/auth/auto-login', {
        identifier,
        password,
      })

      console.log('API response:', response.data)
      const { token, user } = response.data.data || response.data
      localStorage.setItem('token', token)
      setUser(user)
      
      // Programmatically navigate to the appropriate dashboard
      const redirectPath = user.role === 'student' ? '/student' : 
                          user.role === 'teacher' ? '/teacher' : 
                          user.role === 'admin' ? '/admin' : '/student'
      window.location.href = redirectPath
    } catch (error: any) {
      console.error('API error:', error)
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, autoLogin, logout, loading }}>
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
