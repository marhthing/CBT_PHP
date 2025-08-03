import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'

interface Question {
  id: number
  question_text: string
  question_type: string
  subject: string
  class_level: string
  created_at: string
}

interface TeacherStats {
  total_questions: number
  questions_by_subject: { [key: string]: number }
  questions_by_class: { [key: string]: number }
  recent_uploads: number
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<TeacherStats>({
    total_questions: 0,
    questions_by_subject: {},
    questions_by_class: {},
    recent_uploads: 0
  })
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeacherData()
  }, [])

  const fetchTeacherData = async () => {
    try {
      const [questionsResponse] = await Promise.all([
        api.get('/teacher/questions?stats=true')
      ])
      
      const statsData = questionsResponse.data.data || {}
      setStats({
        total_questions: statsData.total_questions || 0,
        questions_by_subject: {},
        questions_by_class: {},
        recent_uploads: statsData.this_week || 0
      })
      
      const questions = statsData.recent_questions || []
      setRecentQuestions(questions)
    } catch (error) {
      console.error('Failed to fetch teacher data:', error)
    } finally {
      setLoading(false)
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
          Teacher Dashboard
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
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
            {Object.keys(stats.questions_by_subject).length}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Subjects
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
            {Object.keys(stats.questions_by_class).length}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Classes
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
            {stats.recent_uploads}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            This Week
          </div>
        </div>
      </div>

      {/* Recent Questions */}
      <div style={{
        background: 'white',
        padding: '20px 16px',
        borderRadius: '12px',
        marginBottom: '20px',
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
            Recent Questions
          </h2>
          <button
            onClick={() => navigate('/teacher/questions')}
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
        
        {recentQuestions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentQuestions.slice(0, 5).map((question) => (
              <div
                key={question.id}
                style={{
                  padding: '10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: '#f8fafc'
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#1e293b',
                  marginBottom: '4px',
                  lineHeight: '1.4'
                }}>
                  {question.question_text.substring(0, 80)}
                  {question.question_text.length > 80 ? '...' : ''}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: '#64748b'
                }}>
                  <span>
                    {question.subject} • {question.class_level}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{
                      background: question.question_type === 'multiple_choice' ? '#dbeafe' : '#fef3c7',
                      color: question.question_type === 'multiple_choice' ? '#1d4ed8' : '#92400e',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: '500'
                    }}>
                      {question.question_type === 'multiple_choice' ? 'MC' : 'T/F'}
                    </span>
                    <span style={{
                      background: question.difficulty_level === 'Easy' ? '#dcfce7' : 
                                 question.difficulty_level === 'Medium' ? '#fef3c7' : '#fef2f2',
                      color: question.difficulty_level === 'Easy' ? '#166534' : 
                             question.difficulty_level === 'Medium' ? '#92400e' : '#dc2626',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: '500'
                    }}>
                      {question.difficulty_level}
                    </span>
                  </div>
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
            No questions found. Start by uploading some questions!
          </div>
        )}
      </div>

      {/* Subject Distribution */}
      {Object.keys(stats.questions_by_subject).length > 0 && (
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
            Questions by Subject
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(stats.questions_by_subject).map(([subject, count]) => (
              <div
                key={subject}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <span style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#1e293b'
                }}>
                  {subject}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#3b82f6',
                  background: '#dbeafe',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate('/teacher/questions')}
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
          📚 Question Bank
        </button>
      </div>
    </div>
  )
}