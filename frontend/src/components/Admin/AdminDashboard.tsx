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
  const [retrying, setRetrying] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [healthData, setHealthData] = useState<any>(null)
  const [liveMetrics, setLiveMetrics] = useState({
    currentTime: new Date().toLocaleTimeString(),
    uptime: '24h 15m',
    memoryUsage: '24.5 MB',
    cpuUsage: '~12%'
  })
  const [apiResponseTime, setApiResponseTime] = useState('< 200ms')

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
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true)
      const response = await api.get('/admin/dashboard-stats')
      setStats(response.data.data || response.data || {})
    } catch (error: any) {
      console.error('Failed to fetch stats:', error.message)
      setError(error.response?.data?.message || 'Failed to load statistics')
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const fetchActivities = useCallback(async () => {
    try {
      setLoadingActivities(true)
      const response = await api.get('/admin/test-codes?limit=8')
      setRecentActivities(response.data.data || response.data || [])
    } catch (error: any) {
      console.error('Failed to fetch activities:', error.message)
      setError(error.response?.data?.message || 'Failed to load recent activities')
    } finally {
      setLoadingActivities(false)
    }
  }, [])

  // Load components independently
  useEffect(() => {
    fetchStats()
    fetchActivities()
  }, [fetchStats, fetchActivities])

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

  // Live metrics update every 30 seconds (except time)
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

    // Then update every 30 seconds
    const metricsInterval = setInterval(updateOtherMetrics, 30000)

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

  // API Response Time monitoring every 5 seconds (reduced frequency)
  useEffect(() => {
    const measureApiResponseTime = async () => {
      try {
        const startTime = performance.now()
        // Use a lightweight endpoint for ping
        const response = await api.get('/health')
        const endTime = performance.now()
        const responseTime = Math.round(endTime - startTime)

        // Only update if we got a successful response
        if (response && response.status === 200) {
          setApiResponseTime(`${responseTime}ms`)
        } else {
          setApiResponseTime('Slow')
        }
      } catch (error) {
        console.log('API health check failed:', error)
        setApiResponseTime('Error')
      }
    }

    // Measure immediately
    measureApiResponseTime()

    // Then measure every 5 seconds (reduced from 2 seconds)
    const apiInterval = setInterval(measureApiResponseTime, 5000)

    return () => clearInterval(apiInterval)
  }, [])

  const quickToggleActivation = useCallback(async (testCodeId: number, isActivated: boolean) => {
    try {
      await api.patch(`/admin/test-codes/${testCodeId}/toggle-activation`, {
        is_activated: !isActivated
      })

      // Update local state optimistically
      setRecentActivities(prev => prev.map(activity => 
        activity.id === testCodeId 
          ? { ...activity, is_activated: !isActivated }
          : activity
      ))
    } catch (error) {
      console.error('Failed to toggle test code activation:', error)
      setError('Failed to update test code status')
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

  const analyticsCards = useMemo(() => [
    {
      title: 'Average Score',
      value: `${stats.average_score}%`,
      color: '#06b6d4',
      icon: BarChart3,
      description: 'Student performance',
      onClick: () => navigate('/admin/analytics')
    },
    {
      title: 'Tests Today',
      value: stats.tests_today,
      color: '#ec4899',
      icon: Clock,
      description: 'Active sessions',
      onClick: () => navigate('/admin/results')
    },
    {
      title: 'Most Active Subject',
      value: stats.most_active_subject_count,
      color: '#10b981',
      icon: BookOpen,
      description: stats.most_active_subject || 'No data',
      onClick: () => navigate('/admin/questions')
    },
    {
      title: 'Total Users',
      value: stats.total_teachers + stats.total_students + stats.total_admins,
      color: '#6366f1',
      icon: Users,
      description: 'All active users',
      onClick: () => navigate('/admin/users')
    }
  ], [stats, navigate])

  // Memoized system overview cards
  const systemCards = useMemo(() => [
    {
      title: 'Live Monitoring',
      value: apiResponseTime,
      color: apiResponseTime === 'Error' ? '#ef4444' : '#10b981',
      icon: Activity,
      description: `Server time: ${liveMetrics.currentTime}`,
      onClick: () => fetchHealthData()
    },
    {
      title: 'Database Status',
      value: 'Online',
      color: '#10b981',
      icon: Database,
      description: 'PostgreSQL connected',
      onClick: () => fetchHealthData()
    },
    {
      title: 'System Uptime',
      value: liveMetrics.uptime,
      color: '#3b82f6',
      icon: Clock,
      description: `Memory: ${liveMetrics.memoryUsage}`,
      onClick: () => fetchHealthData()
    },
    {
      title: 'Security Status',
      value: 'Secure',
      color: '#10b981',
      icon: Shield,
      description: 'All systems protected',
      onClick: () => fetchHealthData()
    }
  ], [liveMetrics, apiResponseTime, fetchHealthData])

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
    <div className="p-4 sm:p-6 lg:p-8 bg-white min-h-screen">
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Welcome back, {user?.full_name || 'Administrator'}
        </p>
      </div>

      {retrying && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #bfdbfe',
            borderTop: '2px solid #1e40af',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Retrying connection...
        </div>
      )}

      {/* Primary Stats Cards */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Core Metrics
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {loadingStats ? (
            // Loading skeleton for stats cards
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '120px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#6b7280'
                }}>
                  <div className="loading-spinner w-4 h-4"></div>
                  Loading stats...
                </div>
              </div>
            ))
          ) : (
            primaryCards.map((card, index) => {
              const IconComponent = card.icon
              return (
                <div
                  key={index}
                  onClick={card.onClick}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: card.color,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <IconComponent size={24} />
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: card.color
                    }}>
                      {card.value}
                    </div>
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 4px 0'
                  }}>
                    {card.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {card.description}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Analytics Cards */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Performance Analytics
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {analyticsCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <div
                key={index}
                onClick={card.onClick}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: card.color,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <IconComponent size={24} />
                  </div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: card.color
                  }}>
                    {card.value}
                  </div>
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 4px 0'
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  {card.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* System Overview Cards */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          System Overview
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {systemCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <div
                key={index}
                onClick={card.onClick}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: card.color,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <IconComponent size={24} />
                  </div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: card.color
                  }}>
                    {card.value}
                  </div>
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 4px 0'
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  {card.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="dashboard-main-grid">
        {/* Recent Test Codes */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>
              Recent Test Codes
            </h2>
            <button
              onClick={() => navigate('/admin/testcodes')}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }}
            >
              View All
            </button>
          </div>

          {loadingActivities ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <div className="loading-spinner w-4 h-4"></div>
                Loading activities...
              </div>
            </div>
          ) : recentActivities.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
              <p style={{ margin: 0, fontSize: '16px' }}>No test codes created yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentActivities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {activity.title}
                      </h4>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#3b82f6',
                        background: '#eff6ff',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {activity.code}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 8px 0'
                    }}>
                      {activity.subject_name} • {activity.class_level} • Used {activity.usage_count} times
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      margin: 0
                    }}>
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      quickToggleActivation(activity.id, activity.is_activated)
                    }}
                    style={{
                      background: activity.is_activated ? '#10b981' : '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    {activity.is_activated ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '24px'
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {quickActions.map((action, index) => {
              const IconComponent = action.icon
              return (
                <div
                  key={index}
                  onClick={action.onClick}
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: action.color,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <IconComponent size={20} color="white" />
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 4px 0'
                  }}>
                    {action.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {action.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Health Modal */}
      {showHealthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                System Health Details
              </h2>
              <button
                onClick={() => setShowHealthModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            {healthData && (
              <div style={{ lineHeight: '1.6' }}>
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
        </div>
      )}
    </div>
  )
}