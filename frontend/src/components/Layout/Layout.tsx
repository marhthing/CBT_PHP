import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc' 
      }}>
        {children}
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      display: 'flex',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Sidebar />
      <main style={{
        flex: '1',
        marginLeft: '280px',
        padding: '2rem',
        transition: 'margin-left 0.3s ease'
      }}>
        {children}
      </main>
    </div>
  )
}