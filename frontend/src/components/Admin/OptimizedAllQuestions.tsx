import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'

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

export default function OptimizedAllQuestions() {
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
      setError('')
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
      if (searchTerm && !question.question_text.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (subjectFilter && question.subject_name !== subjectFilter) return false
      if (classFilter && question.class_level !== classFilter) return false
      if (typeFilter && question.question_type !== typeFilter) return false
      return true
    })
  }, [questions, searchTerm, subjectFilter, classFilter, typeFilter])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setSubjectFilter('')
    setClassFilter('')
    setTypeFilter('')
  }, [])

  // Memoized stats cards data
  const statsCards = useMemo(() => [
    { label: 'Total Questions', value: stats?.total_questions || 0, color: '#6366f1' },
    { label: 'Multiple Choice', value: stats?.by_type?.['multiple_choice'] || 0, color: '#8b5cf6' },
    { label: 'True/False', value: stats?.by_type?.['true_false'] || 0, color: '#06b6d4' },
    { label: 'Short Answer', value: stats?.by_type?.['short_answer'] || 0, color: '#10b981' }
  ], [stats])

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
      {/* Success Message */}
      {successMessage && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

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
            margin: '0 0 8px 0'
          }}>
            Question Bank
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0
          }}>
            Manage and review all questions in the system
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLDivElement
              target.style.transform = 'translateY(-2px)'
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLDivElement
              target.style.transform = 'translateY(0)'
              target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: stat.color,
              margin: '0 0 8px 0'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
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
          Search & Filter Questions
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
            {['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].map(level => (
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
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={clearFilters}
            style={{
              background: '#f1f5f9',
              border: '2px solid #e2e8f0',
              color: '#64748b',
              padding: '8px 16px',
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

      {/* Questions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '16px'
      }}>
        {filteredQuestions.map((question) => (
          <div
            key={question.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLDivElement
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLDivElement
              target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
              target.style.transform = 'translateY(0)'
            }}
          >
            {/* Question Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div style={{
                background: '#f8fafc',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6366f1'
              }}>
                Q{question.id}
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingQuestion(question)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6366f1',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.background = '#f0f4ff'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.background = 'transparent'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuestion(question.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dc2626',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.background = '#fef2f2'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.background = 'transparent'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Question Content */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.5',
                margin: '0 0 12px 0'
              }}>
                {question.question_text}
              </p>

              {/* Options */}
              {question.option_a && (
                <div style={{ marginBottom: '8px' }}>
                  {['A', 'B', 'C', 'D'].map(option => {
                    const optionKey = `option_${option.toLowerCase()}` as keyof Question
                    const optionText = question[optionKey] as string
                    const isCorrect = question.correct_answer === option
                    
                    if (!optionText) return null
                    
                    return (
                      <div
                        key={option}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '6px 0',
                          fontSize: '13px',
                          color: isCorrect ? '#059669' : '#64748b',
                          fontWeight: isCorrect ? '600' : '400'
                        }}
                      >
                        <span style={{
                          background: isCorrect ? '#dcfce7' : '#f8fafc',
                          color: isCorrect ? '#059669' : '#64748b',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginRight: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {option}
                        </span>
                        {optionText}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Question Meta */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9',
              fontSize: '12px',
              color: '#64748b'
            }}>
              <div>
                <div style={{ fontWeight: '500', marginBottom: '2px' }}>Subject</div>
                <div>{question.subject_name}</div>
              </div>
              <div>
                <div style={{ fontWeight: '500', marginBottom: '2px' }}>Class</div>
                <div>{question.class_level}</div>
              </div>
              <div>
                <div style={{ fontWeight: '500', marginBottom: '2px' }}>Created</div>
                <div>{formatDate(question.created_at)}</div>
              </div>
              <div>
                <div style={{ fontWeight: '500', marginBottom: '2px' }}>By</div>
                <div>{question.created_by_name}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredQuestions.length === 0 && !loading && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>❓</div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 8px 0'
          }}>
            No questions found
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0
          }}>
            {(searchTerm || subjectFilter || classFilter || typeFilter) 
              ? 'Try adjusting your search criteria or filters.'
              : 'No questions have been added to the system yet.'
            }
          </p>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
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
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 16px 0'
            }}>
              Edit Question
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Question Text
              </label>
              <textarea
                value={editingQuestion.question_text}
                onChange={(e) => setEditingQuestion({
                  ...editingQuestion,
                  question_text: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Options */}
            {['A', 'B', 'C', 'D'].map(option => {
              const optionKey = `option_${option.toLowerCase()}` as keyof Question
              
              return (
                <div key={option} style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Option {option}
                  </label>
                  <input
                    type="text"
                    value={editingQuestion[optionKey] as string}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      [optionKey]: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              )
            })}

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Correct Answer
              </label>
              <select
                value={editingQuestion.correct_answer}
                onChange={(e) => setEditingQuestion({
                  ...editingQuestion,
                  correct_answer: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '24px'
            }}>
              <button
                onClick={() => setEditingQuestion(null)}
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
                Cancel
              </button>
              <button
                onClick={() => updateQuestion(editingQuestion)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Update Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}