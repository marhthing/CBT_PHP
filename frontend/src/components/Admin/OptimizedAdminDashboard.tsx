import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'

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

export default function OptimizedAdminDashboard() {
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

  // Memoized fetch function for performance
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsResponse, activitiesResponse] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/test-codes?limit=8')
      ])
      
      setStats(statsResponse.data.data || statsResponse.data || {})
      setRecentActivities(activitiesResponse.data.data || activitiesResponse.data || [])
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
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
      icon: '❓',
      description: 'Questions in database',
      onClick: () => navigate('/admin/questions')
    },
    {
      title: 'Test Codes',
      value: stats.total_test_codes,
      color: '#8b5cf6',
      icon: '📝',
      description: 'Available test codes',
      onClick: () => navigate('/admin/testcodes')
    },
    {
      title: 'Active Tests',
      value: stats.active_test_codes,
      color: '#10b981',
      icon: '✅',
      description: 'Currently active',
      onClick: () => navigate('/admin/testcodes')
    },
    {
      title: 'Teachers',
      value: stats.total_teachers,
      color: '#f59e0b',
      icon: '👨‍🏫',
      description: 'Registered teachers',
      onClick: () => navigate('/admin/teachers')
    },
    {
      title: 'Students',
      value: stats.total_students,
      color: '#06b6d4',
      icon: '👨‍🎓',
      description: 'Registered students',
      onClick: () => navigate('/admin')
    },
    {
      title: 'Recent Tests',
      value: stats.recent_tests,
      color: '#ef4444',
      icon: '📊',
      description: 'Tests taken today',
      onClick: () => navigate('/admin')
    }
  ], [stats, navigate])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Error Message */}
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}

      {/* Welcome Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 8px 0'
        }}>
          Welcome back, {user?.username}! 👋
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          margin: 0
        }}>
          Here's what's happening with your CBT system today.
        </p>
      </div>

      {/* Dashboard Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {dashboardCards.map((card, index) => (
          <div
            key={card.title}
            onClick={card.onClick}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLDivElement
              target.style.transform = 'translateY(-4px)'
              target.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLDivElement
              target.style.transform = 'translateY(0)'
              target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Background gradient overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '120px',
              height: '120px',
              background: `linear-gradient(135deg, ${card.color}15, ${card.color}05)`,
              borderRadius: '50%',
              transform: 'translate(30px, -30px)'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '24px',
                  padding: '8px',
                  background: `${card.color}10`,
                  borderRadius: '12px'
                }}>
                  {card.icon}
                </div>
                
                <div style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: card.color,
                  textAlign: 'right'
                }}>
                  {card.value.toLocaleString()}
                </div>
              </div>
              
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '4px'
                }}>
                  {card.title}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  {card.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Recent Test Codes */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0
            }}>
              Recent Test Codes
            </h2>
            <button
              onClick={() => navigate('/admin/testcodes')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      {activity.title}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6366f1',
                      background: '#f0f4ff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    }}>
                      {activity.code}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    {activity.subject_name} • {activity.class_level} • Used {activity.usage_count} times
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    color: '#64748b'
                  }}>
                    {formatDate(activity.created_at)}
                  </span>
                  
                  <button
                    onClick={() => quickToggleActivation(activity.id, activity.is_activated)}
                    style={{
                      background: activity.is_activated ? '#dcfce7' : '#fef3c7',
                      color: activity.is_activated ? '#059669' : '#d97706',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement
                      target.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement
                      target.style.transform = 'scale(1)'
                    }}
                  >
                    {activity.is_activated ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                padding: '32px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                <div>No test codes created yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 20px 0'
          }}>
            Quick Actions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              {
                title: 'Create Test Code',
                description: 'Generate a new test',
                icon: '➕',
                color: '#6366f1',
                onClick: () => navigate('/admin/testcodes')
              },
              {
                title: 'Assign Teachers',
                description: 'Manage assignments',
                icon: '👥',
                color: '#8b5cf6',
                onClick: () => navigate('/admin/teachers')
              },
              {
                title: 'View Questions',
                description: 'Browse question bank',
                icon: '📚',
                color: '#10b981',
                onClick: () => navigate('/admin/questions')
              },
              {
                title: 'System Health',
                description: 'Monitor system status',
                icon: '⚡',
                color: '#f59e0b',
                onClick: () => navigate('/admin')
              }
            ].map((action) => (
              <button
                key={action.title}
                onClick={action.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'transparent',
                  border: '2px solid #f1f5f9',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLButtonElement
                  target.style.borderColor = action.color
                  target.style.background = `${action.color}05`
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLButtonElement
                  target.style.borderColor = '#f1f5f9'
                  target.style.background = 'transparent'
                }}
              >
                <div style={{
                  fontSize: '20px',
                  padding: '8px',
                  background: `${action.color}10`,
                  borderRadius: '8px'
                }}>
                  {action.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '2px'
                  }}>
                    {action.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 20px 0'
        }}>
          System Status
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {[
            { label: 'Database', status: 'Healthy', color: '#10b981' },
            { label: 'API Server', status: 'Running', color: '#10b981' },
            { label: 'Authentication', status: 'Active', color: '#10b981' },
            { label: 'File Storage', status: 'Available', color: '#10b981' }
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #f1f5f9'
              }}
            >
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                {item.label}
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: item.color,
                background: `${item.color}15`,
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}