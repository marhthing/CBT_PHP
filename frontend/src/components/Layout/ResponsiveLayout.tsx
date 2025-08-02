import { useState, ReactNode, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

interface ResponsiveLayoutProps {
  children: ReactNode
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

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

  const SidebarContent = () => (
    <div style={{
      height: '100%',
      background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '0 auto 12px'
        }}>
          SFCS
        </div>
        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {user?.full_name}
        </div>
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          opacity: 0.8,
          textTransform: 'capitalize'
        }}>
          {user?.role}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '20px 0' }}>
        {navigationItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path)
              if (isMobile) setIsSidebarOpen(false)
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              border: 'none',
              background: location.pathname === item.path ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                const target = e.target as HTMLButtonElement
                target.style.background = 'rgba(255, 255, 255, 0.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                const target = e.target as HTMLButtonElement
                target.style.background = 'transparent'
              }
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.name}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div style={{ padding: '20px' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            background: 'rgba(220, 38, 38, 0.2)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            color: 'white',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.background = 'rgba(220, 38, 38, 0.3)'
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.background = 'rgba(220, 38, 38, 0.2)'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )

  if (isMobile) {
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
                background: 'white'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main style={{
          padding: '16px',
          paddingBottom: '80px'
        }}>
          {children}
        </main>

        {/* Bottom Navigation for Mobile - Only show for students */}
        {user?.role === 'student' && (
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
            {navigationItems.slice(0, 3).map((item) => (
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
        )}
      </div>
    )
  }

  // Desktop Layout
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc', 
      display: 'flex',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: '280px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 30
      }}>
        <SidebarContent />
      </aside>

      {/* Desktop Main Content */}
      <main style={{
        flex: '1',
        marginLeft: '280px',
        padding: '32px',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  )
}