import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function SimpleLogin() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const { login, loading, error } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!identifier.trim() || !password.trim()) {
      setLocalError('Please enter both username/registration number and password')
      return
    }

    try {
      console.log('Form submitted with:', { identifier, password: '***' })
      await login(identifier, password)
      
      // Navigation will be handled by App component after user state is updated
      console.log('Login successful, waiting for navigation...')
    } catch (error: any) {
      console.error('Login failed:', error)
      setLocalError(error.message)
    }
  }

  const displayError = localError || error

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '1rem'
    },
    card: {
      width: '100%',
      maxWidth: '450px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: '2.5rem',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '2rem'
    },
    icon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 1.5rem',
      color: '#4f46e5',
      padding: '12px',
      backgroundColor: '#f0f9ff',
      borderRadius: '50%',
      border: '2px solid #e0e7ff'
    },
    title: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '0.5rem',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      color: '#4f46e5',
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '0.25rem'
    },
    schoolMotto: {
      color: '#6b7280',
      fontSize: '0.875rem',
      fontStyle: 'italic'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box' as const
    },
    button: {
      width: '100%',
      padding: '0.875rem',
      background: loading ? '#9ca3af' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.025em'
    },
    error: {
      color: '#dc2626',
      fontSize: '0.875rem',
      fontWeight: '500',
      textAlign: 'center' as const,
      padding: '0.75rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      marginTop: '1rem'
    },
    hint: {
      color: '#6b7280',
      fontSize: '0.875rem',
      textAlign: 'center' as const,
      marginTop: '1rem',
      padding: '1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      border: '1px solid #e5e7eb'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>
            <svg
              fill="currentColor"
              viewBox="0 0 20 20"
              style={{ width: '100%', height: '100%' }}
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 style={styles.title}>CBT Portal</h1>
          <p style={styles.subtitle}>Saint Francis Grammar School</p>
          <p style={styles.schoolMotto}>"Excellence in Learning"</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username / Registration Number</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter username or registration number"
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {displayError && (
            <div style={styles.error}>
              {displayError}
            </div>
          )}

          <div style={styles.hint}>
            <strong>Test Accounts:</strong><br />
            Admin: admin / password123<br />
            Teacher: teacher1 / password123<br />
            Student: 2023001 / password123
          </div>
        </form>
      </div>
    </div>
  )
}