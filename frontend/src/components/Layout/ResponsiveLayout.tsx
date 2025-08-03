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
        { name: 'Question Bank', path: '/teacher/questions', icon: '📚' }
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
    <div className="h-full bg-gradient-to-b from-secondary-800 to-secondary-900 text-white flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-white/10">
        <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
          SFCS
        </div>
        <div className="text-center">
          <div className="font-semibold text-sm truncate">
            {user?.full_name}
          </div>
          <div className="text-xs opacity-80 capitalize mt-1">
            {user?.role}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2">
        <div className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                if (isMobile) setIsSidebarOpen(false)
              }}
              className={`nav-item w-full ${
                location.pathname === item.path 
                  ? 'bg-white/15 text-white' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="w-full bg-danger-500/20 border border-danger-500/30 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:bg-danger-500/30 hover:border-danger-500/40"
        >
          <span className="flex items-center justify-center space-x-2">
            <span>🚪</span>
            <span>Logout</span>
          </span>
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <div className="font-bold text-lg">SFCS CBT</div>
              <div className="text-xs opacity-90 truncate max-w-48">
                {user?.full_name}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-white/20 px-3 py-2 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
          >
            Logout
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div
              className="w-80 h-full bg-white transform transition-transform duration-300 ease-in-out"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="p-4 pb-20 min-h-screen">
          {children}
        </main>

        {/* Bottom Navigation for Mobile */}
        {user?.role === 'student' && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around shadow-moderate z-40">
            {navigationItems.slice(0, 3).map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-medium">{item.name.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    )
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="w-80 h-screen fixed left-0 top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Desktop Main Content */}
      <main className="flex-1 ml-80 p-6 lg:p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}