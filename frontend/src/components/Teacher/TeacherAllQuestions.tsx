import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import { Search, BookOpen, Edit, Trash2, BarChart3, FileText, GraduationCap, X, Upload, Download, Plus } from 'lucide-react'
import ConfirmationModal from '../ui/ConfirmationModal'

interface Question {
  id: number
  question_text: string
  question_type: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  subject_name: string
  subject_id: number
  class_level: string
  term_id: number
  session_id: number
  created_at: string
}

interface TeacherAssignment {
  id: number
  subject_id: number
  subject_name: string
  subject_code: string
  class_level: string
  term_id: number
  term_name: string
  session_id: number
  session_name: string
  created_at: string
}

interface LookupData {
  subjects?: Array<{id: number, name: string, code: string}>
  terms?: Array<{id: number, name: string}>
  sessions?: Array<{id: number, name: string}>
  class_levels?: Array<{id: string, name: string}>
}

interface QuestionStats {
  total_questions: number
  by_subject: Record<string, number>
  by_class: Record<string, number>
  by_type: Record<string, number>
}

export default function TeacherAllQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
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
  const [bulkUploadFilters, setBulkUploadFilters] = useState({
    subject_id: '',
    class_level: '',
    term_id: '',
    session_id: ''
  })

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [termFilter, setTermFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [questionsPerPage] = useState(10)

  // Derived data based on teacher assignments
  const availableSubjects = useMemo(() => {
    const subjectIds = new Set(assignments.map(a => a.subject_id))
    return lookupData.subjects?.filter(s => subjectIds.has(s.id)) || []
  }, [assignments, lookupData.subjects])

  const availableClasses = useMemo(() => {
    const classes = new Set(assignments.map(a => a.class_level))
    return Array.from(classes).sort()
  }, [assignments])

  const availableTerms = useMemo(() => {
    const termIds = new Set(assignments.map(a => a.term_id))
    return lookupData.terms?.filter(t => termIds.has(t.id)) || []
  }, [assignments, lookupData.terms])

  const availableSessions = useMemo(() => {
    const sessionIds = new Set(assignments.map(a => a.session_id))
    return lookupData.sessions?.filter(s => sessionIds.has(s.id)) || []
  }, [assignments, lookupData.sessions])

  // Fetch functions
  const fetchQuestions = useCallback(async () => {
    try {
      setError('')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (subjectFilter) params.append('subject', subjectFilter)
      if (classFilter) params.append('class', classFilter)
      if (termFilter) params.append('term', termFilter)
      if (sessionFilter) params.append('session', sessionFilter)
      if (typeFilter) params.append('type', typeFilter)
      params.append('limit', '100')

      const response = await api.get(`/teacher/questions?${params.toString()}`)
      setQuestions(response.data.data?.questions || [])
    } catch (error: any) {
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, subjectFilter, classFilter, termFilter, sessionFilter, typeFilter])

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await api.get('/teacher/classes')
      setAssignments(response.data.data?.classes || [])
    } catch (error: any) {
      // Failed to fetch assignments
    }
  }, [])

  const fetchLookupData = useCallback(async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || {})
    } catch (error) {
      // Failed to fetch lookup data
    }
  }, [])

  const calculateStats = useCallback(() => {
    const stats: QuestionStats = {
      total_questions: questions.length,
      by_subject: {},
      by_class: {},
      by_type: {}
    }

    questions.forEach(q => {
      // By subject
      if (stats.by_subject[q.subject_name]) {
        stats.by_subject[q.subject_name]++
      } else {
        stats.by_subject[q.subject_name] = 1
      }

      // By class
      if (stats.by_class[q.class_level]) {
        stats.by_class[q.class_level]++
      } else {
        stats.by_class[q.class_level] = 1
      }

      // By type
      if (stats.by_type[q.question_type]) {
        stats.by_type[q.question_type]++
      } else {
        stats.by_type[q.question_type] = 1
      }
    })

    setStats(stats)
  }, [questions])

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetchAssignments(),
      fetchLookupData()
    ]).then(() => {
      fetchQuestions()
    })
  }, [fetchAssignments, fetchLookupData, fetchQuestions])

  // Calculate stats when questions change
  useEffect(() => {
    calculateStats()
  }, [calculateStats])

  // Debounced effect for search and filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchQuestions()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, subjectFilter, classFilter, termFilter, sessionFilter, typeFilter, fetchQuestions])

  const deleteQuestion = useCallback((questionId: number) => {
    setQuestionToDelete(questionId)
    setShowDeleteModal(true)
  }, [])

  const confirmDeleteQuestion = useCallback(async () => {
    if (!questionToDelete) return

    setDeleting(true)
    try {
      // Use POST with method override for InfinityFree compatibility
      const response = await api.post(`/teacher/questions?id=${questionToDelete}`, {
        _method: 'DELETE',
        id: questionToDelete
      })
      if (response.data.success) {
        await fetchQuestions()
        setSuccessMessage('Question deleted successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      setError('Failed to delete question: ' + (error.response?.data?.message || error.message))
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setQuestionToDelete(null)
    }
  }, [fetchQuestions, questionToDelete])

  const updateQuestion = useCallback(async (updatedQuestion: Question) => {
    if (!originalQuestion) return

    setSavingEdit(true)
    try {
      // Use POST with method override for InfinityFree compatibility
      const response = await api.post(`/teacher/questions?id=${originalQuestion.id}`, {
        _method: 'PUT',
        id: originalQuestion.id,
        question_text: updatedQuestion.question_text,
        question_type: updatedQuestion.question_type,
        option_a: updatedQuestion.option_a,
        option_b: updatedQuestion.option_b,
        option_c: updatedQuestion.option_c,
        option_d: updatedQuestion.option_d,
        correct_answer: updatedQuestion.correct_answer,
        subject_id: updatedQuestion.subject_id,
        class_level: updatedQuestion.class_level,
        term_id: updatedQuestion.term_id,
        session_id: updatedQuestion.session_id
      })

      if (response.data.success) {
        await fetchQuestions()
        setEditingQuestion(null)
        setOriginalQuestion(null)
        setSuccessMessage('Question updated successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      setError('Failed to update question: ' + (error.response?.data?.message || error.message))
    } finally {
      setSavingEdit(false)
    }
  }, [fetchQuestions, originalQuestion])

  const handleBulkUpload = useCallback(async () => {
    if (!selectedFile || !bulkUploadFilters.subject_id || !bulkUploadFilters.class_level || 
        !bulkUploadFilters.term_id || !bulkUploadFilters.session_id) {
      setError('Please select a file and fill in all required fields')
      return
    }

    setUploading(true)
    setError('')
    setUploadProgress(['Starting upload...'])

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('subject_id', bulkUploadFilters.subject_id)
      formData.append('class_level', bulkUploadFilters.class_level)
      formData.append('term_id', bulkUploadFilters.term_id)
      formData.append('session_id', bulkUploadFilters.session_id)

      const response = await api.post('/teacher/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        await fetchQuestions()
        setShowBulkUpload(false)
        setSelectedFile(null)
        setUploadProgress([])
        setBulkUploadFilters({ subject_id: '', class_level: '', term_id: '', session_id: '' })
        setSuccessMessage(`Successfully uploaded ${response.data.data?.created_count || 0} questions!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      setError('Failed to upload questions: ' + (error.response?.data?.message || error.message))
      if (error.response?.data?.errors) {
        setUploadProgress(error.response.data.errors)
      }
    } finally {
      setUploading(false)
    }
  }, [selectedFile, bulkUploadFilters, fetchQuestions])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadProgress([])
      setError('')
    }
  }, [])

  const downloadTemplate = useCallback(() => {
    const subjectReference = [
      '# Subject ID Reference Table - Your Assigned Subjects Only',
      '# Copy the ID number for the subject you want to use in your questions',
      '# ID | Subject Name | Code',
      ...availableSubjects.map(s => `# ${s.id}  | ${s.name} | ${s.code}`),
      '#',
      '# Example: For your first assigned subject, use subject_id = ' + (availableSubjects[0]?.id || '1'),
      '',
      'question_text,option_a,option_b,option_c,option_d,correct_answer',
      '"What is the capital of Nigeria?","Lagos","Abuja","Kano","Port Harcourt","B"',
      '"Which of the following is a prime number?","4","6","7","8","C"'
    ].join('\n')

    const blob = new Blob([subjectReference], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teacher_questions_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }, [availableSubjects])

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

  const removeQuestion = useCallback((index: number) => {
    setManualQuestions(prev => prev.filter((_, i) => i !== index))
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
        setShowManualCreate(false)
        setShowQuestionForm(false)
        setManualQuestions([])
        setCreateFilters({ subject_id: '', class_level: '', term_id: '', session_id: '' })
        setSuccessMessage(`Successfully created ${response.data.data.created_count || manualQuestions.length} questions!`)
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      setError('Failed to create questions: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreatingQuestions(false)
    }
  }, [manualQuestions, createFilters, fetchQuestions])

  // Memoized stats cards
  const statsCards = useMemo(() => [
    {
      title: 'Total Questions',
      value: stats?.total_questions || 0,
      icon: BookOpen,
      color: '#3b82f6',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Subjects',
      value: Object.keys(stats?.by_subject || {}).length,
      icon: BarChart3,
      color: '#10b981',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Class Levels',
      value: Object.keys(stats?.by_class || {}).length,
      icon: GraduationCap,
      color: '#8b5cf6',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Question Types',
      value: Object.keys(stats?.by_type || {}).length,
      icon: FileText,
      color: '#f59e0b',
      bgColor: 'bg-amber-50'
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

    // Get current questions
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-gray-600 mt-1">Manage questions for your assigned subjects</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowManualCreate(true)}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create Questions</span>
              <span className="sm:hidden">Create</span>
            </button>
            <button
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Bulk Upload</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <div key={index} className={`${card.bgColor} rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold" style={{ color: card.color }}>
                      {card.value}
                    </p>
                  </div>
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: card.color, opacity: 0.1 }}
                  >
                    <IconComponent size={24} style={{ color: card.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Subjects</option>
              {availableSubjects.map(subject => (
                <option key={subject.id} value={subject.id.toString()}>{subject.name}</option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Classes</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Terms</option>
              {availableTerms.map(term => (
                <option key={term.id} value={term.id.toString()}>{term.name}</option>
              ))}
            </select>

            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Sessions</option>
              {availableSessions.map(session => (
                <option key={session.id} value={session.id.toString()}>{session.name}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="first_ca">First CA</option>
              <option value="second_ca">Second CA</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Questions ({questions.length})
            </h2>
          </div>

          <div className="p-4">
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-600">
                  {searchTerm || subjectFilter || classFilter || termFilter || sessionFilter || typeFilter
                    ? 'Try adjusting your filters'
                    : 'No questions have been created yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentQuestions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Q{(currentPage - 1) * questionsPerPage + index + 1}
                        </span>
                          <span className="text-sm text-gray-600">
                            {question.subject_name} • {question.class_level}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            question.question_type === 'true_false' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {question.question_type === 'true_false' ? 'T/F' : 'MC'}
                          </span>
                        </div>

                        <h4 className="text-base font-medium text-gray-900 mb-2 line-clamp-2">
                          {question.question_text}
                        </h4>

                        <p className="text-sm text-gray-500">
                          Created on {new Date(question.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setOriginalQuestion(question)
                            setEditingQuestion({ ...question })
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className={`grid gap-2 mt-4 ${
                      question.question_type === 'true_false' 
                        ? 'grid-cols-1 sm:grid-cols-2' 
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                    }`}>
                      {(question.question_type === 'true_false' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map(option => {
                        const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;
                        if (!optionText && question.question_type === 'true_false' && (option === 'C' || option === 'D')) {
                          return null;
                        }

                        const isCorrect = question.correct_answer === option;
                        return (
                          <div
                            key={option}
                            className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
                              isCorrect 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-gray-600'}`}>
                              {option}.
                            </span>
                            <span className="flex-1 min-w-0 truncate">{optionText}</span>
                            {isCorrect && (
                              <span className="text-green-600 text-xs font-medium flex-shrink-0">✓</span>
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
              {/* Pagination */}
              <nav className="flex items-center justify-between p-4 sm:px-6 bg-white border-t border-gray-200">
                <div className="hidden sm:flex sm:items-center sm:justify-between w-full">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * questionsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * questionsPerPage, questions.length)}</span> of <span className="font-medium">{questions.length}</span> questions
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage * questionsPerPage >= questions.length}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="flex sm:hidden items-center justify-center py-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="mx-2 text-sm text-gray-700">Page {currentPage}</span>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage * questionsPerPage >= questions.length}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </nav>
        </div>
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8 max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Question #{originalQuestion?.id || editingQuestion.id}
              </h3>
              <button
                onClick={() => {
                  setEditingQuestion(null)
                  setOriginalQuestion(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text
                </label>
                <textarea
                  value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion(prev => prev ? {...prev, question_text: e.target.value} : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={editingQuestion.question_type}
                  onChange={(e) => {
                    const newType = e.target.value
                    setEditingQuestion(prev => {
                      if (!prev) return null
                      const updated = { ...prev, question_type: newType }

                      if (newType === 'true_false') {
                        updated.option_a = 'True'
                        updated.option_b = 'False'
                        updated.option_c = ''
                        updated.option_d = ''
                        if (updated.correct_answer === 'C' || updated.correct_answer === 'D') {
                          updated.correct_answer = 'A'
                        }
                      }

                      return updated
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="first_ca">First CA</option>
                  <option value="second_ca">Second CA</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(editingQuestion.question_type === 'true_false' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map(option => (
                  <div key={option}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Option {option} {editingQuestion.question_type === 'true_false' ? (option === 'A' ? '(True)' : '(False)') : ''}
                    </label>
                    <input
                        type="text"
                        value={editingQuestion[`option_${option.toLowerCase()}` as keyof Question] as string || ''}
                        onChange={(e) => setEditingQuestion(prev => prev ? {
                          ...prev,
                          [`option_${option.toLowerCase()}`]: e.target.value
                        } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer
                </label>
                <select
                  value={editingQuestion.correct_answer}
                  onChange={(e) => setEditingQuestion(prev => prev ? {...prev, correct_answer: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
            </div>

            <div className="p-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setEditingQuestion(null)
                  setOriginalQuestion(null)
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingQuestion) {
                    updateQuestion(editingQuestion)
                  }
                }}
                disabled={savingEdit || !hasUnsavedChanges()}
                className={`px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ${savingEdit || !hasUnsavedChanges() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full my-8 max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk Upload Questions
              </h3>
              <button
                onClick={() => setShowBulkUpload(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">How to Upload Questions</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Download the CSV template below</li>
                  <li>Fill in your questions following the format</li>
                  <li>Set subject, class, term and session for all questions</li>
                  <li>Upload your completed CSV file</li>
                </ol>
              </div>

              {/* Download Template */}
              <div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Download size={16} />
                  Download CSV Template
                </button>
              </div>

              {/* Upload Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={bulkUploadFilters.subject_id}
                    onChange={(e) => setBulkUploadFilters({...bulkUploadFilters, subject_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class *
                  </label>
                  <select
                    value={bulkUploadFilters.class_level}
                    onChange={(e) => setBulkUploadFilters({...bulkUploadFilters, class_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term *
                  </label>
                  <select
                    value={bulkUploadFilters.term_id}
                    onChange={(e) => setBulkUploadFilters({...bulkUploadFilters, term_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Term</option>
                    {availableTerms.map(term => (
                      <option key={term.id} value={term.id}>{term.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session *
                  </label>
                  <select
                    value={bulkUploadFilters.session_id}
                    onChange={(e) => setBulkUploadFilters({...bulkUploadFilters, session_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Session</option>
                    {availableSessions.map(session => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      Click to upload CSV file
                    </span>
                  </label>
                  {selectedFile && (
                    <div className="mt-2 text-sm text-green-600">
                      ✓ {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Progress</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {uploadProgress.map((message, index) => (
                      <div key={index}>{message}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 flex justify-end gap-4">
              <button
                onClick={() => setShowBulkUpload(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={uploading || !selectedFile || !bulkUploadFilters.subject_id || !bulkUploadFilters.class_level || !bulkUploadFilters.term_id || !bulkUploadFilters.session_id}
                className={`px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ${uploading || !selectedFile || !bulkUploadFilters.subject_id || !bulkUploadFilters.class_level || !bulkUploadFilters.term_id || !bulkUploadFilters.session_id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? 'Uploading...' : 'Upload Questions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Question Creation Modal */}
      {showManualCreate && !showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full my-8 max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Set Question Filters
              </h3>
              <button
                onClick={() => setShowManualCreate(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={createFilters.subject_id}
                  onChange={(e) => setCreateFilters(prev => ({ ...prev, subject_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Level *
                </label>
                <select
                  value={createFilters.class_level}
                  onChange={(e) => setCreateFilters(prev => ({ ...prev, class_level: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select Class</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term *
                </label>
                <select
                  value={createFilters.term_id}
                  onChange={(e) => setCreateFilters(prev => ({ ...prev, term_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select Term</option>
                  {availableTerms.map(term => (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session *
                </label>
                <select
                  value={createFilters.session_id}
                  onChange={(e) => setCreateFilters(prev => ({ ...prev, session_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select Session</option>
                  {availableSessions.map(session => (
                    <option key={session.id} value={session.id}>{session.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowManualCreate(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFiltersSubmit}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Questions ({manualQuestions.length} question{manualQuestions.length !== 1 ? 's' : ''})
              </h3>
              <button
                onClick={() => {
                  setShowManualCreate(false)
                  setShowQuestionForm(false)
                  setManualQuestions([])
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                <strong>Filters:</strong> {availableSubjects.find(s => s.id === parseInt(createFilters.subject_id))?.name} | {createFilters.class_level} | {availableTerms.find(t => t.id === parseInt(createFilters.term_id))?.name} | {availableSessions.find(s => s.id === parseInt(createFilters.session_id))?.name}
              </div>

              {manualQuestions.map((question, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Question {index + 1}</h4>
                    {manualQuestions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(index)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text *
                      </label>
                      <textarea
                        value={question.question_text}
                        onChange={(e) => updateManualQuestion(index, 'question_text', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter the question..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type *
                      </label>
                      <select
                        value={question.question_type}
                        onChange={(e) => updateManualQuestion(index, 'question_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                        <option value="first_ca">First CA</option>
                        <option value="second_ca">Second CA</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Option A *
                        </label>
                        <input
                          type="text"
                          value={question.option_a}
                          onChange={(e) => updateManualQuestion(index, 'option_a', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Option A"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Option B *
                        </label>
                        <input
                          type="text"
                          value={question.option_b}
                          onChange={(e) => updateManualQuestion(index, 'option_b', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Option B"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Option C {question.question_type === 'multiple_choice' ? '*' : ''}
                        </label>
                        <input
                          type="text"
                          value={question.option_c}
                          onChange={(e) => updateManualQuestion(index, 'option_c', e.target.value)}
                          disabled={question.question_type === 'true_false'}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            question.question_type === 'true_false' ? 'bg-gray-100 text-gray-400' : ''
                          }`}
                          placeholder={question.question_type === 'multiple_choice' ? "Option C" : "Not used for True/False"}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Option D {question.question_type === 'multiple_choice' ? '*' : ''}
                        </label>
                        <input
                          type="text"
                          value={question.option_d}
                          onChange={(e) => updateManualQuestion(index, 'option_d', e.target.value)}
                          disabled={question.question_type === 'true_false'}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            question.question_type === 'true_false' ? 'bg-gray-100 text-gray-400' : ''
                          }`}
                          placeholder={question.question_type === 'multiple_choice' ? "Option D" : "Not used for True/False"}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer *
                      </label>
                      <select
                        value={question.correct_answer}
                        onChange={(e) => updateManualQuestion(index, 'correct_answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="A">A - {question.option_a || 'Option A'}</option>
                        <option value="B">B - {question.option_b || 'Option B'}</option>
                        {question.question_type === 'multiple_choice' && (
                          <>
                            <option value="C">C - {question.option_c || 'Option C'}</option>
                            <option value="D">D - {question.option_d || 'Option D'}</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
                <button
                  onClick={addAnotherQuestion}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus size={16} />
                  Add Another Question
                </button>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowQuestionForm(false)
                      setManualQuestions([])
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateQuestions}
                    disabled={creatingQuestions || manualQuestions.length === 0}
                    className={`px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors ${creatingQuestions || manualQuestions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {creatingQuestions ? 'Creating...' : `Create Questions (${manualQuestions.length})`}
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
          if (!deleting) {
            setShowDeleteModal(false)
            setQuestionToDelete(null)
          }
        }}
        onConfirm={confirmDeleteQuestion}
        isLoading={deleting}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </div>
  )
}