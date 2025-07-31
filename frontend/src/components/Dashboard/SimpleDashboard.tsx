import { useAuth } from '../../contexts/AuthContext'

export default function SimpleDashboard() {
  const { user, logout } = useAuth()

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      padding: '1rem 2rem'
    },
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    userDetails: {
      textAlign: 'right' as const
    },
    userName: {
      fontWeight: '500',
      color: '#1f2937'
    },
    userRole: {
      fontSize: '0.875rem',
      color: '#6b7280',
      textTransform: 'capitalize' as const
    },
    logoutButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem'
    },
    welcome: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem'
    },
    welcomeTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '0.5rem'
    },
    welcomeText: {
      color: '#6b7280',
      lineHeight: '1.6'
    },
    roleCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    },
    roleTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '1rem'
    },
    roleFeatures: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    roleFeature: {
      padding: '0.5rem 0',
      color: '#4b5563',
      borderBottom: '1px solid #f3f4f6'
    }
  }

  const getRoleFeatures = () => {
    switch (user?.role) {
      case 'student':
        return [
          'Take online tests and quizzes',
          'View test results and scores',
          'Access test history',
          'View upcoming tests'
        ]
      case 'teacher':
        return [
          'Create and manage questions',
          'Upload questions in bulk',
          'Assign tests to classes',
          'View student results'
        ]
      case 'admin':
        return [
          'Generate test codes',
          'Manage teachers and assignments',
          'View all questions and tests',
          'System administration'
        ]
      default:
        return []
    }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>CBT Portal</h1>
          <div style={styles.userInfo}>
            <div style={styles.userDetails}>
              <div style={styles.userName}>{user?.full_name}</div>
              <div style={styles.userRole}>{user?.role}</div>
            </div>
            <button
              onClick={logout}
              style={styles.logoutButton}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.welcome}>
          <h2 style={styles.welcomeTitle}>
            Welcome, {user?.full_name}!
          </h2>
          <p style={styles.welcomeText}>
            You have successfully logged in to the CBT Portal as a {user?.role}. 
            The system automatically detected your role based on your login credentials.
            {user?.role === 'student' && user?.reg_number && (
              ` Your registration number is ${user.reg_number}.`
            )}
            {user?.current_term && user?.current_session && (
              ` Current academic session: ${user.current_session}, ${user.current_term} Term.`
            )}
          </p>
        </div>

        <div style={styles.roleCard}>
          <h3 style={styles.roleTitle}>Available Features</h3>
          <ul style={styles.roleFeatures}>
            {getRoleFeatures().map((feature, index) => (
              <li key={index} style={styles.roleFeature}>
                • {feature}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}