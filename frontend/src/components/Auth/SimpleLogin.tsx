import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function SimpleLogin() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { autoLogin } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting login with:', { identifier, password: '***' })
      const user = await autoLogin(identifier, password)
      console.log('Login successful:', user)
      
      // Force navigation to dashboard based on role
      const dashboardPath = (user as any)?.role === 'student' ? '/student' : 
                           (user as any)?.role === 'teacher' ? '/teacher' : 
                           (user as any)?.role === 'admin' ? '/admin' : '/student'
      
      window.location.href = dashboardPath
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

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
    inputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    button: {
      width: '100%',
      padding: '0.875rem',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.025em'
    },
    buttonHover: {
      backgroundColor: '#2563eb'
    },
    buttonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    },
    error: {
      padding: '0.75rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      color: '#dc2626',
      fontSize: '0.875rem'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <svg style={styles.icon} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
          </svg>
          <h1 style={styles.title}>SFGS CBT Portal</h1>
          <p style={styles.subtitle}>Sure Foundation Comprehensive School</p>
          <p style={styles.schoolMotto}>Computer-Based Testing System</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Registration Number / Email / Username
            </label>
            <input
              type="text"
              style={styles.input}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your registration number, email, or username"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f8fafc', 
          borderRadius: '8px', 
          border: '1px solid #e2e8f0',
          fontSize: '0.75rem', 
          color: '#64748b', 
          textAlign: 'center' as const 
        }}>
          <p style={{ fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Test Credentials</p>
          <p style={{ margin: '0.25rem 0' }}>Student: <span style={{ fontWeight: '500', color: '#1e293b' }}>2023001</span> / password123</p>
          <p style={{ margin: '0.25rem 0' }}>Teacher: <span style={{ fontWeight: '500', color: '#1e293b' }}>teacher1</span> / password123</p>
          <p style={{ margin: '0.25rem 0' }}>Admin: <span style={{ fontWeight: '500', color: '#1e293b' }}>admin</span> / password123</p>
        </div>
      </div>
    </div>
  )
}