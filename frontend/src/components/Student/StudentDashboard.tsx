import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'

interface TestCode {
  id: number
  code: string
  title: string
  subject: string
  class_level: string
  duration_minutes: number
  question_count: number
  is_active: boolean
  is_activated: boolean
}

interface TestResult {
  id: number
  score: number
  total_questions: number
  percentage: number
  test_title: string
  subject: string
  submitted_at: string
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [availableTests, setAvailableTests] = useState<TestCode[]>([])
  const [recentResults, setRecentResults] = useState<TestResult[]>([])

  useEffect(() => {
    fetchAvailableTests()
    fetchRecentResults()
  }, [])

  const fetchAvailableTests = async () => {
    try {
      const response = await api.get('/student/available-tests')
      setAvailableTests(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch available tests:', error)
    }
  }

  const fetchRecentResults = async () => {
    try {
      const response = await api.get('/student/results')
      setRecentResults(response.data.data?.slice(0, 5) || [])
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
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
          Welcome, {user?.full_name}
        </h1>
        <p style={{ 
          fontSize: '14px', 
          opacity: 0.9,
          margin: '0'
        }}>
          View your dashboard and take tests when ready
        </p>
      </div>

      {/* Quick Actions */}
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
          Quick Actions
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          <button
            onClick={() => navigate('/student/test')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
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
            <span style={{ fontSize: '20px' }}>📝</span>
            Take Test
          </button>
          
          <button
            onClick={() => navigate('/student/results')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
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
            <span style={{ fontSize: '20px' }}>📊</span>
            View Results
          </button>
        </div>
      </div>

      {/* Available Tests */}
      {availableTests.length > 0 && (
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
            Available Tests
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableTests.map((test) => (
              <div
                key={test.id}
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
                    {test.title}
                  </span>
                  <span style={{
                    background: test.is_activated ? '#dcfce7' : '#fef3c7',
                    color: test.is_activated ? '#166534' : '#92400e',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}>
                    {test.is_activated ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginBottom: '8px'
                }}>
                  {test.subject} • {test.class_level} • {test.duration_minutes} min • {test.question_count} questions
                </div>
                
                <button
                  onClick={() => navigate(`/student/test?code=${test.code}`)}
                  disabled={!test.is_activated}
                  style={{
                    background: test.is_activated ? '#1e40af' : '#94a3b8',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: test.is_activated ? 'pointer' : 'not-allowed'
                  }}
                >
                  Use Code: {test.code}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <div style={{
          background: 'white',
          padding: '20px 16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0'
            }}>
              Recent Results
            </h2>
            <button
              onClick={() => navigate('/student/results')}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentResults.map((result) => (
              <div
                key={result.id}
                style={{
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#1e293b',
                    marginBottom: '2px'
                  }}>
                    {result.test_title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#64748b'
                  }}>
                    {result.subject} • {new Date(result.submitted_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div style={{
                  background: result.percentage >= 50 ? '#dcfce7' : '#fef2f2',
                  color: result.percentage >= 50 ? '#166534' : '#dc2626',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {result.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}