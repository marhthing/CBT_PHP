import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import { Search, BookOpen, Edit, Trash2, BarChart3, FileText, GraduationCap, X, Save, Upload, Download, Plus } from 'lucide-react'
import ConfirmationModal from '../ui/ConfirmationModal'

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
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

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
      setStats(response.data.data || null)
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

  const deleteQuestion = useCallback((questionId: number) => {
    setQuestionToDelete(questionId)
    setShowDeleteModal(true)
  }, [])

  const confirmDeleteQuestion = useCallback(async () => {
    if (!questionToDelete) return
    
    setDeleting(true)
    try {
      const response = await api.delete(`/admin/questions/${questionToDelete}`)
      if (response.data.success) {
        await fetchQuestions()
        await fetchQuestionStats()
        setSuccessMessage('Question deleted successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to delete question:', error)
      setError('Failed to delete question: ' + (error.response?.data?.message || error.message))
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setQuestionToDelete(null)
    }
  }, [fetchQuestions, fetchQuestionStats, questionToDelete])

  const updateQuestion = useCallback(async (updatedQuestion: Question) => {
    if (!originalQuestion) return
    
    setSavingEdit(true)
    try {
      const response = await api.put(`/admin/questions/${originalQuestion.id}`, {
        question_text: updatedQuestion.question_text,
        question_type: updatedQuestion.question_type,
        option_a: updatedQuestion.option_a,
        option_b: updatedQuestion.option_b,
        option_c: updatedQuestion.option_c,
        option_d: updatedQuestion.option_d,
        correct_answer: updatedQuestion.correct_answer
      })
      
      if (response.data.success) {
        await fetchQuestions()
        setEditingQuestion(null)
        setOriginalQuestion(null)
        setSuccessMessage('Question updated successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to update question:', error)
      setError('Failed to update question: ' + (error.response?.data?.message || error.message))
    } finally {
      setSavingEdit(false)
    }
  }, [fetchQuestions, originalQuestion])

  const handleBulkUpload = useCallback(async () => {
    if (!selectedFile || !defaultTermId || !defaultSessionId) {
      setError('Please select a file and set default term/session')
      return
    }

    setUploading(true)
    setError('')
    setUploadProgress(['Starting upload...'])
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('default_term_id', defaultTermId)
      formData.append('default_session_id', defaultSessionId)

      const response = await api.post('/teacher/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response.data.success) {
        await fetchQuestions()
        await fetchQuestionStats()
        setShowBulkUpload(false)
        setSelectedFile(null)
        setUploadProgress([])
        setSuccessMessage(`Successfully uploaded ${response.data.data?.uploaded_count || 0} questions!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to upload questions:', error)
      setError('Failed to upload questions: ' + (error.response?.data?.message || error.message))
      if (error.response?.data?.errors) {
        setUploadProgress(error.response.data.errors)
      }
    } finally {
      setUploading(false)
    }
  }, [selectedFile, defaultTermId, defaultSessionId, fetchQuestions, fetchQuestionStats])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadProgress([])
      setError('')
    }
  }, [])

  const downloadTemplate = useCallback(() => {
    // Create subject reference table
    const subjectReference = [
      '# Subject ID Reference Table',
      '# Copy the ID number for the subject you want to use in your questions',
      '# ID | Subject Name | Code',
      '# 1  | Mathematics | MATH',
      '# 2  | English Language | ENG', 
      '# 3  | Physics | PHY',
      '# 4  | Chemistry | CHE',
      '# 5  | Biology | BIO',
      '# 6  | Geography | GEO',
      '# 7  | History | HIS',
      '# 8  | Economics | ECO',
      '# 9  | Accounting | ACC',
      '# 10 | Computer Science | CS',
      '# 11 | Agricultural Science | AGR',
      '# 12 | Civic Education | CIV',
      '# 13 | French | FRE',
      '# 14 | Literature | LIT',
      '# 15 | Government | GOV',
      '#',
      '# Example: For Mathematics questions, use subject_id = 1',
      '# Example: For English questions, use subject_id = 2',
      '',
      'question_text,subject_id,class_level,option_a,option_b,option_c,option_d,correct_answer',
      '"What is the capital of Nigeria?",1,"JSS1","Lagos","Abuja","Kano","Port Harcourt","B"',
      '"Which of the following is a prime number?",1,"JSS2","4","6","7","8","C"'
    ].join('\n')
    
    const blob = new Blob([subjectReference], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions_template_with_subject_reference.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }, [])

  // Manual question creation functions
  const handleCreateFiltersSubmit = useCallback(() => {
    if (!createFilters.subject_id || !createFilters.class_level || !createFilters.term_id || !createFilters.session_id) {
      setError('Please fill in all filter fields before proceeding')
      return
    }
    setError('')
    setShowQuestionForm(true)
    // Initialize with one empty question
    if (manualQuestions.length === 0) {
      setManualQuestions([{
        question_text: '',
        question_type: 'multiple_choice',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A'
      }])
    }
  }, [createFilters, manualQuestions.length])

  const addAnotherQuestion = useCallback(() => {
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
        
        // Auto-set True/False options when question type changes to true_false
        if (field === 'question_type' && value === 'true_false') {
          updatedQuestion.option_a = 'True'
          updatedQuestion.option_b = 'False'
          updatedQuestion.option_c = ''
          updatedQuestion.option_d = ''
          // Reset correct answer to A if it was C or D
          if (updatedQuestion.correct_answer === 'C' || updatedQuestion.correct_answer === 'D') {
            updatedQuestion.correct_answer = 'A'
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



  const submitManualQuestions = useCallback(async () => {
    if (manualQuestions.length === 0) {
      setError('Please add at least one question')
      return
    }

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

    setCreatingQuestions(true)
    setError('')
    
    try {
      const response = await api.post('/admin/questions/bulk', {
        questions: manualQuestions,
        subject_id: parseInt(createFilters.subject_id),
        class_level: createFilters.class_level,
        term_id: parseInt(createFilters.term_id),
        session_id: parseInt(createFilters.session_id)
      })

      if (response.data.success) {
        await fetchQuestions()
        await fetchQuestionStats()
        setShowManualCreate(false)
        setShowQuestionForm(false)
        setManualQuestions([])
        setCreateFilters({ subject_id: '', class_level: '', term_id: '', session_id: '' })
        setSuccessMessage(`Successfully created ${response.data.data.created_count} questions!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to create questions:', error)
      setError('Failed to create questions: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreatingQuestions(false)
    }
  }, [manualQuestions, createFilters, fetchQuestions, fetchQuestionStats])

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
      value: stats?.subjects_count || 0,
      icon: BarChart3,
      color: '#8b5cf6'
    },
    {
      title: 'Class Levels',
      value: stats?.class_levels_count || 0,
      icon: GraduationCap,
      color: '#10b981'
    },
    {
      title: 'Question Types',
      value: stats?.question_types_count || 0,
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowManualCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} />
            Manual Create
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={16} />
            Bulk Upload Questions
          </button>
        </div>
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
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: question.question_type === 'true_false' ? '#7c3aed' : '#059669',
                        background: question.question_type === 'true_false' ? '#f3f4f6' : '#ecfdf5',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {question.question_type === 'true_false' ? 'T/F' : 'MC'}
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
                      onClick={() => {
                        setOriginalQuestion(question)
                        setEditingQuestion({ ...question })
                      }}
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
                  gridTemplateColumns: question.question_type === 'true_false' ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  {(question.question_type === 'true_false' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map(option => {
                    const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;
                    if (!optionText && question.question_type === 'true_false' && (option === 'C' || option === 'D')) {
                      return null; // Don't show empty C/D options for true/false
                    }
                    return (
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
                        {optionText}
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
                    );
                  })}
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
                Edit Question #{originalQuestion?.id || editingQuestion.id}
              </h3>
              <button
                onClick={() => {
                  setEditingQuestion(null)
                  setOriginalQuestion(null)
                }}
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

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Question Type
                </label>
                <select
                  value={editingQuestion.question_type}
                  onChange={(e) => {
                    const newType = e.target.value
                    setEditingQuestion(prev => {
                      if (!prev) return null
                      const updated = { ...prev, question_type: newType }
                      
                      // Auto-set True/False options when changing to true_false
                      if (newType === 'true_false') {
                        updated.option_a = 'True'
                        updated.option_b = 'False'
                        updated.option_c = ''
                        updated.option_d = ''
                        // Reset correct answer if it was C or D
                        if (updated.correct_answer === 'C' || updated.correct_answer === 'D') {
                          updated.correct_answer = 'A'
                        }
                      }
                      
                      return updated
                    })
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                </select>
              </div>

              {(editingQuestion.question_type === 'true_false' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map(option => (
                <div key={option}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Option {option} {editingQuestion.question_type === 'true_false' ? (option === 'A' ? '(True)' : '(False)') : ''}
                  </label>
                  <input
                    type="text"
                    value={editingQuestion[`option_${option.toLowerCase()}` as keyof Question] as string || ''}
                    onChange={(e) => setEditingQuestion(prev => prev ? {
                      ...prev,
                      [`option_${option.toLowerCase()}`]: e.target.value
                    } : null)}
                    readOnly={editingQuestion.question_type === 'true_false'}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: editingQuestion.question_type === 'true_false' ? '#f9fafb' : 'white',
                      cursor: editingQuestion.question_type === 'true_false' ? 'not-allowed' : 'text'
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
                  {editingQuestion.question_type === 'true_false' ? (
                    <>
                      <option value="A">A (True)</option>
                      <option value="B">B (False)</option>
                    </>
                  ) : (
                    <>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </>
                  )}
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '8px'
              }}>
                <button
                  onClick={() => {
                    setEditingQuestion(null)
                    setOriginalQuestion(null)
                  }}
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
                  disabled={savingEdit || !hasUnsavedChanges()}
                  style={{
                    padding: '12px 20px',
                    background: (savingEdit || !hasUnsavedChanges()) ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (savingEdit || !hasUnsavedChanges()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {savingEdit ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
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
                Bulk Upload Questions
              </h3>
              <button
                onClick={() => setShowBulkUpload(false)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Instructions */}
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#0c4a6e',
                  margin: '0 0 8px 0'
                }}>
                  How to Upload Questions
                </h4>
                <ol style={{
                  fontSize: '14px',
                  color: '#0369a1',
                  margin: 0,
                  paddingLeft: '20px'
                }}>
                  <li>Download the CSV template below</li>
                  <li>Fill in your questions following the format</li>
                  <li>Set default term and session for all questions</li>
                  <li>Upload your completed CSV file</li>
                </ol>
              </div>

              {/* Download Template */}
              <div>
                <button
                  onClick={downloadTemplate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    width: 'fit-content'
                  }}
                >
                  <Download size={16} />
                  Download CSV Template
                </button>
              </div>

              {/* Default Term and Session */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Default Term *
                  </label>
                  <select
                    value={defaultTermId}
                    onChange={(e) => setDefaultTermId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Term</option>
                    {lookupData.terms?.map(term => (
                      <option key={term.id} value={term.id}>{term.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Default Session *
                  </label>
                  <select
                    value={defaultSessionId}
                    onChange={(e) => setDefaultSessionId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Session</option>
                    {lookupData.sessions?.map(session => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Upload CSV File *
                </label>
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  background: selectedFile ? '#f0fdf4' : '#fafafa'
                }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <Upload size={16} />
                    Choose CSV File
                  </label>
                  {selectedFile && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      background: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#16a34a'
                    }}>
                      ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress.length > 0 && (
                <div style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '0 0 8px 0'
                  }}>
                    Upload Progress
                  </h4>
                  <div style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    {uploadProgress.map((message, index) => (
                      <div key={index} style={{ marginBottom: '4px' }}>
                        {message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => setShowBulkUpload(false)}
                  style={{
                    padding: '12px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
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
                  onClick={handleBulkUpload}
                  disabled={uploading || !selectedFile || !defaultTermId || !defaultSessionId}
                  style={{
                    padding: '12px 20px',
                    background: (uploading || !selectedFile || !defaultTermId || !defaultSessionId) ? '#9ca3af' : '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (uploading || !selectedFile || !defaultTermId || !defaultSessionId) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {uploading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid white',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Questions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Question Creation Modal */}
      {showManualCreate && !showQuestionForm && (
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
            maxWidth: '500px',
            width: '100%'
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
                Set Question Filters
              </h3>
              <button
                onClick={() => setShowManualCreate(false)}
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
                  Subject *
                </label>
                <select
                  value={createFilters.subject_id}
                  onChange={(e) => setCreateFilters(prev => ({ ...prev, subject_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Subject</option>
                  {lookupData.subjects?.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Class Level *
                </label>
                <select
                  value={createFilters.class_level}
                  onChange={(e) => setCreateFilters(prev => ({ ...prev, class_level: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
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
                  marginBottom: '4px'
                }}>
                  Term *
                </label>
                <select
                  value={createFilters.term_id}
                  onChange={(e) => setCreateFilters(prev => ({ ...prev, term_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Term</option>
                  {lookupData.terms?.map(term => (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Session *
                </label>
                <select
                  value={createFilters.session_id}
                  onChange={(e) => setCreateFilters(prev => ({ ...prev, session_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Session</option>
                  {lookupData.sessions?.map(session => (
                    <option key={session.id} value={session.id}>{session.name}</option>
                  ))}
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '20px'
              }}>
                <button
                  onClick={() => setShowManualCreate(false)}
                  style={{
                    padding: '12px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
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
                  onClick={handleCreateFiltersSubmit}
                  style={{
                    padding: '12px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Continue to Create Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Question Form Modal */}
      {showManualCreate && showQuestionForm && (
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
            maxWidth: '800px',
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
                Create Questions ({manualQuestions.length} question{manualQuestions.length !== 1 ? 's' : ''})
              </h3>
              <button
                onClick={() => {
                  setShowManualCreate(false)
                  setShowQuestionForm(false)
                  setManualQuestions([])
                }}
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

            <div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <strong>Filters:</strong> {lookupData.subjects?.find(s => s.id === parseInt(createFilters.subject_id))?.name} | {createFilters.class_level} | {lookupData.terms?.find(t => t.id === parseInt(createFilters.term_id))?.name} | {lookupData.sessions?.find(s => s.id === parseInt(createFilters.session_id))?.name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {manualQuestions.map((question, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  background: '#fafafa'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{ margin: 0, color: '#374151' }}>Question {index + 1}</h4>
                    {manualQuestions.length > 1 && (
                      <button
                        onClick={() => removeManualQuestion(index)}
                        style={{
                          padding: '4px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '4px'
                      }}>
                        Question Text *
                      </label>
                      <textarea
                        value={question.question_text}
                        onChange={(e) => updateManualQuestion(index, 'question_text', e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                        placeholder="Enter the question..."
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '4px'
                      }}>
                        Question Type *
                      </label>
                      <select
                        value={question.question_type}
                        onChange={(e) => updateManualQuestion(index, 'question_type', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: question.question_type === 'true_false' ? '1fr 1fr' : '1fr 1fr', gap: '12px' }}>
                      {question.question_type === 'true_false' ? 
                        ['A', 'B'].map(option => (
                        <div key={option}>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                          }}>
                            Option {option} {option === 'A' ? '(True)' : '(False)'} *
                          </label>
                          <input
                            type="text"
                            value={question[`option_${option.toLowerCase()}` as keyof typeof question]}
                            onChange={(e) => updateManualQuestion(index, `option_${option.toLowerCase()}`, e.target.value)}
                            readOnly={true}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              backgroundColor: '#f9fafb',
                              cursor: 'not-allowed'
                            }}
                            placeholder={option === 'A' ? 'True' : 'False'}
                          />
                        </div>
                      )) :
                        ['A', 'B', 'C', 'D'].map(option => (
                        <div key={option}>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                          }}>
                            Option {option} *
                          </label>
                          <input
                            type="text"
                            value={question[`option_${option.toLowerCase()}` as keyof typeof question]}
                            onChange={(e) => updateManualQuestion(index, `option_${option.toLowerCase()}`, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                            placeholder={`Option ${option}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '4px'
                      }}>
                        Correct Answer *
                      </label>
                      <select
                        value={question.correct_answer}
                        onChange={(e) => updateManualQuestion(index, 'correct_answer', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      >
                        {question.question_type === 'true_false' ? (
                          <>
                            <option value="A">A (True)</option>
                            <option value="B">B (False)</option>
                          </>
                        ) : (
                          <>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'space-between',
                marginTop: '20px'
              }}>
                <button
                  onClick={addAnotherQuestion}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  Add Another Question
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setShowQuestionForm(false)
                      setManualQuestions([])
                    }}
                    style={{
                      padding: '12px 20px',
                      background: '#f3f4f6',
                      color: '#374151',
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
                    onClick={submitManualQuestions}
                    disabled={creatingQuestions || manualQuestions.length === 0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
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
                          border: '2px solid white',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Creating Questions...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Upload Questions ({manualQuestions.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setQuestionToDelete(null)
        }}
        onConfirm={confirmDeleteQuestion}
        title="Delete Question"
        message={questionToDelete ? `Are you sure you want to delete this question? This action cannot be undone.` : ""}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
      />
    </div>
  )
}