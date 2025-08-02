import { useState, useEffect } from 'react'
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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...')
      const [statsResponse, activitiesResponse] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/test-codes?limit=8')
      ])
      
      console.log('Stats response:', statsResponse.data)
      console.log('Activities response:', activitiesResponse.data)
      
      setStats(statsResponse.data.data || statsResponse.data || {})
      setRecentActivities(activitiesResponse.data.data || activitiesResponse.data || [])
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      console.error('Error response:', error.response?.data)
      setError('Failed to load dashboard data. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  const quickToggleActivation = async (testCodeId: number, isActivated: boolean) => {
    try {
      await api.patch(`/admin/test-codes/${testCodeId}/toggle-activation`, {
        is_activated: !isActivated
      })
      
      // Update local state
      setRecentActivities(prev => prev.map(activity => 
        activity.id === testCodeId 
          ? { ...activity, is_activated: !isActivated }
          : activity
      ))
    } catch (error: any) {
      console.error('Failed to toggle activation:', error)
      setError('Failed to toggle test code activation. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const StatCard = ({ title, value, subtitle, color, icon }: {
    title: string
    value: number
    subtitle: string
    color: string
    icon: string
  }) => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      const target = e.currentTarget as HTMLDivElement
      target.style.transform = 'translateY(-4px)'
      target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
    }}
    onMouseLeave={(e) => {
      const target = e.currentTarget as HTMLDivElement
      target.style.transform = 'translateY(0)'
      target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        fontSize: '60px',
        opacity: 0.1,
        color: color
      }}>
        {icon}
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <div>
          <p style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#64748b',
            margin: '0 0 4px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </p>
          <h3 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#1e293b',
            margin: '0',
            lineHeight: '1'
          }}>
            {value.toLocaleString()}
          </h3>
        </div>
        <div style={{
          background: `${color}20`,
          borderRadius: '12px',
          padding: '8px',
          fontSize: '20px',
          color: color
        }}>
          {icon}
        </div>
      </div>
      
      <p style={{
        fontSize: '13px',
        color: '#64748b',
        margin: '0'
      }}>
        {subtitle}
      </p>
    </div>
  )

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
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '800',
          color: '#1e293b',
          margin: '0 0 8px 0',
          letterSpacing: '-0.025em'
        }}>
          Admin Dashboard
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          margin: '0'
        }}>
          Welcome back, {user?.full_name}! Here's your system overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <StatCard
          title="Total Questions"
          value={stats.total_questions}
          subtitle="Questions in the bank"
          color="#6366f1"
          icon="📝"
        />
        <StatCard
          title="Test Codes"
          value={stats.total_test_codes}
          subtitle={`${stats.active_test_codes} currently active`}
          color="#059669"
          icon="🔑"
        />
        <StatCard
          title="Teachers"
          value={stats.total_teachers}
          subtitle="Active educators"
          color="#dc2626"
          icon="👨‍🏫"
        />
        <StatCard
          title="Students"
          value={stats.total_students}
          subtitle="Enrolled students"
          color="#7c3aed"
          icon="👨‍🎓"
        />
        <StatCard
          title="Recent Tests"
          value={stats.recent_tests}
          subtitle="Completed this week"
          color="#ea580c"
          icon="📊"
        />
        <StatCard
          title="System Health"
          value={100}
          subtitle="All systems operational"
          color="#16a34a"
          icon="✅"
        />
      </div>

      {/* Recent Test Codes Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        '@media (max-width: 1024px)': {
          gridTemplateColumns: '1fr'
        }
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
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0'
            }}>
              Recent Test Codes
            </h2>
            <button
              onClick={() => navigate('/admin/test-codes')}
              style={{
                fontSize: '14px',
                color: '#6366f1',
                background: 'transparent',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLDivElement
                    target.style.background = '#f1f5f9'
                    target.style.borderColor = '#cbd5e1'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLDivElement
                    target.style.background = '#f8fafc'
                    target.style.borderColor = '#e2e8f0'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: '0 0 4px 0'
                      }}>
                        {activity.code} - {activity.title}
                      </h4>
                      <p style={{
                        fontSize: '13px',
                        color: '#64748b',
                        margin: '0'
                      }}>
                        {activity.subject_name} • {activity.class_level} • By {activity.created_by_name}
                      </p>
                    </div>
                    <button
                      onClick={() => quickToggleActivation(activity.id, activity.is_activated)}
                      style={{
                        background: activity.is_activated ? '#dc2626' : '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '4px 12px',
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
                      {activity.is_activated ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    <span>Used {activity.usage_count} times</span>
                    <span>{formatDate(activity.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔑</div>
                <p style={{ fontSize: '14px', margin: '0' }}>
                  No test codes created yet
                </p>
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
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          height: 'fit-content'
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
            <button
              onClick={() => navigate('/admin/test-codes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(-2px)'
                target.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(0)'
                target.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '18px' }}>🔑</span>
              Create Test Code
            </button>

            <button
              onClick={() => navigate('/admin/questions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(-2px)'
                target.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(0)'
                target.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '18px' }}>📝</span>
              Manage Questions
            </button>

            <button
              onClick={() => navigate('/admin/teachers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(-2px)'
                target.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.4)'
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement
                target.style.transform = 'translateY(0)'
                target.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '18px' }}>👨‍🏫</span>
              Teacher Assignments
            </button>

            <div style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginTop: '8px'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 8px 0'
              }}>
                System Status
              </h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#059669'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#059669'
                }}></div>
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <ErrorNotification
          message={error}
          onClose={() => setError('')}
          type="error"
        />
      )}
    </div>
  )
}