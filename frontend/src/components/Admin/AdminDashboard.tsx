import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'

interface DashboardStats {
  total_questions: number
  total_test_codes: number
  active_test_codes: number
  total_teachers: number
  total_students: number
  recent_tests: number
}

interface RecentTestCode {
  id: number
  code: string
  title: string
  subject: string
  class_level: string
  is_active: boolean
  is_activated: boolean
  created_at: string
  usage_count: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    total_questions: 0,
    total_test_codes: 0,
    active_test_codes: 0,
    total_teachers: 0,
    total_students: 0,
    recent_tests: 0
  })
  const [recentTestCodes, setRecentTestCodes] = useState<RecentTestCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, testCodesResponse] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/test-codes?limit=5')
      ])
      
      setStats(statsResponse.data.data || {})
      setRecentTestCodes(testCodesResponse.data.data || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTestCodeActivation = async (testCodeId: number, isActivated: boolean) => {
    try {
      await api.patch(`/admin/test-codes/${testCodeId}/toggle-activation`, {
        is_activated: !isActivated
      })
      
      // Refresh the test codes list
      const response = await api.get('/admin/test-codes?limit=5')
      setRecentTestCodes(response.data.data || [])
    } catch (error) {
      console.error('Failed to toggle test code activation:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        color: '#64748b'
      }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '100%',
      margin: '0 auto',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        padding: '20px 16px',
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          margin: '0 0 4px 0'
        }}>
          Admin Dashboard
        </h1>
        <p style={{ 
          fontSize: '14px', 
          opacity: 0.9,
          margin: '0'
        }}>
          Welcome back, {user?.full_name}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '16px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1e40af',
            marginBottom: '4px'
          }}>
            {stats.total_questions}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Questions
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '16px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#059669',
            marginBottom: '4px'
          }}>
            {stats.active_test_codes}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Active Tests
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '16px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#7c3aed',
            marginBottom: '4px'
          }}>
            {stats.total_teachers}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Teachers
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '16px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#dc2626',
            marginBottom: '4px'
          }}>
            {stats.total_students}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Students
          </div>
        </div>
      </div>

      {/* Recent Test Codes with Activation Control */}
      <div style={{
        background: 'white',
        padding: '20px 16px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e293b',
          margin: '0 0 12px 0'
        }}>
          Recent Test Codes
        </h2>
        
        {recentTestCodes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentTestCodes.map((testCode) => (
              <div
                key={testCode.id}
                style={{
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#f8fafc'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {testCode.code} - {testCode.title}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      background: testCode.is_activated ? '#dcfce7' : '#fef3c7',
                      color: testCode.is_activated ? '#166534' : '#92400e',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '500'
                    }}>
                      {testCode.is_activated ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      onClick={() => toggleTestCodeActivation(testCode.id, testCode.is_activated)}
                      style={{
                        background: testCode.is_activated ? '#dc2626' : '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {testCode.is_activated ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '4px'
                }}>
                  {testCode.subject} • {testCode.class_level} • Used {testCode.usage_count} times
                </div>
                
                <div style={{
                  fontSize: '11px',
                  color: '#64748b'
                }}>
                  Created: {new Date(testCode.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            color: '#64748b',
            fontSize: '14px',
            padding: '20px'
          }}>
            No test codes found
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px'
      }}>
        <button
          onClick={() => window.location.href = '/admin/test-codes'}
          style={{
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            color: 'white',
            border: 'none',
            padding: '16px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          📝 Manage Test Codes
        </button>

        <button
          onClick={() => window.location.href = '/admin/questions'}
          style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: 'white',
            border: 'none',
            padding: '16px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          📚 All Questions
        </button>

        <button
          onClick={() => window.location.href = '/admin/teachers'}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: 'white',
            border: 'none',
            padding: '16px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          👥 Teacher Assignments
        </button>
      </div>
    </div>
  )
}