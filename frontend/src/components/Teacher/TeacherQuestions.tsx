import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye,
  BookOpen,
  Users,
  Calendar,
  GraduationCap,
  FileText,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

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
  subjects: Array<{
    id: number
    name: string
    code: string
  }>
  terms: Array<{
    id: number
    name: string
  }>
  sessions: Array<{
    id: number
    name: string
  }>
}

interface CreateQuestionData {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  subject_id: number
  class_level: string
  term_id: number
  session_id: number
}

export default function TeacherQuestions() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [lookupData, setLookupData] = useState<LookupData>({ subjects: [], terms: [], sessions: [] })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter states
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState<CreateQuestionData>({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    subject_id: 0,
    class_level: '',
    term_id: 0,
    session_id: 0
  })

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await api.get('/teacher/questions')
      setQuestions(response.data.data.questions || [])
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    }
  }, [])

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await api.get('/teacher/classes')
      setAssignments(response.data.data.classes || [])
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    }
  }, [])

  const fetchLookupData = useCallback(async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || { subjects: [], terms: [], sessions: [] })
    } catch (error) {
      console.error('Failed to fetch lookup data:', error)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchQuestions(),
        fetchAssignments(),
        fetchLookupData()
      ])
      setLoading(false)
    }
    loadData()
  }, [fetchQuestions, fetchAssignments, fetchLookupData])

  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      const matchesSearch = !searchTerm || 
        question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSubject = !selectedSubject || question.subject_id.toString() === selectedSubject
      const matchesClass = !selectedClass || question.class_level === selectedClass
      const matchesTerm = !selectedTerm || question.term_id.toString() === selectedTerm
      const matchesSession = !selectedSession || question.session_id.toString() === selectedSession

      return matchesSearch && matchesSubject && matchesClass && matchesTerm && matchesSession
    })
  }, [questions, searchTerm, selectedSubject, selectedClass, selectedTerm, selectedSession])

  const availableClasses = useMemo(() => {
    const classes = new Set(assignments.map(a => a.class_level))
    return Array.from(classes).sort()
  }, [assignments])

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await api.post('/teacher/questions', formData)
      await fetchQuestions()
      setShowCreateModal(false)
      resetForm()
    } catch (error: any) {
      console.error('Failed to create question:', error)
      alert(error.response?.data?.message || 'Failed to create question')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuestion) return

    setIsSubmitting(true)
    try {
      await api.put(`/teacher/questions?id=${selectedQuestion.id}`, formData)
      await fetchQuestions()
      setShowEditModal(false)
      setSelectedQuestion(null)
      resetForm()
    } catch (error: any) {
      console.error('Failed to update question:', error)
      alert(error.response?.data?.message || 'Failed to update question')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return

    setIsSubmitting(true)
    try {
      await api.delete(`/teacher/questions?id=${selectedQuestion.id}`)
      await fetchQuestions()
      setShowDeleteModal(false)
      setSelectedQuestion(null)
    } catch (error: any) {
      console.error('Failed to delete question:', error)
      alert(error.response?.data?.message || 'Failed to delete question')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      subject_id: 0,
      class_level: '',
      term_id: 0,
      session_id: 0
    })
  }

  const openEditModal = (question: Question) => {
    setSelectedQuestion(question)
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      subject_id: question.subject_id,
      class_level: question.class_level,
      term_id: question.term_id,
      session_id: question.session_id
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (question: Question) => {
    setSelectedQuestion(question)
    setShowDeleteModal(true)
  }

  const openViewModal = (question: Question) => {
    setSelectedQuestion(question)
    setShowViewModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Questions</h1>
          <p className="text-gray-600">Manage questions for your assigned subjects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{new Set(assignments.map(a => a.subject_id)).size}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Classes</p>
              <p className="text-2xl font-bold text-gray-900">{availableClasses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <GraduationCap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Subjects</option>
            {lookupData.subjects.map(subject => (
              <option key={subject.id} value={subject.id.toString()}>{subject.name}</option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Classes</option>
            {availableClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Terms</option>
            {lookupData.terms.map(term => (
              <option key={term.id} value={term.id.toString()}>{term.name}</option>
            ))}
          </select>

          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Sessions</option>
            {lookupData.sessions.map(session => (
              <option key={session.id} value={session.id.toString()}>{session.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Answer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuestions.map((question) => (
                <tr key={question.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {question.question_text}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {question.subject_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {question.class_level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                      {question.correct_answer}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(question.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openViewModal(question)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded"
                        title="View Question"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(question)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Edit Question"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(question)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {questions.length === 0 
                ? "Get started by creating your first question." 
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        )}
      </div>

      {/* Create Question Modal */}
      {showCreateModal && (
        <QuestionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateQuestion}
          formData={formData}
          setFormData={setFormData}
          assignments={assignments}
          lookupData={lookupData}
          isSubmitting={isSubmitting}
          title="Create New Question"
        />
      )}

      {/* Edit Question Modal */}
      {showEditModal && (
        <QuestionModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditQuestion}
          formData={formData}
          setFormData={setFormData}
          assignments={assignments}
          lookupData={lookupData}
          isSubmitting={isSubmitting}
          title="Edit Question"
        />
      )}

      {/* View Question Modal */}
      {showViewModal && selectedQuestion && (
        <ViewQuestionModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          question={selectedQuestion}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedQuestion && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteQuestion}
          questionText={selectedQuestion.question_text}
          isDeleting={isSubmitting}
        />
      )}
    </div>
  )
}

// Question Modal Component
interface QuestionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  formData: CreateQuestionData
  setFormData: (data: CreateQuestionData) => void
  assignments: TeacherAssignment[]
  lookupData: LookupData
  isSubmitting: boolean
  title: string
}

function QuestionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  assignments, 
  lookupData, 
  isSubmitting, 
  title 
}: QuestionModalProps) {
  if (!isOpen) return null

  const availableAssignments = assignments.filter(assignment => 
    !formData.subject_id || assignment.subject_id === formData.subject_id
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option A *
              </label>
              <input
                type="text"
                value={formData.option_a}
                onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option B *
              </label>
              <input
                type="text"
                value={formData.option_b}
                onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option C
              </label>
              <input
                type="text"
                value={formData.option_c}
                onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Option D
              </label>
              <input
                type="text"
                value={formData.option_d}
                onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer *
            </label>
            <select
              value={formData.correct_answer}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={0}>Select Subject</option>
                {Array.from(new Set(assignments.map(a => a.subject_id))).map(subjectId => {
                  const subject = lookupData.subjects.find(s => s.id === subjectId)
                  return subject ? (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ) : null
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                value={formData.class_level}
                onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Class</option>
                {Array.from(new Set(availableAssignments.map(a => a.class_level))).map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term *
              </label>
              <select
                value={formData.term_id}
                onChange={(e) => setFormData({ ...formData, term_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={0}>Select Term</option>
                {Array.from(new Set(availableAssignments.map(a => a.term_id))).map(termId => {
                  const term = lookupData.terms.find(t => t.id === termId)
                  return term ? (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ) : null
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session *
              </label>
              <select
                value={formData.session_id}
                onChange={(e) => setFormData({ ...formData, session_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={0}>Select Session</option>
                {Array.from(new Set(availableAssignments.map(a => a.session_id))).map(sessionId => {
                  const session = lookupData.sessions.find(s => s.id === sessionId)
                  return session ? (
                    <option key={session.id} value={session.id}>{session.name}</option>
                  ) : null
                })}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// View Question Modal Component
interface ViewQuestionModalProps {
  isOpen: boolean
  onClose: () => void
  question: Question
}

function ViewQuestionModal({ isOpen, onClose, question }: ViewQuestionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Question Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Question</h3>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{question.question_text}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border-2 ${question.correct_answer === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <span className="font-medium">A. </span>{question.option_a}
              </div>
              <div className={`p-3 rounded-lg border-2 ${question.correct_answer === 'B' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <span className="font-medium">B. </span>{question.option_b}
              </div>
            </div>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border-2 ${question.correct_answer === 'C' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <span className="font-medium">C. </span>{question.option_c || 'N/A'}
              </div>
              <div className={`p-3 rounded-lg border-2 ${question.correct_answer === 'D' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <span className="font-medium">D. </span>{question.option_d || 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Subject</p>
              <p className="font-medium">{question.subject_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Class</p>
              <p className="font-medium">{question.class_level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Correct Answer</p>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 font-bold">
                {question.correct_answer}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">{new Date(question.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  questionText: string
  isDeleting: boolean
}

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, questionText, isDeleting }: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Question</h3>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              <strong>Question:</strong> {questionText.substring(0, 100)}
              {questionText.length > 100 && '...'}
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}