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
  AlertCircle,
  Copy,
  X
} from 'lucide-react'

interface TestCodeBatch {
  id: number
  title: string
  subject_name: string
  class_level: string
  term_name: string
  session_name: string
  duration_minutes: number
  total_questions: number
  code_count: number
  total_codes: number
  used_codes: number
  is_active: boolean
  created_at: string
  expires_at: string
  created_by_name: string
}

interface TestCode {
  id: number
  code: string
  title: string
  is_used: boolean
  used_at: string
  used_by: number
  result_id: number
}

interface LookupData {
  subjects?: Array<{id: number, name: string}>
  terms?: Array<{id: number, name: string}>
  sessions?: Array<{id: number, name: string}>
  class_levels?: Array<{id: string, name: string}>
}

interface CreateBatchForm {
  title: string
  subject_id: string
  class_level: string
  duration_minutes: number
  total_questions: number
  term_id: string
  session_id: string
  expires_at: string
  code_count: number
}

export default function TestCodeBatchManager() {
  const [batches, setBatches] = useState<TestCodeBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<TestCodeBatch | null>(null)
  const [batchCodes, setBatchCodes] = useState<TestCode[]>([])
  const [lookupData, setLookupData] = useState<LookupData>({})
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [availableQuestions, setAvailableQuestions] = useState(0)

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  // Create form
  const [createForm, setCreateForm] = useState<CreateBatchForm>({
    title: '',
    subject_id: '',
    class_level: '',
    duration_minutes: 60,
    total_questions: 20,
    term_id: '',
    session_id: '',
    expires_at: '',
    code_count: 10
  })

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (subjectFilter) params.append('subject_id', subjectFilter)
      if (classFilter) params.append('class_level', classFilter)
      
      const response = await api.get(`/admin/test-code-batches?${params.toString()}`)
      setBatches(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch test code batches:', error)
      setError('Failed to load test code batches')
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
    fetchBatches()
    fetchLookupData()
  }, [fetchBatches, fetchLookupData])

  useEffect(() => {
    if (createForm.subject_id && createForm.class_level) {
      checkAvailableQuestions(createForm.subject_id, createForm.class_level)
    }
  }, [createForm.subject_id, createForm.class_level, checkAvailableQuestions])

  const handleCreateBatch = async () => {
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
      await api.post('/admin/test-code-batches', createForm)
      setSuccessMessage(`Successfully created batch with ${createForm.code_count} test codes`)
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
        code_count: 10
      })
      fetchBatches()
    } catch (error: any) {
      console.error('Failed to create test code batch:', error)
      setError(error.response?.data?.message || 'Failed to create test code batch')
    } finally {
      setCreating(false)
    }
  }

  const handleViewBatch = async (batch: TestCodeBatch) => {
    setSelectedBatch(batch)
    setShowViewModal(true)
    
    try {
      const response = await api.get(`/admin/test-code-batches/${batch.id}/codes`)
      setBatchCodes(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch batch codes:', error)
      setError('Failed to load batch codes')
    }
  }

  const handleToggleActivation = async (batch: TestCodeBatch) => {
    try {
      const newStatus = !batch.is_active
      await api.patch(`/admin/test-code-batches/${batch.id}/activate`, {
        is_active: newStatus
      })
      
      setSuccessMessage(`Batch ${newStatus ? 'activated' : 'deactivated'} successfully`)
      fetchBatches()
    } catch (error: any) {
      console.error('Failed to toggle activation:', error)
      setError(error.response?.data?.message || 'Failed to toggle activation')
    }
  }

  const handleDeleteBatch = async (batch: TestCodeBatch) => {
    if (batch.used_codes > 0) {
      setError('Cannot delete batch with used codes')
      return
    }

    if (!confirm(`Are you sure you want to delete "${batch.title}"? This will delete all ${batch.total_codes} codes in this batch.`)) {
      return
    }

    try {
      await api.delete(`/admin/test-code-batches/${batch.id}`)
      setSuccessMessage('Batch deleted successfully')
      fetchBatches()
    } catch (error: any) {
      console.error('Failed to delete batch:', error)
      setError(error.response?.data?.message || 'Failed to delete batch')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage('Code copied to clipboard')
  }

  const filteredBatches = batches.filter(batch => {
    const matchesSubject = !subjectFilter || batch.subject_name.toLowerCase().includes(subjectFilter.toLowerCase())
    const matchesClass = !classFilter || batch.class_level.toLowerCase().includes(classFilter.toLowerCase())
    return matchesSubject && matchesClass
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
          <p className="text-gray-600">Professional bulk test code generation and management</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Batch
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border flex gap-4">
        <div className="flex-1">
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
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
          <input
            type="text"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            placeholder="Enter class level"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{batch.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  batch.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {batch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{batch.subject_name} - {batch.class_level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{batch.duration_minutes} minutes • {batch.total_questions} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{batch.total_codes} codes total</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className={batch.used_codes > 0 ? 'text-green-600 font-medium' : ''}>
                    {batch.used_codes} used • {batch.total_codes - batch.used_codes} available
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Usage Progress</span>
                  <span>{Math.round((batch.used_codes / batch.total_codes) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(batch.used_codes / batch.total_codes) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewBatch(batch)}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-100 flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => handleToggleActivation(batch)}
                  className={`flex-1 px-3 py-2 rounded text-sm flex items-center justify-center gap-1 ${
                    batch.is_active
                      ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {batch.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {batch.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteBatch(batch)}
                  disabled={batch.used_codes > 0}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBatches.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Code Batches</h3>
          <p className="text-gray-500">Create your first batch to get started</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Create Test Code Batch</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Title</label>
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
                    value={createForm.code_count}
                    onChange={(e) => setCreateForm({...createForm, code_count: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    max="100"
                  />
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
                  onClick={handleCreateBatch}
                  disabled={creating || createForm.total_questions > availableQuestions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : `Create ${createForm.code_count} Codes`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Batch Modal */}
      {showViewModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold">{selectedBatch.title}</h3>
                  <p className="text-gray-600">{selectedBatch.subject_name} - {selectedBatch.class_level}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-blue-700 text-sm font-medium">Total Codes</div>
                  <div className="text-2xl font-bold text-blue-900">{selectedBatch.total_codes}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-green-700 text-sm font-medium">Used</div>
                  <div className="text-2xl font-bold text-green-900">{selectedBatch.used_codes}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-yellow-700 text-sm font-medium">Available</div>
                  <div className="text-2xl font-bold text-yellow-900">{selectedBatch.total_codes - selectedBatch.used_codes}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-purple-700 text-sm font-medium">Usage Rate</div>
                  <div className="text-2xl font-bold text-purple-900">{Math.round((selectedBatch.used_codes / selectedBatch.total_codes) * 100)}%</div>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h4 className="font-medium text-gray-900 sticky top-0 bg-white py-2">Individual Test Codes</h4>
                {batchCodes.map((code, index) => (
                  <div 
                    key={code.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      code.is_used 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <div className="font-mono text-lg font-bold">
                        {code.code}
                      </div>
                      {code.is_used ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Used on {new Date(code.used_at).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Available</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => copyToClipboard(code.code)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}