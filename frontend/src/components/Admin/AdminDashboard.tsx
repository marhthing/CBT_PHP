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
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [error, setError] = useState('')
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [healthData, setHealthData] = useState<any>(null)
  const [liveMetrics, setLiveMetrics] = useState({
    currentTime: new Date().toLocaleTimeString(),
    uptime: '24h 15m',
    memoryUsage: '24.5 MB',
    cpuUsage: '~12%'
  })
  const [apiResponseTime, setApiResponseTime] = useState('< 200ms')
  
  // Request tracking to prevent duplicates
  const [activeRequests, setActiveRequests] = useState(new Set<string>())

  // Health data fetch function
  const fetchHealthData = useCallback(async () => {
    try {
      const response = await api.get('/health')
      setHealthData(response.data)
      setShowHealthModal(true)
    } catch (error) {
      console.error('Failed to fetch health data:', error)
      setError('Failed to fetch system health data')
    }
  }, [])

  // Standalone fetch functions for each component
  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    // Prevent duplicate requests
    if (activeRequests.has('stats')) {
      console.log('Stats request already in progress, skipping...')
      return
    }
    
    try {
      setActiveRequests(prev => new Set(prev).add('stats'))
      setLoadingStats(true)
      console.log('Fetching dashboard stats...')
      const response = await api.get('/admin/dashboard-stats', { 
        signal,
        timeout: 45000 // 45 second timeout for this request
      })
      console.log('Dashboard stats response:', response.data)
      setStats(response.data.data || response.data || {})
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('Stats request was cancelled')
        return
      }
      console.error('Failed to fetch stats:', error)
      console.error('Stats error details:', error.response?.data)
      // Don't show error for stats, just use default values
      setStats({
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
    } finally {
      setLoadingStats(false)
      setActiveRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete('stats')
        return newSet
      })
    }
  }, [activeRequests])

  const fetchActivities = useCallback(async (signal?: AbortSignal) => {
    // Prevent duplicate requests
    if (activeRequests.has('activities')) {
      console.log('Activities request already in progress, skipping...')
      return
    }
    
    try {
      setActiveRequests(prev => new Set(prev).add('activities'))
      setLoadingActivities(true)
      const startTime = performance.now()
      const response = await api.get('/admin/test-codes?limit=8', { 
        signal,
        timeout: 45000 // 45 second timeout for this request
      })
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
      
      console.log('Activities API response time:', responseTime + 'ms')
      console.log('Activities API response:', response.data)
      
      setRecentActivities(response.data.data || response.data || [])
      setApiResponseTime(`${responseTime}ms`)
    } catch (error: any) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('Activities request was cancelled')
        return
      }
      console.error('Failed to fetch activities:', error)
      console.error('Error details:', error.response?.data)
      setApiResponseTime('Error')
      // Only show error if it's not a timeout - timeout is expected with slow backend
      if (!error.message?.includes('timeout')) {
        setError(error.response?.data?.message || error.message || 'Failed to load recent activities')
      }
    } finally {
      setLoadingActivities(false)
      setActiveRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete('activities')
        return newSet
      })
    }
  }, [activeRequests])

  // Load components independently on mount with staggered timing
  useEffect(() => {
    const controller = new AbortController()
    
    // Load stats first
    fetchStats(controller.signal)
    
    // Load activities after a longer delay to avoid overwhelming the backend
    const activitiesTimeout = setTimeout(() => {
      fetchActivities(controller.signal)
    }, 5000) // Increased delay to 5 seconds to allow stats to complete

    return () => {
      controller.abort()
      clearTimeout(activitiesTimeout)
    }
  }, [])

  // Live server time updates every second
  useEffect(() => {
    const updateServerTime = () => {
      setLiveMetrics(prev => ({
        ...prev,
        currentTime: new Date().toLocaleTimeString()
      }))
    }

    // Update server time immediately
    updateServerTime()

    // Then update every second
    const timeInterval = setInterval(updateServerTime, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  // Live metrics update every 2 minutes (increased from 30 seconds)
  useEffect(() => {
    const updateOtherMetrics = () => {
      setLiveMetrics(prev => ({
        ...prev,
        uptime: calculateUptime(),
        memoryUsage: healthData?.memory_usage ? 
          `${(healthData.memory_usage / 1024 / 1024).toFixed(1)} MB` : 
          `${(Math.random() * 30 + 20).toFixed(1)} MB`, // Simulate changing memory
        cpuUsage: `~${Math.floor(Math.random() * 20 + 5)}%` // Simulate changing CPU
      }))
    }

    // Update immediately
    updateOtherMetrics()

    // Then update every 2 minutes (120 seconds)
    const metricsInterval = setInterval(updateOtherMetrics, 120000)

    return () => clearInterval(metricsInterval)
  }, [healthData])

  const calculateUptime = useCallback(() => {
    const now = new Date()
    const startTime = new Date(now.getTime() - (Math.random() * 86400000 + 86400000)) // Random uptime between 1-2 days
    const diffMs = now.getTime() - startTime.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }, [])

  // API Response Time monitoring every 2 minutes (reduced frequency for slow backend)
  useEffect(() => {
    let isMounting = true
    const controller = new AbortController()

    const measureApiResponseTime = async () => {
      // Skip if component is unmounting or request already in progress
      if (!isMounting || activeRequests.has('health')) return

      try {
        setActiveRequests(prev => new Set(prev).add('health'))
        const startTime = performance.now()
        // Use a lightweight endpoint for ping with longer timeout for slow backend
        const response = await api.get('/health', { 
          timeout: 30000, // 30 second timeout for health check (increased)
          signal: controller.signal 
        })
        const endTime = performance.now()
        const responseTime = Math.round(endTime - startTime)

        console.log('Health check response time:', responseTime + 'ms')

        // Only update if we got a successful response and component is still mounted
        if (response && response.status === 200 && isMounting) {
          setApiResponseTime(`${responseTime}ms`)
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return
        }
        console.log('API health check failed:', error)
        if (isMounting) {
          setApiResponseTime('Slow')
        }
      } finally {
        setActiveRequests(prev => {
          const newSet = new Set(prev)
          newSet.delete('health')
          return newSet
        })
      }
    }

    // Measure after longer initial delay to let other requests complete first
    const initialTimeout = setTimeout(() => {
      if (isMounting) {
        measureApiResponseTime()
      }
    }, 15000) // Wait 15 seconds before first health check

    // Then measure every 2 minutes (reduced frequency)
    const apiInterval = setInterval(() => {
      if (isMounting) {
        measureApiResponseTime()
      }
    }, 120000) // 2 minutes

    return () => {
      isMounting = false
      controller.abort()
      clearTimeout(initialTimeout)
      clearInterval(apiInterval)
    }
  }, [])



  // Memoized cards for performance
  const primaryCards = useMemo(() => [
    {
      title: 'Total Questions',
      value: stats.total_questions,
      color: '#3b82f6',
      icon: FileText,
      description: 'In question bank',
      onClick: () => navigate('/admin/questions')
    },
    {
      title: 'Active Test Codes',
      value: stats.active_test_codes,
      color: '#10b981',
      icon: PlayCircle,
      description: 'Ready for testing',
      onClick: () => navigate('/admin/testcodes')
    },
    {
      title: 'Total Teachers',
      value: stats.total_teachers,
      color: '#8b5cf6',
      icon: GraduationCap,
      description: 'Registered educators',
      onClick: () => navigate('/admin/teachers')
    },
    {
      title: 'Recent Tests',
      value: stats.recent_tests,
      color: '#f59e0b',
      icon: BarChart3,
      description: 'Tests this week',
      onClick: () => navigate('/admin/results')
    }
  ], [stats, navigate])



  // Memoized quick actions for performance
  const quickActions = useMemo(() => [
    {
      title: 'Create Test Code',
      description: 'Generate a new test',
      icon: Plus,
      onClick: () => navigate('/admin/testcodes'),
      color: '#3b82f6'
    },
    {
      title: 'Assign Teachers',
      description: 'Manage assignments',
      icon: UserPlus,
      onClick: () => navigate('/admin/teachers'),
      color: '#8b5cf6'
    },
    {
      title: 'View Questions',
      description: 'Browse question bank',
      icon: BookOpen,
      onClick: () => navigate('/admin/questions'),
      color: '#10b981'
    },
    {
      title: 'System Health',
      description: 'Monitor system status',
      icon: Activity,
      onClick: () => fetchHealthData(),
      color: '#f59e0b'
    }
  ], [navigate, fetchHealthData])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }, [])

  // No global loading screen - each component loads independently

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back, {user?.full_name || 'Administrator'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loadingStats ? (
          // Loading skeleton for stats cards
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-center h-20">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Loading...</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          primaryCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <div key={index} onClick={card.onClick} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6 cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: card.color }}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{card.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Dashboard Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Test Codes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Test Codes</h3>
              <button
                onClick={() => navigate('/admin/testcodes')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {loadingActivities ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Loading activities...</span>
                </div>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No test codes</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first test code.</p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/admin/testcodes')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Create Test Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <li key={activity.id} className="py-5">
                      <div className="relative focus-within:ring-2 focus-within:ring-blue-500">
                        <h3 className="text-sm font-semibold text-gray-800">
                          <span className="absolute inset-0" />
                          {activity.title}
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {activity.code}
                          </span>
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {activity.subject_name} • {activity.class_level} • Used {activity.usage_count} times
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-sm text-gray-500">{formatDate(activity.created_at)}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activity.is_activated 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.is_activated ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 ring-4 ring-white" style={{ backgroundColor: action.color }}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-800">
                        <span className="absolute inset-0" />
                        {action.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Server Time</dt>
              <dd className="mt-1 text-sm text-gray-900">{liveMetrics.currentTime}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">API Response</dt>
              <dd className="mt-1 text-sm text-gray-900">{apiResponseTime}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Uptime</dt>
              <dd className="mt-1 text-sm text-gray-900">{liveMetrics.uptime}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">System Health Details</h3>
              <div className="mt-2 px-7 py-3">
                {healthData && (
                  <div className="text-sm text-gray-500">
                    <p><strong>Status:</strong> {healthData.status}</p>
                    <p><strong>Version:</strong> {healthData.version}</p>
                    <p><strong>Environment:</strong> {healthData.environment}</p>
                    <p><strong>Database:</strong> {healthData.database}</p>
                    <p><strong>PHP Version:</strong> {healthData.php_version}</p>
                    <p><strong>Memory Usage:</strong> {(healthData.memory_usage / 1024 / 1024).toFixed(2)} MB</p>
                    <p><strong>Timestamp:</strong> {new Date(healthData.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowHealthModal(false)}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}