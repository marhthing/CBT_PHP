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
      await login(identifier, password)
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Login Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-sky-200 p-6">
          {/* Header inside form */}
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-lg bg-blue-600 mb-4 shadow-sm">
              <span className="text-white text-sm font-medium tracking-wide">SFGS</span>
            </div>
            <h1 className="text-2xl font-semibold text-blue-900 mb-2">
              CBT Portal
            </h1>
            <p className="text-blue-700 text-sm">
              Sure Foundation Group of School
            </p>
          </div>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-xs">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-xs font-medium text-blue-700 mb-2">
                Username or Registration Number
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                autoComplete="username"
                className="w-full px-3 py-2 border border-sky-300 rounded-md text-sm placeholder-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-sky-50/50"
                placeholder="Enter username or registration number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-blue-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-sky-300 rounded-md text-sm placeholder-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-sky-50/50"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loginLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    <span className="text-xs">Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}