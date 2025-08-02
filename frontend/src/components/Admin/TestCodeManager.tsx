import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'
import { 
  Plus, 
  Eye, 
  Play, 
  Pause, 
  Trash2, 
  FileText, 
  Clock, 
  BookOpen, 
  Users,
  CheckCircle,
  XCircle,
  Copy,
  X,
  Settings
} from 'lucide-react'

interface TestCode {
  id: number
  code: string
  title: string
  subject_name: string
  class_level: string
  term_name: string
  session_name: string
  duration_minutes: number
  total_questions: number
  usage_count: number
  is_active: boolean
  is_activated: boolean
  is_used: boolean
  used_at: string
  used_by: number
  created_at: string
  expires_at: string
  created_by_name: string
}

interface LookupData {
  subjects?: Array<{id: number, name: string}>
  terms?: Array<{id: number, name: string}>
  sessions?: Array<{id: number, name: string}>
  class_levels?: Array<{id: string, name: string}>
}

interface CreateForm {
  title: string
  subject_id: string
  class_level: string
  duration_minutes: number
  total_questions: number
  term_id: string
  session_id: string
  expires_at: string
  count: number // For bulk creation
}

export default function TestCodeManager() {
  const [testCodes, setTestCodes] = useState<TestCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCode, setSelectedCode] = useState<TestCode | null>(null)
  const [lookupData, setLookupData] = useState<LookupData>({})
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [availableQuestions, setAvailableQuestions] = useState(0)

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // all, active, used, unused

  // Create form
  const [createForm, setCreateForm] = useState<CreateForm>({
    title: '',
    subject_id: '',
    class_level: '',
    duration_minutes: 60,
    total_questions: 20,
    term_id: '',
    session_id: '',
    expires_at: '',
    count: 1
  })

  const fetchTestCodes = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (subjectFilter) params.append('subject_id', subjectFilter)
      if (classFilter) params.append('class_level', classFilter)
      params.append('limit', '100')
      
      const response = await api.get(`/admin/test-codes?${params.toString()}`)
      setTestCodes(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch test codes:', error)
      setError('Failed to load test codes')
    } finally {
      setLoading(false)
    }
  }, [subjectFilter, classFilter])

  const fetchLookupData = useCallback(async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || {})
    } catch (error) {
      console.error('Failed to fetch lookup data:', error)
    }
  }, [])

  const checkAvailableQuestions = useCallback(async (subjectId: string, classLevel: string) => {
    if (!subjectId || !classLevel) return
    
    try {
      const response = await api.get(`/admin/questions/count?subject_id=${subjectId}&class_level=${classLevel}`)
      setAvailableQuestions(response.data.data.count || 0)
    } catch (error) {
      console.error('Failed to check available questions:', error)
      setAvailableQuestions(0)
    }
  }, [])

  useEffect(() => {
    fetchTestCodes()
    fetchLookupData()
  }, [fetchTestCodes, fetchLookupData])

  useEffect(() => {
    if (createForm.subject_id && createForm.class_level) {
      checkAvailableQuestions(createForm.subject_id, createForm.class_level)
    }
  }, [createForm.subject_id, createForm.class_level, checkAvailableQuestions])

  const handleCreateCodes = async () => {
    if (!createForm.title || !createForm.subject_id || !createForm.class_level || 
        !createForm.term_id || !createForm.session_id) {
      setError('All fields are required')
      return
    }

    if (createForm.total_questions > availableQuestions) {
      setError(`Not enough questions available. You need ${createForm.total_questions} but only ${availableQuestions} are available.`)
      return
    }

    setCreating(true)
    setError('')

    try {
      const endpoint = createForm.count > 1 ? '/admin/test-codes/bulk' : '/admin/test-codes'
      await api.post(endpoint, createForm)
      
      const message = createForm.count > 1 
        ? `Successfully created ${createForm.count} test codes`
        : 'Test code created successfully'
      
      setSuccessMessage(message)
      setShowCreateModal(false)
      setCreateForm({
        title: '',
        subject_id: '',
        class_level: '',
        duration_minutes: 60,
        total_questions: 20,
        term_id: '',
        session_id: '',
        expires_at: '',
        count: 1
      })
      fetchTestCodes()
    } catch (error: any) {
      console.error('Failed to create test codes:', error)
      setError(error.response?.data?.message || 'Failed to create test codes')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActivation = async (code: TestCode) => {
    try {
      const newStatus = !code.is_activated
      await api.patch(`/admin/test-codes/${code.id}/toggle-activation`, {
        is_activated: newStatus
      })
      
      setSuccessMessage(`Test code ${newStatus ? 'activated' : 'deactivated'} successfully`)
      fetchTestCodes()
    } catch (error: any) {
      console.error('Failed to toggle activation:', error)
      setError(error.response?.data?.message || 'Failed to toggle activation')
    }
  }

  const handleDeleteCode = async (code: TestCode) => {
    if (code.is_used) {
      setError('Cannot delete a test code that has been used')
      return
    }

    if (!confirm(`Are you sure you want to delete test code "${code.code}"?`)) {
      return
    }

    try {
      await api.delete(`/admin/test-codes/${code.id}`)
      setSuccessMessage('Test code deleted successfully')
      fetchTestCodes()
    } catch (error: any) {
      console.error('Failed to delete test code:', error)
      setError(error.response?.data?.message || 'Failed to delete test code')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage('Code copied to clipboard')
  }

  const filteredCodes = testCodes.filter(code => {
    const matchesSubject = !subjectFilter || code.subject_name.toLowerCase().includes(subjectFilter.toLowerCase())
    const matchesClass = !classFilter || code.class_level.toLowerCase().includes(classFilter.toLowerCase())
    
    let matchesStatus = true
    if (statusFilter === 'active') matchesStatus = code.is_active && code.is_activated
    else if (statusFilter === 'used') matchesStatus = code.is_used
    else if (statusFilter === 'unused') matchesStatus = !code.is_used
    
    return matchesSubject && matchesClass && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Test Code Management</h2>
          <p className="text-gray-600">Create and manage test codes with bulk generation support</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Test Codes
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Subjects</option>
              {lookupData.subjects?.map(subject => (
                <option key={subject.id} value={subject.name}>{subject.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
            <input
              type="text"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="Enter class level"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="unused">Unused</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSubjectFilter('')
                setClassFilter('')
                setStatusFilter('')
              }}
              className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Test Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCodes.map((code) => (
          <div key={code.id} className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-mono text-xl font-bold text-blue-600 mb-1">{code.code}</div>
                  <h3 className="text-sm font-medium text-gray-900 truncate">{code.title}</h3>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    code.is_used 
                      ? 'bg-red-100 text-red-800' 
                      : code.is_activated 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {code.is_used ? 'Used' : code.is_activated ? 'Active' : 'Inactive'}
                  </span>
                  {code.is_used && (
                    <span className="text-xs text-gray-500">
                      {new Date(code.used_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{code.subject_name} - {code.class_level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{code.duration_minutes} min • {code.total_questions} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{code.term_name} • {code.session_name}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(code.code)}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-100 flex items-center justify-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => handleToggleActivation(code)}
                  disabled={code.is_used}
                  className={`px-3 py-2 rounded text-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    code.is_activated
                      ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {code.is_activated ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteCode(code)}
                  disabled={code.is_used}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCodes.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Codes Found</h3>
          <p className="text-gray-500">Create your first test codes to get started</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Create Test Codes</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Title</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Mathematics Mid-Term Exam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={createForm.subject_id}
                    onChange={(e) => setCreateForm({...createForm, subject_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Subject</option>
                    {lookupData.subjects?.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Level</label>
                  <input
                    type="text"
                    value={createForm.class_level}
                    onChange={(e) => setCreateForm({...createForm, class_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., SS1, JSS2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select
                    value={createForm.term_id}
                    onChange={(e) => setCreateForm({...createForm, term_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Term</option>
                    {lookupData.terms?.map(term => (
                      <option key={term.id} value={term.id}>{term.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                  <select
                    value={createForm.session_id}
                    onChange={(e) => setCreateForm({...createForm, session_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Session</option>
                    {lookupData.sessions?.map(session => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={createForm.duration_minutes}
                    onChange={(e) => setCreateForm({...createForm, duration_minutes: parseInt(e.target.value) || 60})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Questions
                    {availableQuestions > 0 && (
                      <span className="text-sm text-gray-500 ml-2">({availableQuestions} available)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={createForm.total_questions}
                    onChange={(e) => setCreateForm({...createForm, total_questions: parseInt(e.target.value) || 20})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    max={availableQuestions}
                  />
                  {createForm.total_questions > availableQuestions && availableQuestions > 0 && (
                    <p className="text-red-500 text-xs mt-1">Not enough questions available</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Codes</label>
                  <input
                    type="number"
                    value={createForm.count}
                    onChange={(e) => setCreateForm({...createForm, count: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {createForm.count > 1 ? `Create ${createForm.count} test codes at once` : 'Create a single test code'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={createForm.expires_at}
                    onChange={(e) => setCreateForm({...createForm, expires_at: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCodes}
                  disabled={creating || createForm.total_questions > availableQuestions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 
                   createForm.count > 1 ? `Create ${createForm.count} Codes` : 'Create Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}