import { useState, ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getNavigationItems = () => {
    if (!user) return []

    const baseItems = [
      { name: 'Dashboard', path: `/${user.role}`, icon: '🏠' }
    ]

    if (user.role === 'student') {
      return [
        ...baseItems,
        { name: 'Take Test', path: '/student/test', icon: '📝' },
        { name: 'My Results', path: '/student/results', icon: '📊' }
      ]
    }

    if (user.role === 'teacher') {
      return [
        ...baseItems,
        { name: 'Questions', path: '/teacher/questions', icon: '❓' },
        { name: 'Upload Questions', path: '/teacher/upload', icon: '📤' }
      ]
    }

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Test Codes', path: '/admin/test-codes', icon: '🔑' },
        { name: 'All Questions', path: '/admin/questions', icon: '📚' },
        { name: 'Teachers', path: '/admin/teachers', icon: '👥' }
      ]
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Mobile Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ☰
          </button>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>SFCS CBT</div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              {user?.full_name}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Logout
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100
          }}
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              background: 'white',
              padding: '20px 0',
              boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div style={{
              padding: '0 20px 20px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                margin: '0 auto 12px'
              }}>
                SFCS
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {user?.full_name}
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#64748b',
                textTransform: 'capitalize'
              }}>
                {user?.role}
              </div>
            </div>

            {/* Navigation */}
            <nav style={{ padding: '20px 0' }}>
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setIsSidebarOpen(false)
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    border: 'none',
                    background: location.pathname === item.path ? '#f1f5f9' : 'transparent',
                    color: location.pathname === item.path ? '#1e40af' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{
        padding: '16px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e2e8f0',
        padding: '8px 0',
        display: 'flex',
        justifyContent: 'space-around',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 40
      }}>
        {navigationItems.slice(0, 4).map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              padding: '8px 12px',
              cursor: 'pointer',
              color: location.pathname === item.path ? '#1e40af' : '#64748b',
              fontSize: '10px',
              fontWeight: '500'
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span>{item.name.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      {/* Add bottom padding to main content to account for bottom nav */}
      <div style={{ height: '80px' }}></div>
    </div>
  )
}