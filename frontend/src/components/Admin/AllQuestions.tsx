import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import { Search, BookOpen, Edit, Trash2, BarChart3, FileText, GraduationCap, X, Upload, Download, Plus } from 'lucide-react'
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
  subjects_count: number
  class_levels_count: number
  question_types_count: number
  by_subject: Record<string, number>
  by_class: Record<string, number>
  by_type: Record<string, number>
}

interface LookupData {
  subjects?: Array<{id: number, name: string}>
  terms?: Array<{id: number, name: string}>
  sessions?: Array<{id: number, name: string}>
  class_levels?: Array<{id: string, name: string}>
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [questionsPerPage] = useState(10)
  const [totalQuestions, setTotalQuestions] = useState(0)

  // Memoized fetch functions for performance
  const fetchQuestions = useCallback(async () => {
    try {
      setError('')
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (subjectFilter) params.append('subject', subjectFilter)
      if (classFilter) params.append('class', classFilter)
      if (typeFilter) params.append('type', typeFilter)
      params.append('page', String(currentPage))
      params.append('limit', String(questionsPerPage))

      const response = await api.get(`/admin/questions?${params.toString()}`)
      setQuestions(response.data.data?.questions || [])
      setTotalQuestions(response.data.data?.total || 0)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, subjectFilter, classFilter, typeFilter, currentPage, questionsPerPage])

  const fetchQuestionStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/questions?stats=true')
      setStats(response.data.data || null)
    } catch (error: any) {

    }
  }, [])

  const fetchLookupData = useCallback(async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || {})
    } catch (error: any) {
      setError('Failed to load lookup data')
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
      // Use POST with method override for InfinityFree compatibility
      const response = await api.post(`/admin/questions/${questionToDelete}`, {
        _method: 'DELETE',
        id: questionToDelete
      })
      if (response.data.success) {
        await fetchQuestions()
        await fetchQuestionStats()
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
  }, [fetchQuestions, fetchQuestionStats, questionToDelete])

  const updateQuestion = useCallback(async (updatedQuestion: Question) => {
    if (!originalQuestion) return

    setSavingEdit(true)
    try {
      // Use POST with method override for InfinityFree compatibility
      const response = await api.post(`/admin/questions/${originalQuestion.id}`, {
        _method: 'PUT',
        id: originalQuestion.id,
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
      '"Which of the following is a prime number?",1,"JSS2","4","6","7","8","C"',
      '# Note: Use actual class level values from your system (JSS1, JSS2, JSS3, SS1, SS2, SS3, etc.)'
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
      icon: BookOpen
    },
    {
      title: 'Subjects',
      value: stats?.subjects_count || 0,
      icon: BarChart3
    },
    {
      title: 'Class Levels',
      value: stats?.class_levels_count || 0,
      icon: GraduationCap
    },
    {
      title: 'Question Types',
      value: stats?.question_types_count || 0,
      icon: FileText
    }
  ], [stats])

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalQuestions / questionsPerPage)
  }, [totalQuestions, questionsPerPage])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading questions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-gray-600 mt-1">Manage all questions in the system</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowManualCreate(true)}
              className="flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Manual Create</span>
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

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon
          const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']
          const bgColors = ['bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-amber-50']
          const color = colors[index % colors.length]
          const bgColor = bgColors[index % bgColors.length]

          return (
            <div key={index} className={`${bgColor} rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl lg:text-3xl font-bold" style={{ color: color }}>
                    {card.value}
                  </p>
                </div>
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: color, opacity: 0.1 }}
                >
                  <IconComponent size={24} style={{ color: color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {(lookupData.subjects || []).map(subject => (
              <option key={subject.id} value={subject.name}>{subject.name}</option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Classes</option>
            {(lookupData.class_levels || []).map(classLevel => (
              <option key={classLevel.id} value={classLevel.id}>{classLevel.name}</option>
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
            Questions ({filteredQuestions.length})
          </h2>
        </div>

        <div className="p-4">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600">
                {searchTerm || subjectFilter || classFilter || typeFilter
                  ? 'Try adjusting your filters'
                  : 'No questions have been created yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Q{index + 1}
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
                        Created by {question.created_by_name} • {new Date(question.created_at).toLocaleDateString()}
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * questionsPerPage) + 1} to {Math.min(currentPage * questionsPerPage, totalQuestions)} of {totalQuestions} questions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 py-1 rounded text-sm ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
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
          <div className="bg-white rounded-lg max-w-md w-full my-8 max-h-[calc(100vh-64px)] overflow-y-auto">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="w-full"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected file: {selectedFile.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Term
                  </label>
                  <select
                    value={defaultTermId}
                    onChange={(e) => setDefaultTermId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Term</option>
                    {(lookupData.terms || []).map(term => (
                      <option key={term.id} value={term.id}>{term.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Session
                  </label>
                  <select
                    value={defaultSessionId}
                    onChange={(e) => setDefaultSessionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Session</option>
                    {(lookupData.sessions || []).map(session => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <Download size={16} />
                Download CSV Template
              </button>
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
                disabled={uploading || !selectedFile || !defaultTermId || !defaultSessionId}
                className={`px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ${uploading || !selectedFile || !defaultTermId || !defaultSessionId ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>

            {uploadProgress.length > 0 && (
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Progress</h4>
                <ul className="list-disc pl-5">
                  {uploadProgress.map((message, index) => (
                    <li key={index} className="text-sm text-gray-600">{message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Question Creation Modal */}
      {showManualCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full my-8 max-h-[calc(100vh-64px)] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Manual Question Creation
              </h3>
              <button
                onClick={() => {
                  setShowManualCreate(false)
                  setShowQuestionForm(false)
                  setManualQuestions([])
                  setCreateFilters({ subject_id: '', class_level: '', term_id: '', session_id: '' })
                  setError('')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {!showQuestionForm ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <select
                      value={createFilters.subject_id}
                      onChange={(e) => setCreateFilters(prev => ({ ...prev, subject_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select Subject</option>
                      {(lookupData.subjects || []).map(subject => (
                        <option key={subject.id} value={String(subject.id)}>{subject.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Level
                    </label>
                    <select
                      value={createFilters.class_level}
                      onChange={(e) => setCreateFilters(prev => ({ ...prev, class_level: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select Class Level</option>
                      {(lookupData.class_levels || []).map(classLevel => (
                        <option key={classLevel.id} value={classLevel.id}>{classLevel.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Term
                    </label>
                    <select
                      value={createFilters.term_id}
                      onChange={(e) => setCreateFilters(prev => ({ ...prev, term_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select Term</option>
                      {(lookupData.terms || []).map(term => (
                        <option key={term.id} value={String(term.id)}>{term.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session
                    </label>
                    <select
                      value={createFilters.session_id}
                      onChange={(e) => setCreateFilters(prev => ({ ...prev, session_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select Session</option>
                      {(lookupData.sessions || []).map(session => (
                        <option key={session.id} value={String(session.id)}>{session.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateFiltersSubmit}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next: Add Questions
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Add Questions ({manualQuestions.length})
                </h4>

                {manualQuestions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-medium text-gray-700">Question {index + 1}</h5>
                      <button
                        onClick={() => removeManualQuestion(index)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text
                      </label>
                      <textarea
                        value={question.question_text}
                        onChange={(e) => updateManualQuestion(index, 'question_text', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Type
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
                      {(question.question_type === 'true_false' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map(option => (
                        <div key={option}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Option {option} {question.question_type === 'true_false' ? (option === 'A' ? '(True)' : '(False)') : ''}
                          </label>
                          <input
                            type="text"
                            value={question[`option_${option.toLowerCase()}` as keyof typeof question] || ''}
                            onChange={(e) => updateManualQuestion(index, `option_${option.toLowerCase()}`, e.target.value)}
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
                        value={question.correct_answer}
                        onChange={(e) => updateManualQuestion(index, 'correct_answer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                ))}

                <div className="flex justify-between items-center">
                  <button
                    onClick={addAnotherQuestion}
                    className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Add Another Question
                  </button>
                  <button
                    onClick={submitManualQuestions}
                    disabled={creatingQuestions}
                    className={`px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ${creatingQuestions ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {creatingQuestions ? 'Creating...' : 'Create Questions'}
                  </button>
                </div>
              </div>
            )}
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