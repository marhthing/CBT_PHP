
import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  FileText, 
  Clock, 
  BookOpen, 
  Users,
  Copy,
  X
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
      setError('Failed to load system data')
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
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading test codes...
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
            Test Code Management
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Create and manage test codes with bulk generation support
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
          Create Test Codes
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            <input
              type="text"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="Enter class level"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
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

      {/* Test Codes Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {filteredCodes.map((code) => (
          <div 
            key={code.id} 
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
                  fontFamily: 'monospace',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#3b82f6',
                  marginBottom: '4px'
                }}>
                  {code.code}
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
                  {code.title}
                </h3>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  ...(code.is_used 
                    ? { background: '#fef2f2', color: '#dc2626' }
                    : code.is_activated 
                      ? { background: '#f0fdf4', color: '#166534' }
                      : { background: '#fef3c7', color: '#d97706' })
                }}>
                  {code.is_used ? 'Used' : code.is_activated ? 'Active' : 'Inactive'}
                </span>
                {code.is_used && (
                  <span style={{
                    fontSize: '11px',
                    color: '#6b7280'
                  }}>
                    {new Date(code.used_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BookOpen size={16} style={{ color: '#3b82f6' }} />
                <span>{code.subject_name} - {code.class_level}</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Clock size={16} style={{ color: '#10b981' }} />
                <span>{code.duration_minutes} min • {code.total_questions} questions</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Users size={16} style={{ color: '#8b5cf6' }} />
                <span>{code.term_name} • {code.session_name}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => copyToClipboard(code.code)}
                style={{
                  flex: 1,
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dbeafe'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff'
                }}
              >
                <Copy size={14} />
                Copy
              </button>
              <button
                onClick={() => handleToggleActivation(code)}
                disabled={code.is_used}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: code.is_used ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  opacity: code.is_used ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  ...(code.is_activated
                    ? { background: '#fef3c7', color: '#d97706' }
                    : { background: '#f0fdf4', color: '#166534' })
                }}
                onMouseEnter={(e) => {
                  if (!code.is_used) {
                    e.currentTarget.style.backgroundColor = code.is_activated ? '#fde68a' : '#dcfce7'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!code.is_used) {
                    e.currentTarget.style.backgroundColor = code.is_activated ? '#fef3c7' : '#f0fdf4'
                  }
                }}
              >
                {code.is_activated ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={() => handleDeleteCode(code)}
                disabled={code.is_used}
                style={{
                  padding: '8px 12px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: code.is_used ? 'not-allowed' : 'pointer',
                  opacity: code.is_used ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!code.is_used) {
                    e.currentTarget.style.backgroundColor = '#fee2e2'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!code.is_used) {
                    e.currentTarget.style.backgroundColor = '#fef2f2'
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCodes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <FileText size={64} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: '500',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            No Test Codes Found
          </h3>
          <p style={{
            color: '#6b7280',
            margin: 0
          }}>
            Create your first test codes to get started
          </p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 50
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0
                }}>
                  Create Test Codes
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#374151'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Test Title
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder="e.g., Mathematics Mid-Term Exam"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Subject
                  </label>
                  <select
                    value={createForm.subject_id}
                    onChange={(e) => setCreateForm({...createForm, subject_id: e.target.value})}
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
                    marginBottom: '6px'
                  }}>
                    Class Level
                  </label>
                  <input
                    type="text"
                    value={createForm.class_level}
                    onChange={(e) => setCreateForm({...createForm, class_level: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    placeholder="e.g., SS1, JSS2"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Term
                  </label>
                  <select
                    value={createForm.term_id}
                    onChange={(e) => setCreateForm({...createForm, term_id: e.target.value})}
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
                    marginBottom: '6px'
                  }}>
                    Session
                  </label>
                  <select
                    value={createForm.session_id}
                    onChange={(e) => setCreateForm({...createForm, session_id: e.target.value})}
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
                    <option value="">Select Session</option>
                    {lookupData.sessions?.map(session => (
                      <option key={session.id} value={session.id}>{session.name}</option>
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
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={createForm.duration_minutes}
                    onChange={(e) => setCreateForm({...createForm, duration_minutes: parseInt(e.target.value) || 60})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    min="1"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Total Questions
                    {availableQuestions > 0 && (
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginLeft: '8px'
                      }}>
                        ({availableQuestions} available)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={createForm.total_questions}
                    onChange={(e) => setCreateForm({...createForm, total_questions: parseInt(e.target.value) || 20})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    min="1"
                    max={availableQuestions}
                  />
                  {createForm.total_questions > availableQuestions && availableQuestions > 0 && (
                    <p style={{
                      color: '#dc2626',
                      fontSize: '12px',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>
                      Not enough questions available
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Number of Codes
                  </label>
                  <input
                    type="number"
                    value={createForm.count}
                    onChange={(e) => setCreateForm({...createForm, count: parseInt(e.target.value) || 1})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    min="1"
                    max="100"
                  />
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '4px',
                    margin: '4px 0 0 0'
                  }}>
                    {createForm.count > 1 ? `Create ${createForm.count} test codes at once` : 'Create a single test code'}
                  </p>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    Expires At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.expires_at}
                    onChange={(e) => setCreateForm({...createForm, expires_at: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px'
              }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 16px',
                    color: '#374151',
                    background: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCodes}
                  disabled={creating || createForm.total_questions > availableQuestions}
                  style={{
                    padding: '10px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: creating || createForm.total_questions > availableQuestions ? 'not-allowed' : 'pointer',
                    opacity: creating || createForm.total_questions > availableQuestions ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!creating && createForm.total_questions <= availableQuestions) {
                      e.currentTarget.style.backgroundColor = '#2563eb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!creating && createForm.total_questions <= availableQuestions) {
                      e.currentTarget.style.backgroundColor = '#3b82f6'
                    }
                  }}
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
