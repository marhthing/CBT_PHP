import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import { Search, Filter, BookOpen, Eye, Edit, Trash2, BarChart3, FileText, Users, GraduationCap, X, Save } from 'lucide-react'

interface Question {
  id: number
  question_text: string
  question_type: string
  difficulty_level: string
  subject_name: string
  class_level: string
  created_by_name: string
  created_at: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
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
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<QuestionStats | null>(null)
  const [lookupData, setLookupData] = useState<LookupData>({})
  const [loading, setLoading] = useState(true)

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Memoized fetch functions for performance
  const fetchQuestions = useCallback(async () => {
    try {
      setError('')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (subjectFilter) params.append('subject', subjectFilter)
      if (classFilter) params.append('class', classFilter)
      if (typeFilter) params.append('type', typeFilter)
      params.append('limit', '50')

      const response = await api.get(`/admin/questions?${params.toString()}`)
      setQuestions(response.data.data?.questions || [])
    } catch (error: any) {
      console.error('Failed to fetch questions:', error)
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, subjectFilter, classFilter, typeFilter])

  const fetchQuestionStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/questions?stats=true')
      setStats(response.data.data?.stats || null)
    } catch (error: any) {
      console.error('Failed to fetch question stats:', error)
    }
  }, [])

  const fetchLookupData = useCallback(async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || {})
    } catch (error) {
      console.error('Failed to fetch lookup data:', error)
    }
  }, [])

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetchQuestionStats(),
      fetchLookupData()
    ])
    fetchQuestions()
  }, [fetchQuestionStats, fetchLookupData, fetchQuestions])

  // Debounced effect for search and filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || subjectFilter || classFilter || typeFilter) {
        fetchQuestions()
      }
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm, subjectFilter, classFilter, typeFilter, fetchQuestions])

  const deleteQuestion = useCallback(async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    try {
      const response = await api.delete(`/admin/questions/${questionId}`)
      if (response.data.success) {
        await fetchQuestions()
        await fetchQuestionStats()
        setSuccessMessage('Question deleted successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to delete question:', error)
      setError('Failed to delete question: ' + (error.response?.data?.message || error.message))
    }
  }, [fetchQuestions, fetchQuestionStats])

  const updateQuestion = useCallback(async (updatedQuestion: Question) => {
    try {
      const response = await api.put(`/admin/questions/${updatedQuestion.id}`, {
        question_text: updatedQuestion.question_text,
        option_a: updatedQuestion.option_a,
        option_b: updatedQuestion.option_b,
        option_c: updatedQuestion.option_c,
        option_d: updatedQuestion.option_d,
        correct_answer: updatedQuestion.correct_answer
      })
      
      if (response.data.success) {
        await fetchQuestions()
        setEditingQuestion(null)
        setSuccessMessage('Question updated successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to update question:', error)
      setError('Failed to update question: ' + (error.response?.data?.message || error.message))
    }
  }, [fetchQuestions])

  // Memoized filtered questions for performance
  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      const matchesSearch = !searchTerm || 
        question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = !subjectFilter || question.subject_name === subjectFilter
      const matchesClass = !classFilter || question.class_level === classFilter
      const matchesType = !typeFilter || question.question_type === typeFilter
      
      return matchesSearch && matchesSubject && matchesClass && matchesType
    })
  }, [questions, searchTerm, subjectFilter, classFilter, typeFilter])

  // Memoized stats cards
  const statsCards = useMemo(() => [
    {
      title: 'Total Questions',
      value: stats?.total_questions || 0,
      icon: BookOpen,
      color: '#6366f1'
    },
    {
      title: 'Subjects',
      value: Object.keys(stats?.by_subject || {}).length,
      icon: BarChart3,
      color: '#8b5cf6'
    },
    {
      title: 'Class Levels',
      value: Object.keys(stats?.by_class || {}).length,
      icon: GraduationCap,
      color: '#10b981'
    },
    {
      title: 'Question Types',
      value: Object.keys(stats?.by_type || {}).length,
      icon: FileText,
      color: '#f59e0b'
    }
  ], [stats])

  if (loading) {
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
          Loading questions...
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
          Question Bank
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          margin: 0
        }}>
          Manage all questions in the system
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          color: '#16a34a'
        }}>
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {statsCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
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
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: card.color,
                  marginBottom: '4px'
                }}>
                  {card.value}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  {card.title}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <div style={{
              position: 'relative'
            }}>
              <Search 
                size={20} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}
              />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Subjects</option>
            {(lookupData.subjects || []).map(subject => (
              <option key={subject.id} value={subject.name}>{subject.name}</option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Classes</option>
            <option value="JSS1">JSS 1</option>
            <option value="JSS2">JSS 2</option>
            <option value="JSS3">JSS 3</option>
            <option value="SS1">SS 1</option>
            <option value="SS2">SS 2</option>
            <option value="SS3">SS 3</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Types</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '20px'
        }}>
          Questions ({filteredQuestions.length})
        </h2>

        {filteredQuestions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <BookOpen size={64} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              No questions found
            </h3>
            <p style={{ margin: 0 }}>
              {searchTerm || subjectFilter || classFilter || typeFilter
                ? 'Try adjusting your filters'
                : 'No questions have been created yet'
              }
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '16px'
          }}>
            {filteredQuestions.map((question, index) => (
              <div
                key={question.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#f9fafb',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6366f1',
                        background: '#f0f9ff',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        Q{index + 1}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        {question.subject_name} • {question.class_level}
                      </span>
                    </div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 8px 0',
                      lineHeight: '1.4'
                    }}>
                      {question.question_text}
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0'
                    }}>
                      Created by {question.created_by_name} • {new Date(question.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => setEditingQuestion(question)}
                      style={{
                        padding: '8px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      style={{
                        padding: '8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  {['A', 'B', 'C', 'D'].map(option => (
                    <div
                      key={option}
                      style={{
                        padding: '8px 12px',
                        background: question.correct_answer === option ? '#dcfce7' : '#ffffff',
                        border: question.correct_answer === option ? '1px solid #22c55e' : '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{
                        fontWeight: '600',
                        color: question.correct_answer === option ? '#16a34a' : '#6b7280'
                      }}>
                        {option}.
                      </span>
                      <span style={{
                        color: question.correct_answer === option ? '#16a34a' : '#1f2937'
                      }}>
                        {question[`option_${option.toLowerCase()}` as keyof Question] as string}
                      </span>
                      {question.correct_answer === option && (
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#16a34a',
                          marginLeft: 'auto'
                        }}>
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                Edit Question
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Question Text
                </label>
                <textarea
                  value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion(prev => prev ? {...prev, question_text: e.target.value} : null)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {['A', 'B', 'C', 'D'].map(option => (
                <div key={option}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Option {option}
                  </label>
                  <input
                    type="text"
                    value={editingQuestion[`option_${option.toLowerCase()}` as keyof Question] as string}
                    onChange={(e) => setEditingQuestion(prev => prev ? {
                      ...prev,
                      [`option_${option.toLowerCase()}`]: e.target.value
                    } : null)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              ))}

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Correct Answer
                </label>
                <select
                  value={editingQuestion.correct_answer}
                  onChange={(e) => setEditingQuestion(prev => prev ? {...prev, correct_answer: e.target.value} : null)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
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
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '8px'
              }}>
                <button
                  onClick={() => setEditingQuestion(null)}
                  style={{
                    padding: '12px 20px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => editingQuestion && updateQuestion(editingQuestion)}
                  style={{
                    padding: '12px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}