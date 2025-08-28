import { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Home, 
  FileText, 
  BarChart3, 
  Users, 
  Key, 
  BookOpen, 
  LogOut
} from 'lucide-react'

interface MobileBottomBarProps {
  children: ReactNode
}

export default function MobileBottomBar({ children }: MobileBottomBarProps) {
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
      { name: 'Dashboard', path: `/${user.role}`, icon: Home }
    ]

    if (user.role === 'student') {
      return [
        ...baseItems,
        { name: 'Take Test', path: '/student/test', icon: FileText },
        { name: 'My Results', path: '/student/results', icon: BarChart3 }
      ]
    }

    if (user.role === 'teacher') {
      return [
        ...baseItems,
        { name: 'Questions', path: '/teacher/questions', icon: BookOpen }
      ]
    }

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Test Codes', path: '/admin/test-codes', icon: Key },
        { name: 'Questions', path: '/admin/questions', icon: BookOpen },
        { name: 'Teachers', path: '/admin/teachers', icon: Users }
      ]
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-semibold">SFGS</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">CBT Portal</h1>
                <p className="text-xs text-gray-500">Sure Foundation Group of School</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Main Content */}
        <main className="pb-16 px-4 py-6">
          {children}
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        {/* Desktop Sidebar */}
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-10">
          {/* Desktop Header in Sidebar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">SFGS</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">CBT Portal</h1>
                <p className="text-sm text-gray-500">Sure Foundation Group of School</p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </div>

          {/* Desktop Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Desktop Main Content */}
        <main className="ml-64 flex-1 px-6 py-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <nav id="mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex items-center justify-evenly">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-1 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} />
                <span className="text-xs mt-1 truncate max-w-full">{item.name}</span>
              </button>
            )
          })}
          
          {/* Mobile Logout Button */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center py-2 px-1 text-red-500 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs mt-1 truncate max-w-full">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}