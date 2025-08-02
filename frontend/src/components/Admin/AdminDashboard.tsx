import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'
import { BarChart3, FileText, PlayCircle, Users, GraduationCap, Clock, Plus, UserPlus, BookOpen, Activity } from 'lucide-react'

interface DashboardStats {
  total_questions: number
  total_test_codes: number
  active_test_codes: number
  total_teachers: number
  total_students: number
  recent_tests: number
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
    recent_tests: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)

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

  // Memoized dashboard cards for performance
  const dashboardCards = useMemo(() => [
    {
      title: 'Total Questions',
      value: stats.total_questions,
      color: '#6366f1',
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
      title: 'Recent Tests',
      value: stats.recent_tests,
      color: '#06b6d4',
      icon: Clock,
      description: 'Tests taken today',
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
      color: '#6366f1'
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
      onClick: () => window.open('/api/debug/health', '_blank'),
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
            borderTop: '2px solid #6366f1',
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

      <div style={{
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: 'white',
          margin: 0,
          marginBottom: '8px'
        }}>
          Admin Dashboard
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.8)',
          margin: 0
        }}>
          Welcome back, {user?.full_name || 'Administrator'}
        </p>
      </div>

      {retrying && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          color: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Retrying connection...
        </div>
      )}

      {/* Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {dashboardCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <div
              key={index}
              onClick={card.onClick}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)'
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
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <IconComponent size={24} />
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: card.color
                }}>
                  {card.value}
                </div>
              </div>
              <h3 style={{
                fontSize: '18px',
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* Recent Test Codes */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>
              Recent Test Codes
            </h2>
            <button
              onClick={() => navigate('/admin/testcodes')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
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
                    borderRadius: '12px',
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
                        color: '#6366f1',
                        background: '#f0f9ff',
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
                      transition: 'all 0.3s ease'
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
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 24px 0'
          }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
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
                    gap: '16px',
                    padding: '16px',
                    background: `linear-gradient(135deg, ${action.color}15 0%, ${action.color}25 100%)`,
                    border: `1px solid ${action.color}30`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 5px 15px ${action.color}20`
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
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 4px 0'
                    }}>
                      {action.title}
                    </h4>
                    <p style={{
                      fontSize: '14px',
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
  )
}