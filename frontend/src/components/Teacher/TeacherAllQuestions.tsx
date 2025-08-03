import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import { Search, BookOpen, Edit, Trash2, BarChart3, FileText, GraduationCap, X, Save, Upload, Download, Plus } from 'lucide-react'
import ConfirmationModal from '../ui/ConfirmationModal'

interface Question {
  id: number
  question_text: string
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
}

interface QuestionStats {
  total_questions: number
  by_subject: Record<string, number>
  by_class: Record<string, number>
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

  // Manual question creation state
  const [showManualCreate, setShowManualCreate] = useState(false)
  const [manualQuestions, setManualQuestions] = useState<Array<{
    question_text: string
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
      params.append('limit', '100')

      const response = await api.get(`/teacher/questions?${params.toString()}`)
      setQuestions(response.data.data?.questions || [])
    } catch (error: any) {
      console.error('Failed to fetch questions:', error)
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, subjectFilter, classFilter, termFilter, sessionFilter])

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await api.get('/teacher/classes')
      setAssignments(response.data.data?.classes || [])
    } catch (error: any) {
      console.error('Failed to fetch assignments:', error)
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

  const calculateStats = useCallback(() => {
    const stats: QuestionStats = {
      total_questions: questions.length,
      by_subject: {},
      by_class: {}
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
  }, [searchTerm, subjectFilter, classFilter, termFilter, sessionFilter, fetchQuestions])

  const deleteQuestion = useCallback((questionId: number) => {
    setQuestionToDelete(questionId)
    setShowDeleteModal(true)
  }, [])

  const confirmDeleteQuestion = useCallback(async () => {
    if (!questionToDelete) return
    
    setDeleting(true)
    try {
      const response = await api.delete(`/teacher/questions?id=${questionToDelete}`)
      if (response.data.success) {
        await fetchQuestions()
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
  }, [fetchQuestions, questionToDelete])

  const updateQuestion = useCallback(async (updatedQuestion: Question) => {
    if (!originalQuestion) return
    
    setSavingEdit(true)
    try {
      const response = await api.put(`/teacher/questions?id=${originalQuestion.id}`, {
        question_text: updatedQuestion.question_text,
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
      console.error('Failed to update question:', error)
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
      console.error('Failed to upload questions:', error)
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
    // Create subject reference table for teacher's assigned subjects only
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
    setManualQuestions(prev => prev.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    ))
  }, [])

  const handleCreateQuestions = useCallback(async () => {
    const validQuestions = manualQuestions.filter(q => 
      q.question_text.trim() && q.option_a.trim() && q.option_b.trim()
    )

    if (validQuestions.length === 0) {
      setError('Please add at least one complete question')
      return
    }

    setCreatingQuestions(true)
    setError('')

    try {
      const promises = validQuestions.map(question => 
        api.post('/teacher/questions', {
          ...question,
          subject_id: parseInt(createFilters.subject_id),
          class_level: createFilters.class_level,
          term_id: parseInt(createFilters.term_id),
          session_id: parseInt(createFilters.session_id)
        })
      )

      await Promise.all(promises)
      await fetchQuestions()
      
      setShowManualCreate(false)
      setShowQuestionForm(false)
      setManualQuestions([])
      setCreateFilters({ subject_id: '', class_level: '', term_id: '', session_id: '' })
      setSuccessMessage(`Successfully created ${validQuestions.length} questions!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Failed to create questions:', error)
      setError('Failed to create questions: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreatingQuestions(false)
    }
  }, [manualQuestions, createFilters, fetchQuestions])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-shimmer animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="teacher-all-questions p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-gray-600">Manage questions for your assigned subjects</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            onClick={() => setShowManualCreate(true)}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Questions
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_questions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.by_subject).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Classes</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.by_class).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="search-filters bg-white rounded-lg border p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            {availableSubjects.map(subject => (
              <option key={subject.id} value={subject.id.toString()}>{subject.name}</option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Classes</option>
            {availableClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Terms</option>
            {availableTerms.map(term => (
              <option key={term.id} value={term.id.toString()}>{term.name}</option>
            ))}
          </select>

          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Sessions</option>
            {availableSessions.map(session => (
              <option key={session.id} value={session.id.toString()}>{session.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="questions-table bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                  Question
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                  Subject
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                  Class
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                  Answer
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6 hidden sm:table-cell">
                  Created
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((question) => (
                <tr key={question.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 sm:px-6">
                    {editingQuestion?.id === question.id ? (
                      <textarea
                        value={editingQuestion.question_text}
                        onChange={(e) => setEditingQuestion({...editingQuestion, question_text: e.target.value})}
                        className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 max-w-xs">
                        {question.question_text}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {question.subject_name}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                    {question.class_level}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                      {question.correct_answer}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6 hidden sm:table-cell">
                    {new Date(question.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium sm:px-6">
                    <div className="flex items-center space-x-2">
                      {editingQuestion?.id === question.id ? (
                        <>
                          <button
                            onClick={() => updateQuestion(editingQuestion)}
                            disabled={savingEdit}
                            className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                            title="Save Changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingQuestion(null)
                              setOriginalQuestion(null)
                            }}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingQuestion({...question})
                              setOriginalQuestion(question)
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Edit Question"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {questions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first question or uploading a CSV file.
            </p>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Bulk Upload Questions</h2>
              <button onClick={() => setShowBulkUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Download Template</h3>
                    <p className="text-sm text-blue-700">Get the CSV template with your assigned subjects</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              {/* Upload Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <select
                    value={bulkUploadFilters.subject_id}
                    onChange={(e) => setBulkUploadFilters({...bulkUploadFilters, subject_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                  <select
                    value={bulkUploadFilters.class_level}
                    onChange={(e) => setBulkUploadFilters({...bulkUploadFilters, class_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Term *</label>
                  <select
                    value={bulkUploadFilters.term_id}
                    onChange={(e) => setBulkUploadFilters({...bulkUploadFilters, term_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Term</option>
                    {availableTerms.map(term => (
                      <option key={term.id} value={term.id}>{term.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session *</label>
                  <select
                    value={bulkUploadFilters.session_id}
                    onChange={(e) => setBulkUploadFilters({...bulkUploadFilters, session_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">CSV File *</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">Selected: {selectedFile.name}</p>
                )}
              </div>

              {/* Upload Progress */}
              {uploadProgress.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Upload Progress</h3>
                  <div className="space-y-1">
                    {uploadProgress.map((message, index) => (
                      <p key={index} className="text-sm text-gray-600">{message}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowBulkUpload(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={uploading || !selectedFile || !bulkUploadFilters.subject_id || !bulkUploadFilters.class_level || !bulkUploadFilters.term_id || !bulkUploadFilters.session_id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Questions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Create Modal */}
      {showManualCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Create Questions Manually</h2>
              <button onClick={() => {
                setShowManualCreate(false)
                setShowQuestionForm(false)
                setManualQuestions([])
                setCreateFilters({ subject_id: '', class_level: '', term_id: '', session_id: '' })
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {!showQuestionForm ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Set Question Parameters</h3>
                    <p className="text-sm text-blue-700">Choose the subject, class, term, and session for your questions</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                      <select
                        value={createFilters.subject_id}
                        onChange={(e) => setCreateFilters({...createFilters, subject_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Subject</option>
                        {availableSubjects.map(subject => (
                          <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                      <select
                        value={createFilters.class_level}
                        onChange={(e) => setCreateFilters({...createFilters, class_level: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Class</option>
                        {availableClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Term *</label>
                      <select
                        value={createFilters.term_id}
                        onChange={(e) => setCreateFilters({...createFilters, term_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Term</option>
                        {availableTerms.map(term => (
                          <option key={term.id} value={term.id}>{term.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Session *</label>
                      <select
                        value={createFilters.session_id}
                        onChange={(e) => setCreateFilters({...createFilters, session_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Session</option>
                        {availableSessions.map(session => (
                          <option key={session.id} value={session.id}>{session.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowManualCreate(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateFiltersSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Continue to Questions
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-900 mb-2">Add Your Questions</h3>
                    <p className="text-sm text-green-700">Create multiple choice questions for {availableSubjects.find(s => s.id.toString() === createFilters.subject_id)?.name} - {createFilters.class_level}</p>
                  </div>

                  {manualQuestions.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium">Question {index + 1}</h4>
                        {manualQuestions.length > 1 && (
                          <button
                            onClick={() => removeQuestion(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
                          <textarea
                            value={question.question_text}
                            onChange={(e) => updateManualQuestion(index, 'question_text', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Enter your question here..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Option A *</label>
                            <input
                              type="text"
                              value={question.option_a}
                              onChange={(e) => updateManualQuestion(index, 'option_a', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Option A"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Option B *</label>
                            <input
                              type="text"
                              value={question.option_b}
                              onChange={(e) => updateManualQuestion(index, 'option_b', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Option B"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Option C</label>
                            <input
                              type="text"
                              value={question.option_c}
                              onChange={(e) => updateManualQuestion(index, 'option_c', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Option C (optional)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Option D</label>
                            <input
                              type="text"
                              value={question.option_d}
                              onChange={(e) => updateManualQuestion(index, 'option_d', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Option D (optional)"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                          <select
                            value={question.correct_answer}
                            onChange={(e) => updateManualQuestion(index, 'correct_answer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-6 border-t">
                    <button
                      onClick={addAnotherQuestion}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                      Add Another Question
                    </button>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowQuestionForm(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={creatingQuestions}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreateQuestions}
                        disabled={creatingQuestions}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {creatingQuestions ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Create Questions
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteQuestion}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
      />
    </div>
  )
}