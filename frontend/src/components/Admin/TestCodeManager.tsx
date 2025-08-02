import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'

interface TestCode {
  id: number
  code: string
  title: string
  subject_name: string
  class_level: string
  duration_minutes: number
  question_count: number
  is_active: boolean
  is_activated: boolean
  created_at: string
  expires_at: string
  usage_count: number
  created_by_name: string
  term_name?: string
  session_name?: string
}

interface LookupData {
  subjects?: Array<{id: number, name: string}>
  terms?: Array<{id: number, name: string}>
  sessions?: Array<{id: number, name: string}>
  class_levels?: Array<{id: string, name: string}>
}

interface CreateTestCodeForm {
  title: string
  subject_id: string
  class_level: string
  duration_minutes: number
  question_count: number
  term_id: string
  session_id: string
  expires_at: string
}

export default function TestCodeManager() {
  const [testCodes, setTestCodes] = useState<TestCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [lookupData, setLookupData] = useState<LookupData>({})
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Filters
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [termFilter, setTermFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Create form
  const [createForm, setCreateForm] = useState<CreateTestCodeForm>({
    title: '',
    subject_id: '',
    class_level: '',
    duration_minutes: 60,
    question_count: 20,
    term_id: '',
    session_id: '',
    expires_at: ''
  })

  useEffect(() => {
    fetchTestCodes()
    fetchLookupData()
  }, [])

  const fetchTestCodes = async () => {
    try {
      const response = await api.get('/admin/test-codes?limit=100')
      setTestCodes(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch test codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLookupData = async () => {
    try {
      console.log('Fetching lookup data...')
      const response = await api.get('/system/lookup')
      console.log('Lookup response:', response.data)
      setLookupData(response.data.data || response.data || {})
    } catch (error: any) {
      console.error('Failed to fetch lookup data:', error)
      console.error('Lookup error response:', error.response?.data)
      setError('Failed to load dropdown data. Please refresh the page.')
    }
  }

  const createTestCode = async () => {
    if (!createForm.title || !createForm.subject_id || !createForm.class_level || !createForm.expires_at) {
      setError('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      // Transform the form data to match backend expectations
      const requestData = {
        ...createForm,
        total_questions: createForm.question_count  // Backend expects total_questions
      }
      delete (requestData as any).question_count  // Remove the frontend field name
      
      const response = await api.post('/admin/test-codes', requestData)
      if (response.data.success) {
        await fetchTestCodes()
        setShowCreateModal(false)
        setCreateForm({
          title: '',
          subject_id: '',
          class_level: '',
          duration_minutes: 60,
          question_count: 20,
          term_id: '',
          session_id: '',
          expires_at: ''
        })
        setSuccessMessage('Test code created successfully!')
      }
    } catch (error: any) {
      console.error('Failed to create test code:', error)
      setError('Failed to create test code: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreating(false)
    }
  }

  const toggleActivation = async (testCodeId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/test-codes/${testCodeId}/toggle-activation`, {
        is_activated: !currentStatus
      })
      await fetchTestCodes()
    } catch (error: any) {
      console.error('Failed to toggle activation:', error)
      setError('Failed to toggle activation: ' + (error.response?.data?.message || error.message))
    }
  }

  const deleteTestCode = async (testCodeId: number) => {
    try {
      await api.delete(`/admin/test-codes/${testCodeId}`)
      await fetchTestCodes()
      setSuccessMessage('Test code deleted successfully!')
    } catch (error: any) {
      console.error('Failed to delete test code:', error)
      setError('Failed to delete test code: ' + (error.response?.data?.message || error.message))
    }
  }

  // Filter test codes
  const filteredTestCodes = testCodes.filter(testCode => {
    if (subjectFilter && testCode.subject_name !== subjectFilter) return false
    if (classFilter && testCode.class_level !== classFilter) return false
    if (statusFilter && testCode.is_activated.toString() !== statusFilter) return false
    return true
  })

  const classLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDefaultExpiryDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 30) // 30 days from now
    return date.toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0',
            marginBottom: '4px'
          }}>
            Test Code Management
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0'
          }}>
            Create and manage test codes for examinations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(99, 102, 241, 0.25)'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.transform = 'translateY(-1px)'
            target.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)'
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.transform = 'translateY(0)'
            target.style.boxShadow = '0 4px 6px rgba(99, 102, 241, 0.25)'
          }}
        >
          <span style={{ fontSize: '16px' }}>+</span>
          Create Test Code
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          margin: '0 0 16px 0'
        }}>
          Filter Test Codes
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">All Subjects</option>
            {lookupData.subjects?.map((subject) => (
              <option key={subject.id} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">All Classes</option>
            {classLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">All Terms</option>
            {lookupData.terms?.map((term) => (
              <option key={term.id} value={term.name}>
                {term.name}
              </option>
            ))}
          </select>

          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">All Sessions</option>
            {lookupData.sessions?.map((session) => (
              <option key={session.id} value={session.name}>
                {session.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSubjectFilter('')
              setClassFilter('')
              setTermFilter('')
              setSessionFilter('')
              setStatusFilter('')
            }}
            style={{
              background: '#f1f5f9',
              border: '2px solid #e2e8f0',
              color: '#64748b',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.background = '#e2e8f0'
              target.style.borderColor = '#cbd5e1'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.background = '#f1f5f9'
              target.style.borderColor = '#e2e8f0'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Test Codes Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '16px'
      }}>
        {filteredTestCodes.map((testCode) => (
          <div
            key={testCode.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLDivElement
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLDivElement
              target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
              target.style.transform = 'translateY(0)'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 4px 0'
                }}>
                  {testCode.code}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '0'
                }}>
                  {testCode.title}
                </p>
              </div>
              <span style={{
                background: testCode.is_activated ? '#dcfce7' : '#fef3c7',
                color: testCode.is_activated ? '#166534' : '#92400e',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {testCode.is_activated ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            {/* Details */}
            <div style={{
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '13px',
                color: '#64748b'
              }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Subject:</span><br />
                  {testCode.subject_name}
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Class:</span><br />
                  {testCode.class_level}
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Duration:</span><br />
                  {testCode.duration_minutes} minutes
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Questions:</span><br />
                  {testCode.question_count}
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Created:</span><br />
                  {formatDate(testCode.created_at)}
                </div>
                <div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Expires:</span><br />
                  {formatDate(testCode.expires_at)}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px'
              }}>
                <span style={{ color: '#64748b' }}>
                  Used <strong style={{ color: '#374151' }}>{testCode.usage_count}</strong> times
                </span>
                <span style={{ color: '#64748b' }}>
                  By: <strong style={{ color: '#374151' }}>{testCode.created_by_name}</strong>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => toggleActivation(testCode.id, testCode.is_activated)}
                style={{
                  background: testCode.is_activated ? '#dc2626' : '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.transform = 'translateY(-1px)'
                  target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.transform = 'translateY(0)'
                  target.style.boxShadow = 'none'
                }}
              >
                {testCode.is_activated ? 'Deactivate' : 'Activate'}
              </button>
              
              {testCode.usage_count === 0 && (
                <button
                  onClick={() => deleteTestCode(testCode.id)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.transform = 'translateY(-1px)'
                    target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.transform = 'translateY(0)'
                    target.style.boxShadow = 'none'
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTestCodes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 8px 0'
          }}>
            No Test Codes Found
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0'
          }}>
            {testCodes.length === 0 ? 
              "Create your first test code to get started." :
              "No test codes match your current filters."
            }
          </p>
        </div>
      )}

      {/* Create Test Code Modal */}
      {showCreateModal && (
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
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 16px 0'
            }}>
              Create New Test Code
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Test Title *
              </label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                placeholder="Enter test title"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Subject *
                </label>
                <select
                  value={createForm.subject_id}
                  onChange={(e) => setCreateForm({...createForm, subject_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Select Subject</option>
                  {lookupData.subjects?.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Class Level *
                </label>
                <select
                  value={createForm.class_level}
                  onChange={(e) => setCreateForm({...createForm, class_level: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Select Class</option>
                  {classLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={createForm.duration_minutes}
                  onChange={(e) => setCreateForm({...createForm, duration_minutes: parseInt(e.target.value) || 0})}
                  min="1"
                  max="300"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Questions Count
                </label>
                <input
                  type="number"
                  value={createForm.question_count}
                  onChange={(e) => setCreateForm({...createForm, question_count: parseInt(e.target.value) || 0})}
                  min="1"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
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
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Select Term</option>
                  {lookupData.terms?.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
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
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Select Session</option>
                  {lookupData.sessions?.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Expiry Date *
              </label>
              <input
                type="date"
                value={createForm.expires_at || getDefaultExpiryDate()}
                onChange={(e) => setCreateForm({...createForm, expires_at: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Modal Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                style={{
                  background: '#f1f5f9',
                  border: '2px solid #e2e8f0',
                  color: '#64748b',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={createTestCode}
                disabled={creating}
                style={{
                  background: creating ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {creating ? 'Creating...' : 'Create Test Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Notifications */}
      {error && (
        <ErrorNotification
          message={error}
          onClose={() => setError('')}
          type="error"
        />
      )}
      
      {successMessage && (
        <ErrorNotification
          message={successMessage}
          onClose={() => setSuccessMessage('')}
          type="success"
        />
      )}
    </div>
  )
}