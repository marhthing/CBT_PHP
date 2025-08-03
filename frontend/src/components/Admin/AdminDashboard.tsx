import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'
import { BarChart3, FileText, PlayCircle, Users, GraduationCap, Clock, Plus, UserPlus, BookOpen, Activity, Database, Shield } from 'lucide-react'

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
  const [retrying, setRetrying] = useState(false)
  const [liveMetrics, setLiveMetrics] = useState({
    currentTime: new Date().toLocaleTimeString(),
    uptime: '24h 15m',
    memoryUsage: '24.5 MB',
    cpuUsage: '~12%'
  })
  const [apiResponseTime, setApiResponseTime] = useState('< 200ms')

  // Memoized fetch function with retry logic
  const fetchDashboardData = useCallback(async (retryCount = 0) => {
    const maxRetries = 3

    try {
      const statsResponse = await api.get('/admin/dashboard-stats')
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay
      const activitiesResponse = await api.get('/admin/test-codes?limit=8')

      setStats(statsResponse.data.data || statsResponse.data || {})
      setRecentActivities(activitiesResponse.data.data || activitiesResponse.data || [])
      setError('') // Clear any previous errors
    } catch (error: any) {
      console.error(`Failed to fetch dashboard data (attempt ${retryCount + 1}):`, error.message)

      if (retryCount < maxRetries && error.code === 'ECONNABORTED') {
        setRetrying(true)
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
        setTimeout(() => {
          setRetrying(false)
          fetchDashboardData(retryCount + 1)
        }, delay)
        return
      }

      setError('Failed to load dashboard data. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Live server time updates every second
  useEffect(() => {
    const updateServerTime = () => {
      setLiveMetrics(prev => ({
        ...prev,
        currentTime: new Date().toLocaleTimeString()
      }))
    }

    updateServerTime()
    const timeInterval = setInterval(updateServerTime, 1000)

    const measureApiResponseTime = async () => {
      try {
        const startTime = performance.now()
        await api.get('/health')
        const responseTime = Math.round(performance.now() - startTime)
        setApiResponseTime(`${responseTime}ms`)
      } catch (error) {
        setApiResponseTime('Error')
      }
    }

    measureApiResponseTime()
    const apiInterval = setInterval(measureApiResponseTime, 2000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(apiInterval)
    }
  }, [])

  const quickToggleActivation = useCallback(async (testCodeId: number, isActivated: boolean) => {
    try {
      await api.patch(`/admin/test-codes/${testCodeId}/toggle-activation`, {
        is_activated: !isActivated
      })

      setRecentActivities(prev => prev.map(activity => 
        activity.id === testCodeId 
          ? { ...activity, is_activated: !isActivated }
          : activity
      ))
    } catch (error: any) {
      console.error('Failed to toggle activation:', error)
      setError('Failed to toggle test code activation')
      await fetchDashboardData()
    }
  }, [fetchDashboardData])

  // Primary dashboard cards for core metrics
  const primaryCards = useMemo(() => [
    {
      title: 'Total Questions',
      value: stats.total_questions,
      color: '#3b82f6',
      icon: BarChart3,
      description: 'Questions in database',
      onClick: () => navigate('/admin/questions')
    },
    {
      title: 'Test Codes',
      value: stats.total_test_codes,
      color: '#8b5cf6',
      icon: FileText,
      description: 'Available test codes',
      onClick: () => navigate('/admin/testcodes')
    },
    {
      title: 'Active Tests',
      value: stats.active_test_codes,
      color: '#10b981',
      icon: PlayCircle,
      description: 'Currently active',
      onClick: () => navigate('/admin/testcodes')
    },
    {
      title: 'Teachers',
      value: stats.total_teachers,
      color: '#f59e0b',
      icon: Users,
      description: 'Registered teachers',
      onClick: () => navigate('/admin/teachers')
    },
    {
      title: 'Students',
      value: stats.total_students,
      color: '#ef4444',
      icon: GraduationCap,
      description: 'Registered students',
      onClick: () => navigate('/admin/students')
    },
    {
      title: 'Tests Today',
      value: stats.tests_today,
      color: '#06b6d4',
      icon: Clock,
      description: 'Tests taken today',
      onClick: () => navigate('/admin/results')
    }
  ], [stats, navigate])

  // Quick actions
  const quickActions = useMemo(() => [
    {
      title: 'Create Test Code',
      description: 'Generate new test codes',
      icon: Plus,
      onClick: () => navigate('/admin/testcodes'),
      color: '#3b82f6'
    },
    {
      title: 'Add Teacher',
      description: 'Register new teacher',
      icon: UserPlus,
      onClick: () => navigate('/admin/teachers'),
      color: '#10b981'
    },
    {
      title: 'Manage Questions',
      description: 'Add or edit questions',
      icon: BookOpen,
      onClick: () => navigate('/admin/questions'),
      color: '#8b5cf6'
    },
    {
      title: 'View Results',
      description: 'Check test results',
      icon: BarChart3,
      onClick: () => navigate('/admin/results'),
      color: '#f59e0b'
    }
  ], [navigate])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }, [])

  if (loading && !retrying) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-lg text-gray-500">
        <div className="flex items-center space-x-3">
          <div className="loading-spinner w-5 h-5"></div>
          Loading dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.full_name || 'Administrator'}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Server Time:</span> {liveMetrics.currentTime}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">API Response:</span> {apiResponseTime}
            </div>
          </div>
        </div>
      </div>

      {retrying && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-blue-800">
          <div className="flex items-center gap-3">
            <div className="loading-spinner w-4 h-4"></div>
            Retrying connection...
          </div>
        </div>
      )}

      {/* Primary Stats Cards */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Core Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {primaryCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <div
                key={index}
                onClick={card.onClick}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.color }}>
                      <IconComponent size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-sm text-gray-600 truncate">{card.title}</p>
                    <p className="text-xs text-gray-500 truncate">{card.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Test Codes */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Test Codes</h2>
            <button
              onClick={() => navigate('/admin/testcodes')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-base">No test codes created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="text-base font-semibold text-gray-900">{activity.title}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {activity.code}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {activity.subject_name} • {activity.class_level} • Used {activity.usage_count} times
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          quickToggleActivation(activity.id, activity.is_activated)
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                          activity.is_activated 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        {activity.is_activated ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-blue-300 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: action.color }}>
                      <IconComponent size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Time</span>
                <span className="text-sm font-medium text-gray-900">{liveMetrics.currentTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Response</span>
                <span className="text-sm font-medium text-gray-900">{apiResponseTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Memory Usage</span>
                <span className="text-sm font-medium text-gray-900">{liveMetrics.memoryUsage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CPU Usage</span>
                <span className="text-sm font-medium text-gray-900">{liveMetrics.cpuUsage}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}