import { useState, useEffect, useCallback, useMemo } from 'react'
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

export default function OptimizedTestCodeManager() {
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

  // Memoized fetch functions for performance
  const fetchTestCodes = useCallback(async () => {
    try {
      const response = await api.get('/admin/test-codes?limit=100')
      setTestCodes(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch test codes:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLookupData = useCallback(async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || response.data || {})
    } catch (error: any) {
      console.error('Failed to fetch lookup data:', error)
      setError('Failed to load dropdown data. Please refresh the page.')
    }
  }, [])

  useEffect(() => {
    // Load data in parallel for better performance
    Promise.all([
      fetchTestCodes(),
      fetchLookupData()
    ])
  }, [fetchTestCodes, fetchLookupData])

  const createTestCode = useCallback(async () => {
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
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to create test code:', error)
      setError('Failed to create test code: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreating(false)
    }
  }, [createForm, fetchTestCodes])

  const toggleActivation = useCallback(async (testCodeId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/test-codes/${testCodeId}/toggle-activation`, {
        is_activated: !currentStatus
      })
      await fetchTestCodes()
    } catch (error: any) {
      console.error('Failed to toggle activation:', error)
      setError('Failed to toggle activation: ' + (error.response?.data?.message || error.message))
    }
  }, [fetchTestCodes])

  const deleteTestCode = useCallback(async (testCodeId: number) => {
    if (!confirm('Are you sure you want to delete this test code?')) return
    
    try {
      await api.delete(`/admin/test-codes/${testCodeId}`)
      await fetchTestCodes()
      setSuccessMessage('Test code deleted successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Failed to delete test code:', error)
      setError('Failed to delete test code: ' + (error.response?.data?.message || error.message))
    }
  }, [fetchTestCodes])

  // Memoized filtered test codes for performance
  const filteredTestCodes = useMemo(() => {
    return testCodes.filter(testCode => {
      if (subjectFilter && testCode.subject_name !== subjectFilter) return false
      if (classFilter && testCode.class_level !== classFilter) return false
      if (termFilter && testCode.term_name !== termFilter) return false
      if (sessionFilter && testCode.session_name !== sessionFilter) return false
      if (statusFilter === 'active' && !testCode.is_activated) return false
      if (statusFilter === 'inactive' && testCode.is_activated) return false
      return true
    })
  }, [testCodes, subjectFilter, classFilter, termFilter, sessionFilter, statusFilter])

  // Memoized stats for performance
  const stats = useMemo(() => {
    const total = testCodes.length
    const active = testCodes.filter(tc => tc.is_activated).length
    const inactive = total - active
    const totalUsage = testCodes.reduce((sum, tc) => sum + tc.usage_count, 0)
    
    return { total, active, inactive, totalUsage }
  }, [testCodes])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  const clearFilters = useCallback(() => {
    setSubjectFilter('')
    setClassFilter('')
    setTermFilter('')
    setSessionFilter('')
    setStatusFilter('')
  }, [])

  const classLevels = useMemo(() => ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'], [])

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
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #6366f1',
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
      {/* Success Message */}
      {successMessage && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}

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
            margin: '0 0 8px 0'
          }}>
            Test Code Manager
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0
          }}>
            Create and manage test codes for online examinations
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(99, 102, 241, 0.25)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.transform = 'translateY(-2px)'
            target.style.boxShadow = '0 6px 12px rgba(99, 102, 241, 0.35)'
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement
            target.style.transform = 'translateY(0)'
            target.style.boxShadow = '0 4px 6px rgba(99, 102, 241, 0.25)'
          }}
        >
          + Create Test Code
        </button>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[
          { label: 'Total Test Codes', value: stats.total, color: '#6366f1' },
          { label: 'Active Codes', value: stats.active, color: '#10b981' },
          { label: 'Inactive Codes', value: stats.inactive, color: '#64748b' },
          { label: 'Total Usage', value: stats.totalUsage, color: '#8b5cf6' }
        ].map((stat) => (
          <div
            key={stat.label}
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
              target.style.transform = 'translateY(-2px)'
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLDivElement
              target.style.transform = 'translateY(0)'
              target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: stat.color,
              margin: '0 0 8px 0'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '500'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={clearFilters}
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
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.background = '#f1f5f9'
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
              const target = e.currentTarget as HTMLDivElement
              target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
              target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLDivElement
              target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
              target.style.transform = 'translateY(0)'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 4px 0'
                }}>
                  {testCode.title}
                </h4>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6366f1',
                  fontFamily: 'monospace',
                  background: '#f0f4ff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {testCode.code}
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  background: testCode.is_activated ? '#dcfce7' : '#fef3c7',
                  color: testCode.is_activated ? '#059669' : '#d97706',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {testCode.is_activated ? 'Active' : 'Inactive'}
                </div>
                
                <button
                  onClick={() => deleteTestCode(testCode.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dc2626',
                    padding: '4px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.background = '#fef2f2'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement
                    target.style.background = 'transparent'
                  }}
                  title="Delete Test Code"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  Subject
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {testCode.subject_name}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  Class
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {testCode.class_level}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  Duration
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {testCode.duration_minutes} mins
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}>
                  Questions
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {testCode.question_count}
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: '500'
                }}>
                  Usage Count
                </span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#6366f1'
                }}>
                  {testCode.usage_count}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => toggleActivation(testCode.id, testCode.is_activated)}
                style={{
                  flex: 1,
                  background: testCode.is_activated 
                    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement
                  target.style.transform = 'scale(1)'
                }}
              >
                {testCode.is_activated ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9',
              fontSize: '11px',
              color: '#64748b'
            }}>
              <div>
                Created {formatDate(testCode.created_at)}
              </div>
              <div>
                Expires {formatDateTime(testCode.expires_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTestCodes.length === 0 && !loading && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>📝</div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 8px 0'
          }}>
            No test codes found
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0 0 24px 0'
          }}>
            {(subjectFilter || classFilter || statusFilter) 
              ? 'Try adjusting your filters or create a new test code.'
              : 'Get started by creating your first test code.'
            }
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Create Test Code
          </button>
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
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
                Title *
              </label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                placeholder="e.g., Mathematics Mid-Term Exam"
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
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={createForm.duration_minutes}
                  onChange={(e) => setCreateForm({...createForm, duration_minutes: parseInt(e.target.value)})}
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
                  Number of Questions *
                </label>
                <input
                  type="number"
                  value={createForm.question_count}
                  onChange={(e) => setCreateForm({...createForm, question_count: parseInt(e.target.value)})}
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Expires At *
              </label>
              <input
                type="datetime-local"
                value={createForm.expires_at}
                onChange={(e) => setCreateForm({...createForm, expires_at: e.target.value})}
                min={new Date().toISOString().slice(0, 16)}
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
              justifyContent: 'flex-end',
              marginTop: '24px'
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
                  opacity: creating ? 0.8 : 1
                }}
              >
                {creating ? 'Creating...' : 'Create Test Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}