import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import { Search, BookOpen, Edit, Trash2, BarChart3, FileText, GraduationCap, X, Save, Upload, Download, Plus } from 'lucide-react'
import ConfirmationModal from '../ui/ConfirmationModal'

interface Question {
  id: number
  question_text: string
  question_type: string
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
  by_type: Record<string, number>
}

interface LookupData {
  subjects?: Array<{id: number, name: string}>
  terms?: Array<{id: number, name: string}>
  sessions?: Array<{id: number, name: string}>
}

export default function TeacherAllQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [stats, setStats] = useState<QuestionStats | null>(null)
  const [lookupData, setLookupData] = useState<LookupData>({})
  const [loading, setLoading] = useState(true)

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [originalQuestion, setOriginalQuestion] = useState<Question | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Bulk upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<string[]>([])
  const [defaultTermId, setDefaultTermId] = useState('')
  const [defaultSessionId, setDefaultSessionId] = useState('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Manual question creation state
  const [showManualCreate, setShowManualCreate] = useState(false)
  const [manualQuestions, setManualQuestions] = useState<Array<{
    question_text: string
    question_type: string
    option_a: string
    option_b: string
    option_c: string
    option_d: string
    correct_answer: string
  }>>([])
  const [createFilters, setCreateFilters] = useState({
    subject_id: '',
    class_level: '',
    term_id: '',
    session_id: ''
  })
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [creatingQuestions, setCreatingQuestions] = useState(false)

  // Delete confirmation
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchQuestions = useCallback(async () => {
    try {
      setError('')
      const response = await api.get('/teacher/questions?limit=100')
      if (response.data.success) {
        const questions = response.data.data?.questions || []
        setQuestions(questions)
      } else {
        setError('Failed to load questions: ' + (response.data.message || 'Unknown error'))
      }
    } catch (error: any) {
      console.error('Failed to fetch questions:', error)
      setError('Failed to load questions: ' + (error.response?.data?.message || error.message))
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/teacher/questions?stats=true')
      if (response.data.success) {
        const statsData = response.data.data || {}
        const stats = {
          total_questions: statsData.total_questions || 0,
          by_subject: statsData.by_subject || {},
          by_class: statsData.by_class || {},
          by_type: statsData.by_type || {}
        }
        setStats(stats)
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  const fetchLookupData = useCallback(async () => {
    try {
      const response = await api.get('/system/lookup')
      if (response.data.success) {
        setLookupData(response.data.data)
      }
    } catch (error: any) {
      console.error('Failed to fetch lookup data:', error)
    }
  }, [])

  useEffect(() => {
    Promise.all([
      fetchQuestions(),
      fetchStats(),
      fetchLookupData()
    ]).finally(() => setLoading(false))
  }, [fetchQuestions, fetchStats, fetchLookupData])

  // Handle manual question creation
  const addNewQuestion = useCallback(() => {
    setManualQuestions(prev => [...prev, {
      question_text: '',
      question_type: 'multiple_choice',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A'
    }])
  }, [])

  const updateManualQuestion = useCallback((index: number, field: string, value: string) => {
    setManualQuestions(prev => prev.map((q, i) => {
      if (i === index) {
        const updatedQuestion = { ...q, [field]: value }
        
        // Auto-adjust for question type changes
        if (field === 'question_type') {
          if (value === 'true_false') {
            updatedQuestion.option_a = 'True'
            updatedQuestion.option_b = 'False'
            updatedQuestion.option_c = ''
            updatedQuestion.option_d = ''
            // Reset correct answer to A if it was C or D
            if (updatedQuestion.correct_answer === 'C' || updatedQuestion.correct_answer === 'D') {
              updatedQuestion.correct_answer = 'A'
            }
          }
        }
        
        return updatedQuestion
      }
      return q
    }))
  }, [])

  const removeManualQuestion = useCallback((index: number) => {
    setManualQuestions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleCreateQuestions = useCallback(async () => {
    // Validate all questions
    for (let i = 0; i < manualQuestions.length; i++) {
      const q = manualQuestions[i]
      if (!q.question_text || !q.option_a || !q.option_b) {
        setError(`Question ${i + 1} is incomplete. Please fill required fields.`)
        return
      }
      
      // For multiple choice, also validate options C and D
      if (q.question_type === 'multiple_choice' && (!q.option_c || !q.option_d)) {
        setError(`Question ${i + 1} is Multiple Choice but missing options C or D.`)
        return
      }
      
      // Validate correct answer based on question type
      if (q.question_type === 'true_false' && !['A', 'B'].includes(q.correct_answer)) {
        setError(`Question ${i + 1} is True/False but correct answer is not A or B.`)
        return
      }
      
      if (q.question_type === 'multiple_choice' && !['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
        setError(`Question ${i + 1} is Multiple Choice but correct answer is not A, B, C, or D.`)
        return
      }
    }

    // Validate filters
    if (!createFilters.subject_id || !createFilters.class_level || !createFilters.term_id || !createFilters.session_id) {
      setError('Please select Subject, Class Level, Term, and Session for all questions.')
      return
    }

    if (manualQuestions.length === 0) {
      setError('Please add at least one complete question')
      return
    }

    setCreatingQuestions(true)
    setError('')

    try {
      const response = await api.post('/teacher/questions/bulk', {
        questions: manualQuestions,
        subject_id: parseInt(createFilters.subject_id),
        class_level: createFilters.class_level,
        term_id: parseInt(createFilters.term_id),
        session_id: parseInt(createFilters.session_id)
      })

      if (response.data.success) {
        await fetchQuestions()
        await fetchStats()
        setShowManualCreate(false)
        setShowQuestionForm(false)
        setManualQuestions([])
        setCreateFilters({ subject_id: '', class_level: '', term_id: '', session_id: '' })
        setSuccessMessage(`Successfully created ${response.data.data.created_count || manualQuestions.length} questions!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to create questions:', error)
      setError('Failed to create questions: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreatingQuestions(false)
    }
  }, [manualQuestions, createFilters, fetchQuestions, fetchStats])

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

  // Check if any changes were made to the editing question
  const hasUnsavedChanges = useCallback(() => {
    if (!editingQuestion || !originalQuestion) return false
    
    return (
      editingQuestion.question_text !== originalQuestion.question_text ||
      editingQuestion.question_type !== originalQuestion.question_type ||
      editingQuestion.option_a !== originalQuestion.option_a ||
      editingQuestion.option_b !== originalQuestion.option_b ||
      editingQuestion.option_c !== originalQuestion.option_c ||
      editingQuestion.option_d !== originalQuestion.option_d ||
      editingQuestion.correct_answer !== originalQuestion.correct_answer
    )
  }, [editingQuestion, originalQuestion])

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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 4px 0'
          }}>
            All Questions
          </h1>
          <p style={{
            color: '#64748b',
            margin: '0',
            fontSize: '16px'
          }}>
            Manage your question bank
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowManualCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#5856eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
          >
            <Plus size={16} />
            Add Questions
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div style={{
          background: '#dcfce7',
          color: '#166534',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {statsCards.map((card, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: `${card.color}15`
              }}>
                <card.icon size={20} style={{ color: card.color }} />
              </div>
            </div>
            
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '4px'
            }}>
              {card.value.toLocaleString()}
            </div>
            
            <div style={{
              fontSize: '14px',
              color: '#64748b'
            }}>
              {card.title}
            </div>
          </div>
        ))}
      </div>

      {/* Manual Question Creation Modal */}
      {showManualCreate && (
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
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                margin: 0
              }}>
                Create Questions Manually
              </h2>
              <button
                onClick={() => {
                  setShowManualCreate(false)
                  setShowQuestionForm(false)
                  setManualQuestions([])
                  setCreateFilters({ subject_id: '', class_level: '', term_id: '', session_id: '' })
                  setError('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: '#64748b',
                  borderRadius: '4px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <X size={20} />
              </button>
            </div>

            {!showQuestionForm ? (
              <>
                {/* Question setup filters */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>Subject *</label>
                    <select
                      value={createFilters.subject_id}
                      onChange={(e) => setCreateFilters(prev => ({ ...prev, subject_id: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Subject</option>
                      {lookupData.subjects?.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>Class Level *</label>
                    <select
                      value={createFilters.class_level}
                      onChange={(e) => setCreateFilters(prev => ({ ...prev, class_level: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Class</option>
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
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>Term *</label>
                    <select
                      value={createFilters.term_id}
                      onChange={(e) => setCreateFilters(prev => ({ ...prev, term_id: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Term</option>
                      {lookupData.terms?.map(term => (
                        <option key={term.id} value={term.id}>
                          {term.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>Session *</label>
                    <select
                      value={createFilters.session_id}
                      onChange={(e) => setCreateFilters(prev => ({ ...prev, session_id: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">Select Session</option>
                      {lookupData.sessions?.map(session => (
                        <option key={session.id} value={session.id}>
                          {session.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!createFilters.subject_id || !createFilters.class_level || !createFilters.term_id || !createFilters.session_id) {
                      setError('Please select Subject, Class Level, Term, and Session first.')
                      return
                    }
                    setError('')
                    setShowQuestionForm(true)
                    addNewQuestion()
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#5856eb'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
                >
                  <Plus size={16} />
                  Continue to Add Questions
                </button>
              </>
            ) : (
              <>
                {/* Question form */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Questions ({manualQuestions.length})
                    </span>
                    <button
                      onClick={addNewQuestion}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} />
                      Add Question
                    </button>
                  </div>

                  <div style={{
                    maxHeight: '400px',
                    overflow: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    {manualQuestions.map((question, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        borderBottom: index < manualQuestions.length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Question {index + 1}
                          </span>
                          <button
                            onClick={() => removeManualQuestion(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div style={{
                          display: 'grid',
                          gap: '12px'
                        }}>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#374151',
                              marginBottom: '4px'
                            }}>Question Text *</label>
                            <textarea
                              value={question.question_text}
                              onChange={(e) => updateManualQuestion(index, 'question_text', e.target.value)}
                              placeholder="Enter your question..."
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                minHeight: '60px',
                                resize: 'vertical'
                              }}
                            />
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px'
                          }}>
                            <div>
                              <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '4px'
                              }}>Question Type *</label>
                              <select
                                value={question.question_type}
                                onChange={(e) => updateManualQuestion(index, 'question_type', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="multiple_choice">Multiple Choice</option>
                                <option value="true_false">True/False</option>
                              </select>
                            </div>

                            <div>
                              <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '4px'
                              }}>Correct Answer *</label>
                              <select
                                value={question.correct_answer}
                                onChange={(e) => updateManualQuestion(index, 'correct_answer', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                {question.question_type === 'multiple_choice' && (
                                  <>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                  </>
                                )}
                              </select>
                            </div>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: question.question_type === 'multiple_choice' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                            gap: '12px'
                          }}>
                            <div>
                              <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '4px'
                              }}>Option A *</label>
                              <input
                                type="text"
                                value={question.option_a}
                                onChange={(e) => updateManualQuestion(index, 'option_a', e.target.value)}
                                placeholder={question.question_type === 'true_false' ? 'True (auto)' : 'Option A'}
                                disabled={question.question_type === 'true_false'}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  background: question.question_type === 'true_false' ? '#f9fafb' : 'white'
                                }}
                              />
                            </div>

                            <div>
                              <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '4px'
                              }}>Option B *</label>
                              <input
                                type="text"
                                value={question.option_b}
                                onChange={(e) => updateManualQuestion(index, 'option_b', e.target.value)}
                                placeholder={question.question_type === 'true_false' ? 'False (auto)' : 'Option B'}
                                disabled={question.question_type === 'true_false'}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  background: question.question_type === 'true_false' ? '#f9fafb' : 'white'
                                }}
                              />
                            </div>

                            {question.question_type === 'multiple_choice' && (
                              <>
                                <div>
                                  <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '4px'
                                  }}>Option C *</label>
                                  <input
                                    type="text"
                                    value={question.option_c}
                                    onChange={(e) => updateManualQuestion(index, 'option_c', e.target.value)}
                                    placeholder="Option C"
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '6px',
                                      fontSize: '14px'
                                    }}
                                  />
                                </div>

                                <div>
                                  <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: '#374151',
                                    marginBottom: '4px'
                                  }}>Option D *</label>
                                  <input
                                    type="text"
                                    value={question.option_d}
                                    onChange={(e) => updateManualQuestion(index, 'option_d', e.target.value)}
                                    placeholder="Option D"
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '6px',
                                      fontSize: '14px'
                                    }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => {
                      setShowQuestionForm(false)
                      setManualQuestions([])
                    }}
                    style={{
                      padding: '10px 16px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Back to Setup
                  </button>

                  <button
                    onClick={handleCreateQuestions}
                    disabled={creatingQuestions || manualQuestions.length === 0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: creatingQuestions ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: creatingQuestions ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {creatingQuestions ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #ffffff',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Create {manualQuestions.length} Question{manualQuestions.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Questions List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 16px 0'
          }}>
            Questions ({questions.length})
          </h2>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Subjects</option>
              {Object.keys(stats?.by_subject || {}).map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Classes</option>
              {Object.keys(stats?.by_class || {}).map(classLevel => (
                <option key={classLevel} value={classLevel}>{classLevel}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Types</option>
              {Object.keys(stats?.by_type || {}).map(type => (
                <option key={type} value={type}>
                  {type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Question
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Type
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Subject
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Class
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Created
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {questions
                .filter(q => 
                  q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) &&
                  (subjectFilter === '' || q.subject_name === subjectFilter) &&
                  (classFilter === '' || q.class_level === classFilter) &&
                  (typeFilter === '' || q.question_type === typeFilter)
                )
                .map((question) => (
                  <tr
                    key={question.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <td style={{ padding: '16px', maxWidth: '300px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#1e293b',
                        fontWeight: '500',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {question.question_text}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: question.question_type === 'multiple_choice' ? '#dbeafe' : '#fef3c7',
                        color: question.question_type === 'multiple_choice' ? '#1d4ed8' : '#92400e'
                      }}>
                        {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      {question.subject_name}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      {question.class_level}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: '#64748b'
                    }}>
                      {new Date(question.created_at).toLocaleDateString()}
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => {
                            setEditingQuestion({ ...question })
                            setOriginalQuestion({ ...question })
                          }}
                          style={{
                            padding: '6px',
                            background: '#f0f9ff',
                            color: '#0284c7',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#e0f2fe'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#f0f9ff'}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setQuestionToDelete(question)}
                          style={{
                            padding: '6px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#fef2f2'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {questions.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#64748b'
            }}>
              <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{
                fontSize: '18px',
                fontWeight: '500',
                margin: '0 0 8px 0'
              }}>
                No questions found
              </h3>
              <p style={{
                fontSize: '14px',
                margin: '0'
              }}>
                Start by creating questions manually or uploading from CSV
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={async () => {
          if (!questionToDelete) return
          
          setDeleting(true)
          try {
            await api.delete(`/teacher/questions/${questionToDelete.id}`)
            await fetchQuestions()
            await fetchStats()
            setSuccessMessage('Question deleted successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
          } catch (error: any) {
            setError('Failed to delete question: ' + (error.response?.data?.message || error.message))
          } finally {
            setDeleting(false)
            setQuestionToDelete(null)
          }
        }}
        title="Delete Question"
        message={`Are you sure you want to delete this question? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleting}
      />
    </div>
  )
}