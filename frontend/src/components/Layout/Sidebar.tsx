import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
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

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-4">
      <div className="flex items-center gap-2 mb-8">
        <GraduationCap className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold">CBT Portal</h1>
      </div>

      <div className="mb-6">
        <div className="text-sm text-muted-foreground">Welcome,</div>
        <div className="font-medium">{user?.full_name}</div>
        <div className="text-xs text-muted-foreground capitalize">
          {user?.role}
        </div>
      </div>

      <nav className="space-y-2 mb-8">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
