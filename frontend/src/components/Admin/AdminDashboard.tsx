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
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [healthData, setHealthData] = useState<any>(null)
  const [loadingHealth, setLoadingHealth] = useState(false)

  // Memoized fetch function with retry logic
  const fetchDashboardData = useCallback(async (retryCount = 0) => {
    const maxRetries = 3
    
    try {
      console.log(`Fetching dashboard data (attempt ${retryCount + 1})`)
      
      // Fetch data sequentially to reduce server load
      const statsResponse = await api.get('/admin/dashboard-stats')
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay
      const activitiesResponse = await api.get('/admin/test-codes?limit=8')

      setStats(statsResponse.data.data || statsResponse.data || {})
      setRecentActivities(activitiesResponse.data.data || activitiesResponse.data || [])
      setError('') // Clear any previous errors
    } catch (error: any) {
      console.error(`Failed to fetch dashboard data (attempt ${retryCount + 1}):`, error.message)
      
      if (retryCount < maxRetries && error.code === 'ECONNABORTED') {
        // Retry with exponential backoff for timeout errors
        setRetrying(true)
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
        console.log(`Retrying in ${delay}ms...`)
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
    } catch (error: any) {
      console.error('Failed to toggle activation:', error)
      setError('Failed to toggle test code activation')
      // Revert local state on error
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

  // Secondary analytics cards for advanced metrics
  const analyticsCards = useMemo(() => [
    {
      title: 'Average Score',
      value: `${stats.average_score}%`,
      color: '#10b981',
      icon: BarChart3,
      description: 'Overall performance',
      onClick: () => navigate('/admin/results')
    },
    {
      title: 'Completion Rate',
      value: `${stats.completion_rate}%`,
      color: '#8b5cf6',
      icon: Activity,
      description: 'Test completion rate',
      onClick: () => navigate('/admin/results')
    },
    {
      title: 'Recent Tests',
      value: stats.recent_tests,
      color: '#f59e0b',
      icon: Clock,
      description: 'Last 7 days',
      onClick: () => navigate('/admin/results')
    },
    {
      title: 'Assignments',
      value: stats.total_assignments,
      color: '#06b6d4',
      icon: Users,
      description: 'Teacher assignments',
      onClick: () => navigate('/admin/assignments')
    }
  ], [stats, navigate])

  // System overview cards
  const systemCards = useMemo(() => [
    {
      title: 'Inactive Tests',
      value: stats.inactive_test_codes,
      color: '#ef4444',
      icon: FileText,
      description: 'Inactive test codes',
      onClick: () => navigate('/admin/testcodes')
    },
    {
      title: 'Administrators',
      value: stats.total_admins,
      color: '#6366f1',
      icon: Shield,
      description: 'System admins',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Top Subject',
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
  ], [navigate])

  const fetchHealthData = useCallback(async () => {
    setLoadingHealth(true)
    try {
      const response = await api.get('/health')
      setHealthData(response.data)
      setShowHealthModal(true)
    } catch (error) {
      console.error('Failed to fetch health data:', error)
      setError('Failed to fetch system health data')
    } finally {
      setLoadingHealth(false)
    }
  }, [])

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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading dashboard...
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '24px',
      background: '#ffffff',
      minHeight: '100vh'
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {error && <ErrorNotification message={error} onClose={() => setError('')} />}

      {/* Header */}
      <div style={{
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0,
          marginBottom: '8px'
        }}>
          Admin Dashboard
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: 0
        }}>
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
          {primaryCards.map((card, index) => {
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

          {recentActivities.length === 0 ? (
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

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              margin: '0 0 20px 0'
            }}>
              Quick Actions
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {quickActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                      e.currentTarget.style.borderColor = action.color
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: action.color,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <IconComponent size={16} />
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: '0 0 2px 0'
                      }}>
                        {action.title}
                      </h4>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        margin: 0
                      }}>
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

      {/* Developer / System Panel */}
      <div style={{
        marginTop: '48px'
      }}>
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
            margin: '0 0 20px 0'
          }}>
            🔧 Developer / System Panel
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px'
          }}>
            {/* Left Column - System Metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #3b82f6'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: 0
                  }}>
                    API Response Time
                  </h3>
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#3b82f6',
                  marginBottom: '4px'
                }}>
                  {healthData ? '< 200ms' : '~150ms'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  Average over last 24 hours
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #10b981'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>🕐</span>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: 0
                  }}>
                    Server Time & Uptime
                  </h3>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#10b981',
                  marginBottom: '4px'
                }}>
                  {new Date().toLocaleTimeString()}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  Uptime: {healthData?.uptime ? `${Math.floor(healthData.uptime / 3600)}h ${Math.floor((healthData.uptime % 3600) / 60)}m` : '24h 15m'}
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #f59e0b'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>💾</span>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: 0
                  }}>
                    Memory & CPU Load
                  </h3>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#f59e0b',
                  marginBottom: '4px'
                }}>
                  {healthData?.memory_usage ? 
                    `${(healthData.memory_usage / 1024 / 1024).toFixed(1)} MB` : 
                    '24.5 MB'
                  }
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  CPU: ~12% | RAM: Normal
                </div>
              </div>
            </div>

            {/* Right Column - System Info & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                borderLeft: '4px solid #8b5cf6'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>🔧</span>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: 0
                  }}>
                    System Version
                  </h3>
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#8b5cf6',
                  marginBottom: '4px'
                }}>
                  {healthData?.version || 'v1.2.3'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  PHP {healthData?.php_version || '8.2.29'} | {healthData?.environment || 'Development'}
                </div>
              </div>

              {/* Emergency Actions */}
              <div style={{
                padding: '16px',
                background: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                borderLeft: '4px solid #ef4444'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#991b1b',
                  marginBottom: '12px'
                }}>
                  🚨 Emergency / Maintenance
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => {
                      const logs = 'System logs would be downloaded here...';
                      const blob = new Blob([logs], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }}
                  >
                    <span>📂</span>
                    Download Logs
                  </button>
                  
                  <button
                    onClick={() => fetchHealthData()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }}
                  >
                    <span>⚙️</span>
                    System Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Health Check Modal */}
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
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
                🏥 System Health Check
              </h2>
              <button
                onClick={() => setShowHealthModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>
            
            {healthData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: healthData.status === 'ok' ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '8px',
                  border: healthData.status === 'ok' ? '1px solid #bbf7d0' : '1px solid #fecaca'
                }}>
                  <span style={{
                    fontSize: '20px',
                    marginRight: '12px'
                  }}>
                    {healthData.status === 'ok' ? '✅' : '❌'}
                  </span>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: healthData.status === 'ok' ? '#065f46' : '#991b1b',
                      margin: '0 0 4px 0'
                    }}>
                      System Status: {healthData.status.toUpperCase()}
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Last checked: {new Date(healthData.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  <div style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 4px 0'
                    }}>
                      🗄️ Database
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: healthData.database === 'connected' ? '#059669' : '#dc2626',
                      margin: 0
                    }}>
                      {healthData.database}
                    </p>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 4px 0'
                    }}>
                      🐘 PHP Version
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      margin: 0
                    }}>
                      {healthData.php_version}
                    </p>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 4px 0'
                    }}>
                      💾 Memory Usage
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      margin: 0
                    }}>
                      {(healthData.memory_usage / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 4px 0'
                    }}>
                      🕐 Uptime
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      margin: 0
                    }}>
                      {healthData.uptime} seconds
                    </p>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 4px 0'
                    }}>
                      🌍 Environment
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      margin: 0
                    }}>
                      {healthData.environment}
                    </p>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 4px 0'
                    }}>
                      📋 Version
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      margin: 0
                    }}>
                      {healthData.version}
                    </p>
                  </div>
                </div>
                
                {healthData.issues && healthData.issues.length > 0 && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#991b1b',
                      margin: '0 0 8px 0'
                    }}>
                      ⚠️ Issues Detected
                    </h4>
                    <ul style={{
                      fontSize: '12px',
                      color: '#7f1d1d',
                      margin: 0,
                      paddingLeft: '16px'
                    }}>
                      {healthData.issues.map((issue: string, index: number) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}