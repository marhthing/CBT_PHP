
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function SimpleLogin() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const { login, loginLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      console.log('SimpleLogin: Attempting login with:', identifier)
      await login(identifier, password)
      console.log('SimpleLogin: Login successful!')
    } catch (err: any) {
      console.error('SimpleLogin: Login failed:', err)
      setError(err.message || 'Invalid credentials. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-primary-600 mb-6">
            <span className="text-white text-xl font-bold">SFCS</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            CBT Portal
          </h2>
          <p className="text-gray-600">
            Sure Foundation Comprehensive School
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          {error && (
            <div className="mb-6 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                Username / Registration Number
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter username or registration number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loginLoading}
                className="btn btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner w-5 h-5 mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-3">Demo Credentials:</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-mono">admin / password</span>
              </div>
              <div className="flex justify-between">
                <span>Teacher:</span>
                <span className="font-mono">teacher1 / password</span>
              </div>
              <div className="flex justify-between">
                <span>Student:</span>
                <span className="font-mono">SFGS/2024/001 / password</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
