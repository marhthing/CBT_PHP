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
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
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
