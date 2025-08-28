import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'
import ConfirmationModal from '../ui/ConfirmationModal'
import { 
  Plus, 
  Copy
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
  score_per_question: number
  usage_count: number
  is_active: boolean
  is_activated: boolean
  is_used: boolean
  used_at: string
  used_by: number
  created_at: string
  expires_at: string
  created_by_name: string
  batch_id?: string
  test_type?: string
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
  score_per_question: number
  term_id: string
  session_id: string
  expires_at: string
  count: number
  test_type: string
}

export default function TestCodeManager() {
  const [testCodes, setTestCodes] = useState<TestCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [lookupData, setLookupData] = useState<LookupData>({})
  const [availableQuestions, setAvailableQuestions] = useState(0)

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [termFilter, setTermFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Form states
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)

  // Confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>({
    title: '',
    subject_id: '',
    class_level: '',
    duration_minutes: 60,
    total_questions: 10,
    score_per_question: 1,
    term_id: '',
    session_id: '',
    expires_at: '',
    count: 1,
    test_type: 'First CA'
  })

  // Fetch test codes
  const fetchTestCodes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/test-codes', {
        params: { limit: 100 }
      })
      setTestCodes(response.data.data || [])
    } catch (error: any) {
      setError('Failed to load test codes')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch lookup data
  const fetchLookupData = useCallback(async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data)
    } catch (error: any) {
      setError('Failed to load lookup data')
    }
  }, [])

  // Check available questions without causing re-renders
  const checkAvailableQuestions = useCallback(async () => {
    if (!createForm.subject_id || !createForm.class_level || !createForm.term_id || !createForm.test_type) {
      if (availableQuestions !== 0) setAvailableQuestions(0)
      return
    }

    try {
      const response = await api.get('/admin/questions/count', {
        params: {
          subject_id: createForm.subject_id,
          class_level: createForm.class_level,
          term_id: createForm.term_id,
          test_type: createForm.test_type
        }
      })
      const newCount = response.data.data?.count || 0
      if (newCount !== availableQuestions) setAvailableQuestions(newCount)
    } catch (error) {
      // Try fallback with regular questions endpoint
      try {
        const fallbackResponse = await api.get('/admin/questions', {
          params: {
            subject: createForm.subject_id,
            class: createForm.class_level,
            limit: 1 // Just get count
          }
        })
        const newCount = fallbackResponse.data.data?.total || 0
        if (newCount !== availableQuestions) setAvailableQuestions(newCount)
      } catch (fallbackError) {
        if (availableQuestions !== 0) setAvailableQuestions(0)
      }
    }
  }, [createForm.subject_id, createForm.class_level, createForm.term_id, createForm.test_type, availableQuestions])

  // Auto-generate title without triggering re-renders
  const generateTitle = useCallback(() => {
    if (createForm.subject_id && createForm.class_level && createForm.term_id && createForm.session_id) {
      const subject = lookupData.subjects?.find(s => s.id === parseInt(createForm.subject_id))
      const term = lookupData.terms?.find(t => t.id === parseInt(createForm.term_id))
      const session = lookupData.sessions?.find(s => s.id === parseInt(createForm.session_id))

      if (subject && term && session) {
        const title = `${subject.name} - ${createForm.class_level} (${term.name} ${session.name})`
        setCreateForm(prev => prev.title !== title ? { ...prev, title } : prev)
      }
    }
  }, [createForm.subject_id, createForm.class_level, createForm.term_id, createForm.session_id, lookupData, createForm.title])

  useEffect(() => {
    fetchTestCodes()
    fetchLookupData()
  }, [fetchTestCodes, fetchLookupData])

  useEffect(() => {
    checkAvailableQuestions()
  }, [checkAvailableQuestions])

  useEffect(() => {
    generateTitle()
  }, [generateTitle])

  // Group codes by batch for management
  const groupedBatches = useMemo(() => {
    const batches = new Map<string, TestCode[]>()

    testCodes.forEach(code => {
      const batchKey = code.batch_id || `single_${code.id}`
      if (!batches.has(batchKey)) {
        batches.set(batchKey, [])
      }
      batches.get(batchKey)!.push(code)
    })

    return Array.from(batches.entries()).map(([batchId, codes]) => ({
      batchId,
      codes,
      title: codes[0].title.replace(/ \(\d+\)$/, ''),
      isActivated: codes.every(code => code.is_activated),
      hasUsedCodes: codes.some(code => code.is_used),
      canActivate: codes.every(code => !code.is_used)
    }))
  }, [testCodes])

  const filteredBatches = useMemo(() => {
    return groupedBatches.filter(batch => {
      const firstCode = batch.codes[0]
      const matchesSubject = !subjectFilter || firstCode.subject_name.toLowerCase().includes(subjectFilter.toLowerCase())
      const matchesClass = !classFilter || firstCode.class_level === classFilter
      const matchesTerm = !termFilter || firstCode.term_name?.toLowerCase().includes(termFilter.toLowerCase())
      const matchesSession = !sessionFilter || firstCode.session_name?.toLowerCase().includes(sessionFilter.toLowerCase())

      let matchesStatus = true
      if (statusFilter === 'active') matchesStatus = batch.isActivated
      else if (statusFilter === 'deactivated') matchesStatus = !batch.isActivated

      return matchesSubject && matchesClass && matchesTerm && matchesSession && matchesStatus
    })
  }, [groupedBatches, subjectFilter, classFilter, termFilter, sessionFilter, statusFilter])

  // Handle batch creation
  const handleCreateCodes = async () => {
    if (!createForm.subject_id || !createForm.class_level || 
        !createForm.term_id || !createForm.session_id) {
      setError('Please fill in all required fields')
      return
    }

    if (createForm.total_questions > availableQuestions && availableQuestions > 0) {
      setError(`Not enough questions available. You need ${createForm.total_questions} but only ${availableQuestions} are available.`)
      return
    }

    setCreating(true)
    setError('')

    try {
      const payload = {
        ...createForm,
        subject_id: parseInt(createForm.subject_id),
        term_id: parseInt(createForm.term_id),
        session_id: parseInt(createForm.session_id)
      }

      const response = await api.post('/admin/test-codes/bulk', payload)

      // Add new codes to state locally instead of full refresh
      if (response.data.data?.codes) {
        const newCodes = response.data.data.codes.map((codeData: any) => ({
          id: codeData.id,
          code: codeData.code,
          title: createForm.title,
          subject_name: lookupData.subjects?.find(s => s.id === parseInt(createForm.subject_id))?.name || '',
          class_level: createForm.class_level,
          term_name: lookupData.terms?.find(t => t.id === parseInt(createForm.term_id))?.name || '',
          session_name: lookupData.sessions?.find(s => s.id === parseInt(createForm.session_id))?.name || '',
          duration_minutes: createForm.duration_minutes,
          total_questions: createForm.total_questions,
          score_per_question: createForm.score_per_question,
          usage_count: 0,
          is_active: true,
          is_activated: false,
          is_used: false,
          used_at: '',
          used_by: 0,
          created_at: new Date().toISOString(),
          expires_at: createForm.expires_at,
          created_by_name: 'admin',
          batch_id: response.data.data.batch_id,
          test_type: createForm.test_type
        }))

        setTestCodes(prevCodes => [...prevCodes, ...newCodes])
      }

      const message = createForm.count === 1 
        ? 'Test code batch created successfully (1 code)'
        : `Successfully created batch of ${createForm.count} test codes`

      setSuccessMessage(message)
      setShowCreateModal(false)
      setCreateForm({
        title: '',
        subject_id: '',
        class_level: '',
        duration_minutes: 60,
        total_questions: 10,
        score_per_question: 1,
        term_id: '',
        session_id: '',
        expires_at: '',
        count: 1,
        test_type: 'First CA'
      })
      setAvailableQuestions(0)

      // Auto-clear success message
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create test codes')
    } finally {
      setCreating(false)
    }
  }

  // Handle batch activation/deactivation
  const handleToggleBatchActivation = async (batchId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      // Use POST with method override for InfinityFree compatibility
      await api.post(`/admin/test-codes/batch/${batchId}/toggle-activation`, {
        _method: 'PATCH',
        is_activated: newStatus
      })

      // Update state locally instead of full refresh
      setTestCodes(prevCodes => 
        prevCodes.map(code => 
          code.batch_id === batchId 
            ? { ...code, is_activated: newStatus }
            : code
        )
      )

      setSuccessMessage(`Test code batch ${newStatus ? 'activated' : 'deactivated'} successfully`)

      // Auto-clear success message
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to toggle batch activation')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage('Codes copied to clipboard')
    // Clear success message after 2 seconds to avoid UI clutter
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  // Handle batch deletion
  const handleDeleteBatch = (batchId: string) => {
    setBatchToDelete(batchId)
    setShowDeleteModal(true)
  }

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return

    setDeleting(true)
    try {
      // Use POST with method override for InfinityFree compatibility
      await api.post(`/admin/test-codes/batch/${batchToDelete}`, {
        _method: 'DELETE'
      })

      // Remove all codes from this batch locally
      setTestCodes(prevCodes => prevCodes.filter(code => code.batch_id !== batchToDelete))

      // Close modal if currently viewing this batch
      if (selectedBatch && selectedBatch.batchId === batchToDelete) {
        setShowViewModal(false)
        setSelectedBatch(null)
      }

      setSuccessMessage('Test code batch deleted successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete test code batch')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setBatchToDelete(null)
    }
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-lg text-gray-500">
        <div className="flex items-center space-x-3">
          <div className="loading-spinner w-8 h-8"></div>
          Loading test codes...
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Test Code Batch Management</h2>
            <p className="text-gray-600 mt-1">All test codes are organized in batches for better management</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Create Test Code Batch
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: '#ffffff',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Filter by Subject
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none'
              }}
            >
              <option value="">All Subjects</option>
              {lookupData.subjects?.map(subject => (
                <option key={subject.id} value={subject.name}>{subject.name}</option>
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
            }}>
              Filter by Class
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none'
              }}
            >
              <option value="">All Classes</option>
              {lookupData.class_levels?.map(classLevel => (
                <option key={classLevel.id} value={classLevel.name}>{classLevel.name}</option>
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
            }}>
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none'
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'end'
          }}>
            <button
              onClick={(e) => {
                e.preventDefault()
                setSubjectFilter('')
                setClassFilter('')
                setTermFilter('')
                setSessionFilter('')
                setStatusFilter('')
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}
      {successMessage && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {successMessage}
        </div>
      )}

      {/* Test Code Batches */}
      {filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredBatches.map((batch) => (
            <div 
              key={batch.batchId} 
              className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <div className="text-base sm:text-lg font-bold text-blue-600 mb-1">
                    Batch of {batch.codes.length} Codes
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {batch.title}
                  </h3>
                </div>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                  batch.isActivated 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {batch.isActivated ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div><span className="font-medium">Subject:</span> {batch.codes[0].subject_name}</div>
                <div><span className="font-medium">Class:</span> {batch.codes[0].class_level}</div>
                <div><span className="font-medium">Type:</span> {batch.codes[0].test_type === 'examination' ? 'Examination' : 'Test'}</div>
                <div><span className="font-medium">Duration:</span> {batch.codes[0].duration_minutes} minutes</div>
                <div><span className="font-medium">Questions:</span> {batch.codes[0].total_questions}</div>
                {batch.hasUsedCodes && (
                  <div className="text-red-600 font-medium">
                    ⚠️ Some codes in this batch have been used
                  </div>
                )}
              </div>

              {/* Batch Actions */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleToggleBatchActivation(batch.batchId, batch.isActivated)
                  }}
                  disabled={batch.hasUsedCodes && !batch.isActivated}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    batch.hasUsedCodes && !batch.isActivated
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  } ${
                    batch.isActivated 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {batch.isActivated ? 'Deactivate Batch' : 'Activate Batch'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedBatch(batch)
                    setShowViewModal(true)
                  }}
                  className="px-3 py-2 rounded-md border border-blue-600 bg-white text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    const codes = batch.codes.map(c => c.code).join(', ')
                    copyToClipboard(codes)
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Copy size={12} />
                  Copy All
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteBatch(batch.batchId)
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #dc2626',
                    backgroundColor: 'white',
                    color: '#dc2626',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Delete Batch
                </button>
              </div>

              {/* Brief Codes Preview */}
              <div style={{
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Sample codes: {batch.codes.slice(0, 3).map(c => c.code).join(', ')}
                  {batch.codes.length > 3 && ` ... (+${batch.codes.length - 3} more)`}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280'
                }}>
                  Click "View" to see all codes and manage individual codes
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: '#6b7280'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            📝
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '500',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            No test code batches found
          </h3>
          <p style={{
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            {[subjectFilter, classFilter, termFilter, sessionFilter, statusFilter].some(f => f) ? 
              'Try adjusting your filters or create your first test code batch.' :
              'Get started by creating your first test code batch.'
            }
          </p>
          <button
            onClick={(e) => {
              e.preventDefault()
              setShowCreateModal(true)
            }}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6'
            }}
          >
            <Plus size={16} />
            Create Test Code Batch
          </button>
        </div>
      )}

      {/* View Batch Modal */}
      {showViewModal && selectedBatch && (
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
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#1f2937'
                }}>
                  Batch of {selectedBatch.codes.length} Test Codes
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  {selectedBatch.title}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setShowViewModal(false)
                  setSelectedBatch(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* Batch Info */}
            <div style={{
              background: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                fontSize: '14px'
              }}>
                <div><strong>Subject:</strong> {selectedBatch.codes[0].subject_name}</div>
                <div><strong>Class:</strong> {selectedBatch.codes[0].class_level}</div>
                <div><strong>Type:</strong> {selectedBatch.codes[0].test_type === 'examination' ? 'Examination' : 'Test'}</div>
                <div><strong>Duration:</strong> {selectedBatch.codes[0].duration_minutes} minutes</div>
                <div><strong>Questions:</strong> {selectedBatch.codes[0].total_questions}</div>
                <div><strong>Score per Question:</strong> {selectedBatch.codes[0].score_per_question} points</div>
                <div><strong>Questions:</strong> {selectedBatch.codes[0].total_questions}</div>
                <div><strong>Status:</strong> 
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: selectedBatch.isActivated ? '#f0fdf4' : '#fef2f2',
                    color: selectedBatch.isActivated ? '#166534' : '#dc2626'
                  }}>
                    {selectedBatch.isActivated ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Codes */}
            <div style={{
              marginBottom: '20px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#1f2937'
              }}>
                Individual Test Codes
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
                maxHeight: '300px',
                overflow: 'auto',
                padding: '8px'
              }}>
                {selectedBatch.codes.map((code: any) => {
                  // Determine status color based on code state
                  let statusColor = '#10b981' // Green - not used
                  let statusText = 'Available'

                  if (code.status === 'using') {
                    statusColor = '#f59e0b' // Yellow - currently in use
                    statusText = 'In Use'
                  } else if (code.status === 'used') {
                    statusColor = '#ef4444' // Red - used/completed
                    statusText = 'Used'
                  }

                  return (
                    <div
                      key={code.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: statusColor
                          }}></div>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#1f2937'
                          }}>
                            {code.code}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            copyToClipboard(code.code)
                          }}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        <span>Created: {new Date(code.created_at).toLocaleDateString()}</span>
                        <span style={{
                          color: statusColor,
                          fontWeight: '500'
                        }}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  const codes = selectedBatch.codes.map((c: any) => c.code).join(', ')
                  copyToClipboard(codes)
                }}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#3b82f6',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Copy size={14} />
                Copy All Codes
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (confirm(`Are you sure you want to delete this entire batch of ${selectedBatch.codes.length} test codes? This action cannot be undone.`)) {
                    handleDeleteBatch(selectedBatch.batchId)
                  }
                }}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#dc2626',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Delete Batch
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setShowViewModal(false)
                  setSelectedBatch(null)
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
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
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: 'calc(100vh - 32px)',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              paddingBottom: '16px',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: 0,
                color: '#1f2937'
              }}>
                Create Test Code Batch
              </h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#374151'
              }}>
                Subject *
              </label>
              <select
                value={createForm.subject_id}
                onChange={(e) => setCreateForm(prev => ({ ...prev, subject_id: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
                required
              >
                <option value="">Select Subject</option>
                {lookupData.subjects?.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#374151'
              }}>
                Class Level *
              </label>
              <select
                value={createForm.class_level}
                onChange={(e) => setCreateForm(prev => ({ ...prev, class_level: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
                required
              >
                <option value="">Select Class</option>
                {lookupData.class_levels?.map(classLevel => (
                  <option key={classLevel.id} value={classLevel.id}>{classLevel.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#374151'
              }}>
                Term *
              </label>
              <select
                value={createForm.term_id}
                onChange={(e) => setCreateForm(prev => ({ ...prev, term_id: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
                required
              >
                <option value="">Select Term</option>
                {lookupData.terms?.map(term => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#374151'
              }}>
                Session *
              </label>
              <select
                value={createForm.session_id}
                onChange={(e) => setCreateForm(prev => ({ ...prev, session_id: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
                required
              >
                <option value="">Select Session</option>
                {lookupData.sessions?.map(session => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#374151'
              }}>
                Duration (Minutes) *
              </label>
              <input
                type="text"
                value={createForm.duration_minutes}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  if (value === '') {
                    setCreateForm(prev => ({ ...prev, duration_minutes: '' as any }))
                  } else {
                    const num = parseInt(value)
                    setCreateForm(prev => ({ ...prev, duration_minutes: num }))
                  }
                }}
                placeholder="Enter test duration in minutes"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                required
              />
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px'
              }}>
                How long students have to complete the test
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#374151'
              }}>
                Test Type *
              </label>
              <select
                value={createForm.test_type}
                onChange={(e) => setCreateForm(prev => ({ ...prev, test_type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  outline: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '40px'
                }}
                required
              >
                <option value="First CA">First CA</option>
                <option value="Second CA">Second CA</option>
                <option value="Examination">Examination</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#374151'
              }}>
                Number of Questions *
              </label>
              <input
                type="text"
                value={createForm.total_questions}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  if (value === '') {
                    setCreateForm(prev => ({ ...prev, total_questions: '' as any }))
                  } else {
                    const num = parseInt(value)
                    setCreateForm(prev => ({ ...prev, total_questions: num }))
                  }
                }}
                placeholder="Enter number of questions"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                required
              />
              {availableQuestions > 0 && (
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  {availableQuestions} questions available for this combination
                </p>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#374151'
              }}>
                Score per Question *
              </label>
              <input
                type="text"
                value={createForm.score_per_question}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  if (value === '') {
                    setCreateForm(prev => ({ ...prev, score_per_question: '' as any }))
                  } else {
                    const num = parseInt(value)
                    setCreateForm(prev => ({ ...prev, score_per_question: num }))
                  }
                }}
                placeholder="Enter score per question"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                required
              />
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px'
              }}>
                Points awarded for each correct answer
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#374151'
              }}>
                Number of Codes *
              </label>
              <input
                type="text"
                value={createForm.count}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  if (value === '') {
                    setCreateForm(prev => ({ ...prev, count: '' as any }))
                  } else {
                    const num = parseInt(value)
                    setCreateForm(prev => ({ ...prev, count: num }))
                  }
                }}
                placeholder="Enter number of codes"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                required
              />
            </div>

            <div style={{
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'white',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              marginTop: '16px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleCreateCodes()
                  }}
                  disabled={creating || !createForm.subject_id || !createForm.class_level || 
                    !createForm.term_id || !createForm.session_id ||
                    (createForm.total_questions > availableQuestions && availableQuestions > 0)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: creating ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {creating ? 'Creating...' : `Create ${createForm.count} Code${createForm.count > 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setShowCreateModal(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    color: '#374151',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#9ca3af'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }}
                >
                  Cancel
                </button>
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
          setBatchToDelete(null)
        }}
        onConfirm={confirmDeleteBatch}
        title="Delete Test Code Batch"
        message={batchToDelete ? `Are you sure you want to delete this entire batch of test codes? This action cannot be undone.` : ""}
        confirmText="Delete Batch"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
      />
    </div>
  )
}