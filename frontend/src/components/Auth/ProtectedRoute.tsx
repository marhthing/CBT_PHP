import { useAuth } from '../../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Redirect to login if no user
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    console.log(`ProtectedRoute: User role ${user.role} doesn't match required ${requiredRole}`)

    // Redirect to user's appropriate dashboard
    const redirectPath = user.role === 'student' 
      ? '/student' 
      : user.role === 'teacher' 
      ? '/teacher' 
      : '/admin'

    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}