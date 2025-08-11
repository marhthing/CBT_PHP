import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'
import { BarChart3, FileText, PlayCircle, Users, GraduationCap, Clock, Plus, UserPlus, BookOpen, Activity, Shield } from 'lucide-react'

interface DashboardStats {
  total_questions: number
  total_test_codes: number
  active_test_codes: number
  total_teachers: number
  total_students: number
  recent_tests: number
  tests_today: number
  average_score: number
  inactive_test_codes: number
  total_admins: number
  total_assignments: number
  most_active_subject: string
  most_active_subject_count: number
  completion_rate: number
}

interface RecentActivity {
  id: number
  code: string
  title: string
  subject_name: string
  class_level: string
  is_activated: boolean
  created_at: string
  usage_count: number
  created_by_name: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    total_questions: 0,
    total_test_codes: 0,
    active_test_codes: 0,
    total_teachers: 0,
    total_students: 0,
    recent_tests: 0,
    tests_today: 0,
    average_score: 0,
    inactive_test_codes: 0,
    total_admins: 0,
    total_assignments: 0,
    most_active_subject: '',
    most_active_subject_count: 0,
    completion_rate: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [apiResponseTime, setApiResponseTime] = useState('< 200ms')

  // Optimized fetch function with parallel requests
  const fetchDashboardData = useCallback(async (retryCount = 0) => {
    const maxRetries = 3

    try {
      const startTime = Date.now()
      const [statsResponse, activitiesResponse] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/test-codes?limit=8')
      ])
      const endTime = Date.now()
      setApiResponseTime(`${endTime - startTime}ms`)

      setStats(statsResponse.data.data || statsResponse.data || {})
      setRecentActivities(activitiesResponse.data.data || activitiesResponse.data || [])
      setError('')
    } catch (error: any) {
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return fetchDashboardData(retryCount + 1)
      }
      
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchDashboardData])



  const statCards = [
    { 
      title: 'Total Questions', 
      value: stats.total_questions, 
      icon: FileText, 
      color: '#3b82f6',
      bgColor: 'bg-blue-50',
      route: '/admin/questions'
    },
    { 
      title: 'Active Test Codes', 
      value: stats.active_test_codes, 
      icon: PlayCircle, 
      color: '#10b981',
      bgColor: 'bg-green-50',
      route: '/admin/test-codes'
    },
    { 
      title: 'Total Teachers', 
      value: stats.total_teachers, 
      icon: GraduationCap, 
      color: '#8b5cf6',
      bgColor: 'bg-purple-50',
      route: '/admin/teachers'
    },
    { 
      title: 'Total Students', 
      value: stats.total_students, 
      icon: Users, 
      color: '#f59e0b',
      bgColor: 'bg-amber-50',
      route: '#'
    },
    { 
      title: 'Tests Today', 
      value: stats.tests_today, 
      icon: Clock, 
      color: '#ef4444',
      bgColor: 'bg-red-50',
      route: '#'
    },
    { 
      title: 'Avg Score', 
      value: `${stats.average_score}%`, 
      icon: BarChart3, 
      color: '#06b6d4',
      bgColor: 'bg-cyan-50',
      route: '#'
    },
    { 
      title: 'Total Assignments', 
      value: stats.total_assignments, 
      icon: BookOpen, 
      color: '#84cc16',
      bgColor: 'bg-lime-50',
      route: '/admin/teachers'
    },
    { 
      title: 'Completion Rate', 
      value: `${stats.completion_rate}%`, 
      icon: Activity, 
      color: '#ec4899',
      bgColor: 'bg-pink-50',
      route: '#'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <ErrorNotification
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.username}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="text-sm text-gray-500">
              <span className="font-medium">Last Updated:</span> {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Cards - Improved Desktop Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {statCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <div
                key={index}
                onClick={() => card.route !== '#' && navigate(card.route)}
                className={`${card.bgColor} rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
                  card.route !== '#' ? 'cursor-pointer hover:scale-105' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold" style={{ color: card.color }}>
                      {card.value}
                    </p>
                  </div>
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: card.color, opacity: 0.1 }}
                  >
                    <IconComponent size={24} style={{ color: card.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions & Recent Activity - Better Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus size={20} />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/admin/questions')}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <FileText size={20} className="text-blue-600" />
                  <span className="font-medium text-gray-900">Add Questions</span>
                </button>
                <button
                  onClick={() => navigate('/admin/test-codes')}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-green-300 transition-colors"
                >
                  <PlayCircle size={20} className="text-green-600" />
                  <span className="font-medium text-gray-900">Generate Test Codes</span>
                </button>
                <button
                  onClick={() => navigate('/admin/teachers')}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-purple-300 transition-colors"
                >
                  <UserPlus size={20} className="text-purple-600" />
                  <span className="font-medium text-gray-900">Manage Teachers</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={20} />
                Recent Test Codes
              </h2>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 4).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-blue-600">
                            {activity.code}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            activity.is_activated 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.is_activated ? 'Active' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{activity.subject_name} - {activity.class_level}</p>
                        <p className="text-xs text-gray-500">Used {activity.usage_count} times</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PlayCircle size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent test codes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={20} />
            System Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Server Status</p>
              <p className="text-lg font-semibold text-green-600">Online</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">API Response</p>
              <p className={`text-lg font-semibold ${
                parseInt(apiResponseTime.replace('ms', '')) > 5000 
                  ? 'text-red-600' 
                  : parseInt(apiResponseTime.replace('ms', '')) > 2000 
                    ? 'text-yellow-600' 
                    : 'text-green-600'
              }`}>
                {apiResponseTime}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Database</p>
              <p className="text-lg font-semibold text-green-600">Connected</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Last Backup</p>
              <p className="text-lg font-semibold text-gray-600">Auto</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}