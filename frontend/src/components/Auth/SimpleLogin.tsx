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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-800 via-primary-600 to-primary-400 px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white rounded-2xl shadow-strong p-6 sm:p-8 border border-white/10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center mb-4 shadow-moderate">
              <span className="text-white text-xl font-bold">SFCS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              CBT Portal
            </h1>
            <p className="text-gray-600 text-sm font-medium">
              Sure Foundation Comprehensive School
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identifier Input */}
            <div>
              <label className="form-label">
                Username / Registration Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or registration number"
                required
                className="form-input"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="form-label">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="form-input"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                loginLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'btn-primary transform hover:scale-105 hover:shadow-lg'
              }`}
            >
              {loginLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">Demo Credentials:</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Admin: admin / password</div>
              <div>• Teacher: teacher1 / password</div>
              <div>• Student: SFGS/2024/001 / password</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}