import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'

interface Question {
  id: number
  question_text: string
  question_type: string
  difficulty_level: string
  subject_name: string
  class_level: string
  created_by_name: string
  created_at: string
  options?: Array<{
    id: number
    option_text: string
    is_correct: boolean
  }>
}

interface QuestionStats {
  total_questions: number
  by_subject: Record<string, number>
  by_class: Record<string, number>
  by_difficulty: Record<string, number>
  by_type: Record<string, number>
}

interface LookupData {
  subjects?: Array<{id: number, name: string}>
  terms?: Array<{id: number, name: string}>
  sessions?: Array<{id: number, name: string}>
}

export default function AllQuestions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<QuestionStats | null>(null)
  const [lookupData, setLookupData] = useState<LookupData>({})
  const [loading, setLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuestions, setNewQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    subject_id: '',
    class_level: '',
    term_id: '',
    session_id: ''
  })
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetchQuestions()
    fetchQuestionStats()
    fetchLookupData()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchQuestions()
    }, 300) // Debounce API calls to prevent rapid requests
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, subjectFilter, classFilter, typeFilter])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (subjectFilter) params.append('subject', subjectFilter)
      if (classFilter) params.append('class', classFilter)
      if (typeFilter) params.append('type', typeFilter)
      params.append('limit', '50')
      
      const response = await api.get(`/admin/questions?${params}`)
      setQuestions(response.data.data?.questions || [])
      setError('')
    } catch (error: any) {
      console.error('Failed to fetch questions:', error)
      setError('Failed to load questions. Please try refreshing the page.')
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestionStats = async () => {
    try {
      const response = await api.get('/admin/questions?stats=true')
      setStats(response.data.data || null)
    } catch (error) {
      console.error('Failed to fetch question stats:', error)
    }
  }

  const fetchLookupData = async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || {})
    } catch (error) {
      console.error('Failed to fetch lookup data:', error)
    }
  }

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    try {
      await api.delete(`/admin/questions/${questionId}`)
      await fetchQuestions()
      await fetchQuestionStats()
      setSelectedQuestion(null)
      alert('Question deleted successfully!')
    } catch (error: any) {
      console.error('Failed to delete question:', error)
      alert('Failed to delete question: ' + (error.response?.data?.message || error.message))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'multiple_choice': return '#6366f1'
      case 'true_false': return '#8b5cf6'
      case 'short_answer': return '#06b6d4'
      default: return '#64748b'
    }
  }

  const classLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']
  const questionTypes = ['Multiple Choice', 'True/False', 'Short Answer']

  const filteredQuestions = questions.filter(question => {
    if (searchTerm && !question.question_text.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0',
            marginBottom: '4px'
          }}>
            Question Bank Management
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0'
          }}>
            View and manage all questions in the system
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '16px',
            width: '100%'
          }}>
            {error}
          </div>
        )}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(99, 102, 241, 0.25)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.transform = 'translateY(-1px)'
            target.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)'
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.transform = 'translateY(0)'
            target.style.boxShadow = '0 4px 6px rgba(99, 102, 241, 0.25)'
          }}
        >
          <span style={{ fontSize: '16px' }}>{showAddForm ? '−' : '+'}</span>
          {showAddForm ? 'Hide Form' : 'Add Questions'}
        </button>
      </div>

      {/* Add Question Form */}
      {showAddForm && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 24px 0'
          }}>
            Add New Questions
          </h2>

          {/* Current Question Form */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <select
                value={currentQuestion.subject_id}
                onChange={(e) => setCurrentQuestion({...currentQuestion, subject_id: e.target.value})}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Select Subject</option>
                {lookupData.subjects?.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>

              <select
                value={currentQuestion.class_level}
                onChange={(e) => setCurrentQuestion({...currentQuestion, class_level: e.target.value})}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Select Class</option>
                {['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>

              <select
                value={currentQuestion.term_id}
                onChange={(e) => setCurrentQuestion({...currentQuestion, term_id: e.target.value})}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Select Term</option>
                {lookupData.terms?.map(term => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </select>

              <select
                value={currentQuestion.session_id}
                onChange={(e) => setCurrentQuestion({...currentQuestion, session_id: e.target.value})}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">Select Session</option>
                {lookupData.sessions?.map(session => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))}
              </select>
            </div>

            <textarea
              placeholder="Enter question text..."
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion({...currentQuestion, question_text: e.target.value})}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                minHeight: '80px',
                marginBottom: '16px',
                resize: 'vertical'
              }}
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <input
                type="text"
                placeholder="Option A"
                value={currentQuestion.option_a}
                onChange={(e) => setCurrentQuestion({...currentQuestion, option_a: e.target.value})}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="Option B"
                value={currentQuestion.option_b}
                onChange={(e) => setCurrentQuestion({...currentQuestion, option_b: e.target.value})}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="Option C"
                value={currentQuestion.option_c}
                onChange={(e) => setCurrentQuestion({...currentQuestion, option_c: e.target.value})}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                placeholder="Option D"
                value={currentQuestion.option_d}
                onChange={(e) => setCurrentQuestion({...currentQuestion, option_d: e.target.value})}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Correct Answer:
              </label>
              <select
                value={currentQuestion.correct_answer}
                onChange={(e) => setCurrentQuestion({...currentQuestion, correct_answer: e.target.value})}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  if (currentQuestion.question_text && currentQuestion.option_a && currentQuestion.option_b && 
                      currentQuestion.option_c && currentQuestion.option_d && currentQuestion.subject_id && 
                      currentQuestion.class_level && currentQuestion.term_id && currentQuestion.session_id) {
                    setNewQuestions([...newQuestions, {...currentQuestion}])
                    setCurrentQuestion({
                      question_text: '',
                      option_a: '',
                      option_b: '',
                      option_c: '',
                      option_d: '',
                      correct_answer: 'A',
                      subject_id: currentQuestion.subject_id, // Keep same subject
                      class_level: currentQuestion.class_level, // Keep same class
                      term_id: currentQuestion.term_id, // Keep same term
                      session_id: currentQuestion.session_id // Keep same session
                    })
                    setSuccessMessage('Question added! Add more or click Upload Questions.')
                  } else {
                    setError('Please fill in all fields')
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #059669, #065f46)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add Question ({newQuestions.length})
              </button>

              <button
                onClick={async () => {
                  if (newQuestions.length === 0) {
                    setError('Please add at least one question')
                    return
                  }
                  
                  try {
                    setLoading(true)
                    for (const question of newQuestions) {
                      await api.post('/admin/questions', question)
                    }
                    setSuccessMessage(`Successfully uploaded ${newQuestions.length} questions!`)
                    setNewQuestions([])
                    setCurrentQuestion({
                      question_text: '',
                      option_a: '',
                      option_b: '',
                      option_c: '',
                      option_d: '',
                      correct_answer: 'A',
                      subject_id: '',
                      class_level: '',
                      term_id: '',
                      session_id: ''
                    })
                    setShowAddForm(false)
                    fetchQuestions()
                    fetchQuestionStats()
                  } catch (error) {
                    setError('Failed to upload questions. Please try again.')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={newQuestions.length === 0}
                style={{
                  background: newQuestions.length > 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newQuestions.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Upload Questions ({newQuestions.length})
              </button>

              {newQuestions.length > 0 && (
                <button
                  onClick={() => {
                    setNewQuestions([])
                    setSuccessMessage('All questions cleared')
                  }}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Questions Queue */}
          {newQuestions.length > 0 && (
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 16px 0'
              }}>
                Questions Ready for Upload ({newQuestions.length})
              </h3>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                {newQuestions.map((q, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    borderBottom: index < newQuestions.length - 1 ? '1px solid #e2e8f0' : 'none',
                    background: index % 2 === 0 ? '#f9fafb' : 'white'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                        Q{index + 1}: {q.question_text.substring(0, 80)}...
                      </strong>
                      <button
                        onClick={() => {
                          const updated = newQuestions.filter((_, i) => i !== index)
                          setNewQuestions(updated)
                        }}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Subject: {lookupData.subjects?.find(s => s.id == q.subject_id)?.name} | 
                      Class: {q.class_level} | 
                      Answer: {q.correct_answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {successMessage && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginTop: '16px'
            }}>
              {successMessage}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 4px 0'
            }}>
              {stats.total_questions}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '0'
            }}>
              Total Questions
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 4px 0'
            }}>
              {Object.keys(stats.by_subject || {}).length}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '0'
            }}>
              Subjects Covered
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 4px 0'
            }}>
              {Object.keys(stats.by_class || {}).length}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '0'
            }}>
              Class Levels
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 4px 0'
            }}>
              {Object.keys(stats.by_type || {}).length}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '0'
            }}>
              Question Types
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          margin: '0 0 16px 0'
        }}>
          Filter Questions
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">All Subjects</option>
            {lookupData.subjects?.map((subject) => (
              <option key={subject.id} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">All Classes</option>
            {classLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">All Types</option>
            {questionTypes.map(type => (
              <option key={type} value={type.toLowerCase().replace(' ', '_')}>
                {type}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('')
              setSubjectFilter('')
              setClassFilter('')
              setTypeFilter('')
            }}
            style={{
              background: '#f1f5f9',
              border: '2px solid #e2e8f0',
              color: '#64748b',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.background = '#e2e8f0'
              target.style.borderColor = '#cbd5e1'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.background = '#f1f5f9'
              target.style.borderColor = '#e2e8f0'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0'
          }}>
            Questions ({filteredQuestions.length})
          </h3>
        </div>

        <div style={{ padding: '0' }}>
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question, index) => (
              <div
                key={question.id}
                style={{
                  padding: '20px 24px',
                  borderBottom: index < filteredQuestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedQuestion(question)}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLDivElement
                  target.style.backgroundColor = '#f8fafc'
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLDivElement
                  target.style.backgroundColor = 'white'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 8px 0',
                      lineHeight: '1.5'
                    }}>
                      {question.question_text}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        background: '#f1f5f9',
                        color: '#64748b',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {question.subject_name}
                      </span>
                      <span style={{
                        background: '#f1f5f9',
                        color: '#64748b',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {question.class_level}
                      </span>

                      <span style={{
                        background: getTypeColor(question.question_type) + '20',
                        color: getTypeColor(question.question_type),
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {question.question_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      By {question.created_by_name}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#64748b'
                    }}>
                      {formatDate(question.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: '0 0 8px 0'
              }}>
                No Questions Found
              </h3>
              <p style={{
                fontSize: '14px',
                margin: '0'
              }}>
                {questions.length === 0 ? 
                  "No questions have been created yet." :
                  "No questions match your current filters."
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Question Detail Modal */}
      {selectedQuestion && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0'
              }}>
                Question Details
              </h2>
              <button
                onClick={() => setSelectedQuestion(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{
                fontSize: '16px',
                color: '#1e293b',
                lineHeight: '1.6',
                margin: '0 0 16px 0'
              }}>
                {selectedQuestion.question_text}
              </p>
              
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '16px'
              }}>
                <span style={{
                  background: '#f1f5f9',
                  color: '#64748b',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {selectedQuestion.subject_name} • {selectedQuestion.class_level}
                </span>

                <span style={{
                  background: getTypeColor(selectedQuestion.question_type) + '20',
                  color: getTypeColor(selectedQuestion.question_type),
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {selectedQuestion.question_type.replace('_', ' ')}
                </span>
              </div>

              {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                <div>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '0 0 12px 0'
                  }}>
                    Answer Options:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedQuestion.options.map((option, index) => (
                      <div
                        key={option.id}
                        style={{
                          padding: '12px',
                          background: option.is_correct ? '#dcfce7' : '#f8fafc',
                          border: `1px solid ${option.is_correct ? '#bbf7d0' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{
                          background: option.is_correct ? '#059669' : '#64748b',
                          color: 'white',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span style={{
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>
                          {option.option_text}
                        </span>
                        {option.is_correct && (
                          <span style={{
                            background: '#059669',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            marginLeft: 'auto'
                          }}>
                            CORRECT
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '13px',
                  color: '#64748b'
                }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Created by:</span><br />
                    {selectedQuestion.created_by_name}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Created on:</span><br />
                    {formatDate(selectedQuestion.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setSelectedQuestion(null)}
                style={{
                  background: '#f1f5f9',
                  border: '2px solid #e2e8f0',
                  color: '#64748b',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => deleteQuestion(selectedQuestion.id)}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Delete Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}