import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  FileText,
  LogOut,
  BookOpen,
  Upload,
  ClipboardList,
  UserCheck,
  GraduationCap
} from 'lucide-react'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const getMenuItems = () => {
    switch (user?.role) {
      case 'student':
        return [
          {
            icon: LayoutDashboard,
            label: 'Dashboard',
            path: '/student',
          },
          {
            icon: ClipboardList,
            label: 'Test Results',
            path: '/student/results',
          },
        ]
      case 'teacher':
        return [
          {
            icon: LayoutDashboard,
            label: 'Dashboard',
            path: '/teacher',
          },
          {
            icon: FileText,
            label: 'Questions',
            path: '/teacher/questions',
          },
          {
            icon: Upload,
            label: 'Bulk Upload',
            path: '/teacher/bulk-upload',
          },
        ]
      case 'admin':
        return [
          {
            icon: LayoutDashboard,
            label: 'Dashboard',
            path: '/admin',
          },
          {
            icon: BookOpen,
            label: 'Test Codes',
            path: '/admin/test-codes',
          },
          {
            icon: UserCheck,
            label: 'Teachers',
            path: '/admin/teachers',
          },
          {
            icon: FileText,
            label: 'All Questions',
            path: '/admin/questions',
          },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  const styles = {
    sidebar: {
      width: '280px',
      height: '100vh',
      background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
      color: 'white',
      position: 'fixed' as const,
      left: 0,
      top: 0,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
    },
    header: {
      padding: '2rem 1.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center' as const
    },
    logo: {
      width: '60px',
      height: '60px',
      margin: '0 auto 1rem',
      backgroundColor: '#4f46e5',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)'
    },
    schoolName: {
      fontSize: '1.125rem',
      fontWeight: '700',
      color: '#f1f5f9',
      marginBottom: '0.25rem',
      lineHeight: '1.3'
    },
    acronym: {
      fontSize: '0.875rem',
      color: '#94a3b8',
      fontWeight: '500',
      letterSpacing: '0.05em'
    },
    userInfo: {
      padding: '1.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    },
    userName: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#f1f5f9',
      marginBottom: '0.25rem'
    },
    userRole: {
      fontSize: '0.875rem',
      color: '#94a3b8',
      textTransform: 'capitalize' as const,
      fontWeight: '500'
    },
    nav: {
      flex: 1,
      padding: '1rem 0',
      overflowY: 'auto' as const
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.875rem 1.5rem',
      color: '#cbd5e1',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      fontSize: '0.875rem',
      fontWeight: '500',
      borderLeft: '3px solid transparent'
    },
    activeMenuItem: {
      backgroundColor: 'rgba(79, 70, 229, 0.2)',
      color: '#f1f5f9',
      borderLeftColor: '#4f46e5',
      boxShadow: 'inset 0 0 20px rgba(79, 70, 229, 0.1)'
    },
    menuIcon: {
      width: '20px',
      height: '20px'
    },
    logoutContainer: {
      padding: '1.5rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    },
    logoutButton: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.875rem 1rem',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: '#fca5a5',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '0.875rem',
      fontWeight: '500'
    }
  }

  return (
    <aside style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <GraduationCap size={32} color="white" />
        </div>
        <h1 style={styles.schoolName}>
          Sure Foundation<br />
          Comprehensive School
        </h1>
        <p style={styles.acronym}>SFGS CBT Portal</p>
      </div>

      {/* User Info */}
      <div style={styles.userInfo}>
        <div style={styles.userName}>{user?.full_name}</div>
        <div style={styles.userRole}>{user?.role}</div>
        {user?.current_session && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {user.current_session} • {user.current_term} Term
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.menuItem,
                ...(isActive ? styles.activeMenuItem : {}),
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.color = '#f1f5f9'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#cbd5e1'
                }
              }}
            >
              <Icon style={styles.menuIcon} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={styles.logoutContainer}>
        <button
          onClick={logout}
          style={styles.logoutButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)'
          }}
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}