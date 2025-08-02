import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'
import { 
  Plus, 
  FileText, 
  Clock, 
  BookOpen, 
  Users,
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
  count: number
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

  // Fetch test codes
  const fetchTestCodes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/test-codes', {
        params: { limit: 100 }
      })
      setTestCodes(response.data.data || [])
    } catch (error: any) {
      console.error('Failed to fetch test codes:', error)
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
      console.error('Failed to fetch lookup data:', error)
    }
  }, [])

  // Check available questions
  const checkAvailableQuestions = useCallback(async () => {
    if (!createForm.subject_id || !createForm.class_level) {
      setAvailableQuestions(0)
      return
    }

    try {
      const response = await api.get('/teacher/questions', {
        params: {
          subject_id: createForm.subject_id,
          class_level: createForm.class_level,
          count_only: true
        }
      })
      setAvailableQuestions(response.data.total || 0)
    } catch (error) {
      setAvailableQuestions(0)
    }
  }, [createForm.subject_id, createForm.class_level])

  // Auto-generate title
  const generateTitle = useCallback(() => {
    if (createForm.subject_id && createForm.class_level && createForm.term_id && createForm.session_id) {
      const subject = lookupData.subjects?.find(s => s.id === parseInt(createForm.subject_id))
      const term = lookupData.terms?.find(t => t.id === parseInt(createForm.term_id))
      const session = lookupData.sessions?.find(s => s.id === parseInt(createForm.session_id))
      
      if (subject && term && session) {
        const title = `${subject.name} - ${createForm.class_level} (${term.name} ${session.name})`
        setCreateForm(prev => ({ ...prev, title }))
      }
    }
  }, [createForm.subject_id, createForm.class_level, createForm.term_id, createForm.session_id, lookupData])

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
      const matchesClass = !classFilter || firstCode.class_level.toLowerCase().includes(classFilter.toLowerCase()) 
      const matchesTerm = !termFilter || firstCode.term_name?.toLowerCase().includes(termFilter.toLowerCase())
      const matchesSession = !sessionFilter || firstCode.session_name?.toLowerCase().includes(sessionFilter.toLowerCase())
      
      let matchesStatus = true
      if (statusFilter === 'active') matchesStatus = batch.isActivated
      else if (statusFilter === 'used') matchesStatus = batch.hasUsedCodes
      else if (statusFilter === 'unused') matchesStatus = !batch.hasUsedCodes
      
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

      await api.post('/admin/test-codes/bulk', payload)
      
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
        total_questions: 20,
        term_id: '',
        session_id: '',
        expires_at: '',
        count: 1
      })
      setAvailableQuestions(0)
      // Refresh to get new batch data
      fetchTestCodes()
    } catch (error: any) {
      console.error('Failed to create test codes:', error)
      setError(error.response?.data?.message || 'Failed to create test codes')
    } finally {
      setCreating(false)
    }
  }

  // Handle batch activation/deactivation
  const handleToggleBatchActivation = async (batchId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      await api.patch(`/admin/test-codes/batch/${batchId}/toggle-activation`, {
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
    } catch (error: any) {
      console.error('Failed to toggle batch activation:', error)
      setError(error.response?.data?.message || 'Failed to toggle batch activation')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage('Codes copied to clipboard')
    // Clear success message after 2 seconds to avoid UI clutter
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        Loading test codes...
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
        alignItems: 'flex-start',
        marginBottom: '32px'
      }}>
        <div>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0,
            marginBottom: '8px'
          }}>
            Test Code Batch Management
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            All test codes are organized in batches for better management
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
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
              <option value="used">Used</option>
              <option value="unused">Unused</option>
            </select>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'end'
          }}>
            <button
              onClick={() => {
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {filteredBatches.map((batch) => (
            <div 
              key={batch.batchId} 
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#3b82f6',
                    marginBottom: '4px'
                  }}>
                    Batch of {batch.codes.length} Codes
                  </div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {batch.title}
                  </h3>
                </div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: batch.isActivated ? '#f0fdf4' : '#fef2f2',
                  color: batch.isActivated ? '#166534' : '#dc2626'
                }}>
                  {batch.isActivated ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '16px'
              }}>
                <div><strong>Subject:</strong> {batch.codes[0].subject_name}</div>
                <div><strong>Class:</strong> {batch.codes[0].class_level}</div>
                <div><strong>Duration:</strong> {batch.codes[0].duration_minutes} minutes</div>
                <div><strong>Questions:</strong> {batch.codes[0].total_questions}</div>
                {batch.hasUsedCodes && (
                  <div style={{ color: '#dc2626', fontWeight: '500' }}>
                    ⚠️ Some codes in this batch have been used
                  </div>
                )}
              </div>

              {/* Batch Actions */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <button
                  onClick={() => handleToggleBatchActivation(batch.batchId, batch.isActivated)}
                  disabled={batch.hasUsedCodes && !batch.isActivated}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: batch.hasUsedCodes && !batch.isActivated ? 'not-allowed' : 'pointer',
                    opacity: batch.hasUsedCodes && !batch.isActivated ? 0.5 : 1,
                    background: batch.isActivated ? '#dc2626' : '#16a34a',
                    color: 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {batch.isActivated ? 'Deactivate Batch' : 'Activate Batch'}
                </button>
                <button
                  onClick={() => {
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
              </div>

              {/* Individual Codes Preview */}
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
                  Codes in this batch:
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '4px'
                }}>
                  {batch.codes.map((code) => (
                    <span
                      key={code.id}
                      onClick={() => copyToClipboard(code.code)}
                      style={{
                        padding: '4px 6px',
                        background: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#3b82f6'
                        e.currentTarget.style.color = 'white'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff'
                        e.currentTarget.style.color = 'inherit'
                      }}
                    >
                      {code.code}
                    </span>
                  ))}
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
            onClick={() => setShowCreateModal(true)}
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#1f2937'
            }}>
              Create Test Code Batch
            </h3>

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
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
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
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
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
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
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
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
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
                Number of Codes *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={createForm.count}
                onChange={(e) => setCreateForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
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

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCodes}
                disabled={creating || !createForm.subject_id || !createForm.class_level || 
                  !createForm.term_id || !createForm.session_id ||
                  (createForm.total_questions > availableQuestions && availableQuestions > 0)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: creating ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer'
                }}
              >
                {creating ? 'Creating...' : `Create ${createForm.count} Code${createForm.count > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}