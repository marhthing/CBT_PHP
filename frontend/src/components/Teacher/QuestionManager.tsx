import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  difficulty: string
  subject: string
  class_level: string
  created_at: string
  created_by_name: string
}

interface FilterOptions {
  subject_id: string
  class_level: string
  difficulty: string
  term_id: string
  session_id: string
}

export default function QuestionManager() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    subject_id: '',
    class_level: '',
    difficulty: '',
    term_id: '',
    session_id: ''
  })
  const [lookupData, setLookupData] = useState<any>({})
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchQuestions()
    fetchLookupData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [questions, filters])

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/teacher/questions?limit=100')
      setQuestions(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
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

  const applyFilters = () => {
    let filtered = [...questions]

    if (filters.subject_id) {
      filtered = filtered.filter(q => q.subject === filters.subject_id)
    }
    if (filters.class_level) {
      filtered = filtered.filter(q => q.class_level === filters.class_level)
    }
    if (filters.difficulty) {
      filtered = filtered.filter(q => q.difficulty === filters.difficulty)
    }

    setFilteredQuestions(filtered)
  }

  const resetFilters = () => {
    setFilters({
      subject_id: '',
      class_level: '',
      difficulty: '',
      term_id: '',
      session_id: ''
    })
  }

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      await api.delete(`/teacher/questions/${questionId}`)
      setQuestions(prev => prev.filter(q => q.id !== questionId))
    } catch (error) {
      console.error('Failed to delete question:', error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return { bg: '#dcfce7', color: '#166534' }
      case 'Medium': return { bg: '#fef3c7', color: '#92400e' }
      case 'Hard': return { bg: '#fef2f2', color: '#dc2626' }
      default: return { bg: '#f1f5f9', color: '#64748b' }
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
        Loading questions...
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
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        padding: '20px 16px',
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              margin: '0 0 4px 0'
            }}>
              Question Manager
            </h1>
            <p style={{ 
              fontSize: '14px', 
              opacity: 0.9,
              margin: '0'
            }}>
              Manage your test questions
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            + Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Subject
            </label>
            <select
              value={filters.subject_id}
              onChange={(e) => setFilters(prev => ({ ...prev, subject_id: e.target.value }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="">All Subjects</option>
              {lookupData.subjects?.map((subject: any) => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Class
            </label>
            <select
              value={filters.class_level}
              onChange={(e) => setFilters(prev => ({ ...prev, class_level: e.target.value }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="">All Classes</option>
              <option value="JSS1">JSS1</option>
              <option value="JSS2">JSS2</option>
              <option value="JSS3">JSS3</option>
              <option value="SS1">SS1</option>
              <option value="SS2">SS2</option>
              <option value="SS3">SS3</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Difficulty
            </label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <button
          onClick={resetFilters}
          style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* Stats */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1e40af'
            }}>
              {filteredQuestions.length}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              Total Questions
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#059669'
            }}>
              {filteredQuestions.filter(q => q.difficulty === 'Easy').length}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              Easy
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#f59e0b'
            }}>
              {filteredQuestions.filter(q => q.difficulty === 'Medium').length}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              Medium
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#dc2626'
            }}>
              {filteredQuestions.filter(q => q.difficulty === 'Hard').length}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              Hard
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {filteredQuestions.length > 0 ? (
          <div>
            {filteredQuestions.map((question) => {
              const difficultyColors = getDifficultyColor(question.difficulty)
              return (
                <div
                  key={question.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: '0 0 6px 0',
                        lineHeight: '1.4'
                      }}>
                        {question.question_text}
                      </h3>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '8px'
                      }}>
                        {question.subject} • {question.class_level} • Correct: {question.correct_answer}
                      </div>

                      {/* Options */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '4px',
                        fontSize: '11px',
                        color: '#64748b'
                      }}>
                        <div>A) {question.option_a}</div>
                        <div>B) {question.option_b}</div>
                        <div>C) {question.option_c}</div>
                        <div>D) {question.option_d}</div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginLeft: '12px'
                    }}>
                      <span style={{
                        background: difficultyColors.bg,
                        color: difficultyColors.color,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {question.difficulty}
                      </span>

                      <button
                        onClick={() => setEditingQuestion(question)}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          color: '#64748b',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteQuestion(question.id)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '10px',
                    color: '#94a3b8'
                  }}>
                    Created {new Date(question.created_at).toLocaleDateString()} by {question.created_by_name}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>❓</div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>
              No Questions Found
            </h3>
            <p style={{
              fontSize: '14px',
              margin: '0 0 16px 0',
              opacity: 0.8
            }}>
              {questions.length === 0 ? 
                "You haven't created any questions yet." :
                "No questions match your current filters."
              }
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Add Your First Question
            </button>
          </div>
        )}
      </div>
    </div>
  )
}