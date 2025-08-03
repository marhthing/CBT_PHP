import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import { BookOpen, FileText, Users, Calendar, BarChart3, PlusCircle, Upload, GraduationCap } from 'lucide-react'

interface Question {
  id: number
  question_text: string
  question_type: string
  subject_id: number
  class_level: string
  created_at: string
}

interface TeacherStats {
  total_questions: number
  subjects_count: number
  this_week: number
  recent_questions: Question[]
}

interface Assignment {
  id: number
  subject_name: string
  class_level: string
  term_name: string
  session_name: string
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<TeacherStats>({
    total_questions: 0,
    subjects_count: 0,
    this_week: 0,
    recent_questions: []
  })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeacherData()
  }, [])

  const fetchTeacherData = async () => {
    try {
      const [statsResponse, assignmentsResponse] = await Promise.all([
        api.get('/teacher/questions?stats=true'),
        api.get('/teacher/assignments')
      ])
      
      const statsData = statsResponse.data.data || {}
      setStats({
        total_questions: statsData.total_questions || 0,
        subjects_count: statsData.subjects_count || 0,
        this_week: statsData.this_week || 0,
        recent_questions: statsData.recent_questions || []
      })
      
      setAssignments(assignmentsResponse.data.data || [])
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
            {stats.subjects_count}
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
            {assignments.length}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Assignments
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
            {stats.this_week}
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
        
        {stats.recent_questions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recent_questions.slice(0, 5).map((question) => (
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
                    Class {question.class_level}
                  </span>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px'
        }}>
          <button
            onClick={() => navigate('/teacher/questions')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px 8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              color: '#1e293b',
              fontSize: '12px',
              fontWeight: '500',
              gap: '6px'
            }}
          >
            <BookOpen size={20} color="#3b82f6" />
            View Questions
          </button>
          
          <button
            onClick={() => navigate('/teacher/questions?action=upload')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px 8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              color: '#1e293b',
              fontSize: '12px',
              fontWeight: '500',
              gap: '6px'
            }}
          >
            <Upload size={20} color="#059669" />
            Upload Questions
          </button>
          
          <button
            onClick={() => navigate('/teacher/questions?action=create')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '12px 8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              color: '#1e293b',
              fontSize: '12px',
              fontWeight: '500',
              gap: '6px'
            }}
          >
            <PlusCircle size={20} color="#dc2626" />
            Create Question
          </button>
        </div>
      </div>

      {/* Teacher Assignments */}
      {assignments.length > 0 && (
        <div style={{
          background: 'white',
          padding: '20px 16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 12px 0'
          }}>
            Your Assignments
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {assignments.slice(0, 3).map((assignment) => (
              <div
                key={assignment.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#1e293b',
                    marginBottom: '2px'
                  }}>
                    {assignment.subject_name}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#64748b'
                  }}>
                    {assignment.class_level} • {assignment.term_name} • {assignment.session_name}
                  </div>
                </div>
                <GraduationCap size={16} color="#7c3aed" />
              </div>
            ))}
          </div>
          
          {assignments.length > 3 && (
            <div style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '11px',
              color: '#64748b'
            }}>
              +{assignments.length - 3} more assignments
            </div>
          )}
        </div>
      )}
    </div>
  )
}