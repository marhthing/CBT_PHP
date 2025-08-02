import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import ErrorNotification from '../ui/ErrorNotification'
import { FileText, PlayCircle, PauseCircle, Plus, X, Save, Trash2, Clock, BookOpen, Users } from 'lucide-react'

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
  subject_id: string
  class_level: string
  duration_minutes: number
  total_questions: number
  term_id: string
  session_id: string
  expires_at: string
  code_count: number
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
    subject_id: '',
    class_level: '',
    duration_minutes: 60,
    total_questions: 20,
    term_id: '',
    session_id: '',
    expires_at: '',
    code_count: 1
  })

  // Bulk actions
  const [selectedCodes, setSelectedCodes] = useState<number[]>([])
  const [bulkActivating, setBulkActivating] = useState(false)

  // Memoized fetch functions for performance
  const fetchTestCodes = useCallback(async () => {
    try {
      const response = await api.get('/admin/test-codes?limit=100')
      setTestCodes(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch test codes:', error)
      setError('Failed to load test codes')
    } finally {
      setLoading(false)
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

  // Load data on mount
  useEffect(() => {
    Promise.all([
      fetchTestCodes(),
      fetchLookupData()
    ])
  }, [fetchTestCodes, fetchLookupData])

  const createTestCode = useCallback(async () => {
    if (!createForm.subject_id || !createForm.class_level || !createForm.term_id || !createForm.session_id) {
      setError('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      // Generate title based on subject-term-session
      const subject = lookupData.subjects?.find(s => s.id === parseInt(createForm.subject_id))
      const term = lookupData.terms?.find(t => t.id === parseInt(createForm.term_id))
      const session = lookupData.sessions?.find(s => s.id === parseInt(createForm.session_id))
      
      const title = `${subject?.name || 'Unknown'} - ${term?.name || 'Unknown'} - ${session?.name || 'Unknown'}`

      // Create multiple codes if specified
      const promises = []
      for (let i = 0; i < createForm.code_count; i++) {
        const codeData = {
          ...createForm,
          title: createForm.code_count > 1 ? `${title} (${i + 1})` : title
        }
        promises.push(api.post('/admin/test-codes', codeData))
      }

      await Promise.all(promises)
      await fetchTestCodes()
      setShowCreateModal(false)
      setCreateForm({
        subject_id: '',
        class_level: '',
        duration_minutes: 60,
        total_questions: 20,
        term_id: '',
        session_id: '',
        expires_at: '',
        code_count: 1
      })
      setSuccessMessage(`${createForm.code_count} test code(s) created successfully!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Failed to create test code:', error)
      setError('Failed to create test code: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreating(false)
    }
  }, [createForm, fetchTestCodes, lookupData])

  const toggleActivation = useCallback(async (testCodeId: number, isActivated: boolean) => {
    try {
      await api.patch(`/admin/test-codes/${testCodeId}/toggle-activation`, {
        is_activated: !isActivated
      })
      await fetchTestCodes()
      setSuccessMessage(`Test code ${!isActivated ? 'activated' : 'deactivated'} successfully!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Failed to toggle activation:', error)
      setError('Failed to toggle activation: ' + (error.response?.data?.message || error.message))
    }
  }, [fetchTestCodes])

  const deleteTestCode = useCallback(async (testCodeId: number) => {
    if (!confirm('Are you sure you want to delete this test code?')) return
    
    try {
      const response = await api.delete(`/admin/test-codes/${testCodeId}`)
      if (response.data.success) {
        await fetchTestCodes()
        setSuccessMessage('Test code deleted successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to delete test code:', error)
      setError('Failed to delete test code: ' + (error.response?.data?.message || error.message))
    }
  }, [fetchTestCodes])

  const bulkActivateTestCodes = useCallback(async (activate: boolean) => {
    if (selectedCodes.length === 0) {
      setError('Please select test codes to activate/deactivate')
      return
    }

    setBulkActivating(true)
    try {
      const promises = selectedCodes.map(codeId => 
        api.patch(`/admin/test-codes/${codeId}/toggle-activation`, {
          is_activated: activate
        })
      )
      
      await Promise.all(promises)
      await fetchTestCodes()
      setSelectedCodes([])
      setSuccessMessage(`${selectedCodes.length} test codes ${activate ? 'activated' : 'deactivated'} successfully!`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Failed to bulk activate:', error)
      setError('Failed to bulk activate: ' + (error.response?.data?.message || error.message))
    } finally {
      setBulkActivating(false)
    }
  }, [selectedCodes, fetchTestCodes])

  const toggleCodeSelection = useCallback((codeId: number) => {
    setSelectedCodes(prev => 
      prev.includes(codeId) 
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    )
  }, [])

  const selectAllFilteredCodes = useCallback(() => {
    const filteredIds = filteredTestCodes.map(tc => tc.id)
    setSelectedCodes(prev => 
      prev.length === filteredIds.length ? [] : filteredIds
    )
  }, [filteredTestCodes])

  // Memoized filtered test codes for performance
  const filteredTestCodes = useMemo(() => {
    return testCodes.filter(testCode => {
      const matchesSubject = !subjectFilter || testCode.subject_name === subjectFilter
      const matchesClass = !classFilter || testCode.class_level === classFilter
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && testCode.is_activated) ||
        (statusFilter === 'inactive' && !testCode.is_activated)
      
      return matchesSubject && matchesClass && matchesStatus
    })
  }, [testCodes, subjectFilter, classFilter, statusFilter])

  // Memoized stats for performance
  const testCodeStats = useMemo(() => {
    const activeCount = testCodes.filter(tc => tc.is_activated).length
    const totalUsage = testCodes.reduce((sum, tc) => sum + tc.usage_count, 0)
    
    return {
      totalTestCodes: testCodes.length,
      activeTestCodes: activeCount,
      inactiveTestCodes: testCodes.length - activeCount,
      totalUsage
    }
  }, [testCodes])

  const statsCards = useMemo(() => [
    {
      title: 'Total Test Codes',
      value: testCodeStats.totalTestCodes,
      icon: FileText,
      color: '#6366f1'
    },
    {
      title: 'Active Tests',
      value: testCodeStats.activeTestCodes,
      icon: PlayCircle,
      color: '#10b981'
    },
    {
      title: 'Inactive Tests',
      value: testCodeStats.inactiveTestCodes,
      icon: PauseCircle,
      color: '#6b7280'
    },
    {
      title: 'Total Usage',
      value: testCodeStats.totalUsage,
      icon: Users,
      color: '#f59e0b'
    }
  ], [testCodeStats])

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
            borderTop: '2px solid #6366f1',
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
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0,
            marginBottom: '8px'
          }}>
            Test Code Manager
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Create and manage test codes for assessments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={16} />
          Create Test Code
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && <ErrorNotification message={error} onClose={() => setError('')} />}
      
      {successMessage && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px',
          color: '#16a34a'
        }}>
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {statsCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: card.color,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <IconComponent size={24} />
              </div>
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: card.color,
                  marginBottom: '4px'
                }}>
                  {card.value}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  {card.title}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              minWidth: '150px'
            }}
          >
            <option value="" style={{ color: '#1f2937' }}>All Subjects</option>
            {(lookupData.subjects || []).map(subject => (
              <option key={subject.id} value={subject.name} style={{ color: '#1f2937' }}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              minWidth: '120px'
            }}
          >
            <option value="" style={{ color: '#1f2937' }}>All Classes</option>
            <option value="JSS1" style={{ color: '#1f2937' }}>JSS 1</option>
            <option value="JSS2" style={{ color: '#1f2937' }}>JSS 2</option>
            <option value="JSS3" style={{ color: '#1f2937' }}>JSS 3</option>
            <option value="SS1" style={{ color: '#1f2937' }}>SS 1</option>
            <option value="SS2" style={{ color: '#1f2937' }}>SS 2</option>
            <option value="SS3" style={{ color: '#1f2937' }}>SS 3</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              minWidth: '120px'
            }}
          >
            <option value="" style={{ color: '#1f2937' }}>All Status</option>
            <option value="active" style={{ color: '#1f2937' }}>Active</option>
            <option value="inactive" style={{ color: '#1f2937' }}>Inactive</option>
          </select>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <button
            onClick={selectAllFilteredCodes}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {selectedCodes.length === filteredTestCodes.length && filteredTestCodes.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          {selectedCodes.length > 0 && (
            <>
              <button
                onClick={() => bulkActivateTestCodes(true)}
                disabled={bulkActivating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: bulkActivating ? 'not-allowed' : 'pointer'
                }}
              >
                <PlayCircle size={16} />
                Activate {selectedCodes.length}
              </button>
              <button
                onClick={() => bulkActivateTestCodes(false)}
                disabled={bulkActivating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: bulkActivating ? 'not-allowed' : 'pointer'
                }}
              >
                <PauseCircle size={16} />
                Deactivate {selectedCodes.length}
              </button>
            </>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <Plus size={16} />
          Create Test Code
        </button>
      </div>

      {/* Test Codes Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {filteredTestCodes.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            color: '#6b7280'
          }}>
            <FileText size={64} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              No test codes found
            </h3>
            <p style={{ margin: 0 }}>
              {subjectFilter || classFilter || statusFilter
                ? 'Try adjusting your filters'
                : 'No test codes have been created yet'
              }
            </p>
          </div>
        ) : (
          filteredTestCodes.map((testCode) => (
            <div
              key={testCode.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: selectedCodes.includes(testCode.id) 
                  ? '2px solid #3b82f6' 
                  : testCode.is_activated 
                    ? '2px solid #10b981' 
                    : '2px solid #e5e7eb',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={selectedCodes.includes(testCode.id)}
                  onChange={() => toggleCodeSelection(testCode.id)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
                marginLeft: '32px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#6366f1',
                      background: '#f0f9ff',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      {testCode.code}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: testCode.is_activated ? '#16a34a' : '#6b7280',
                      background: testCode.is_activated ? '#dcfce7' : '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {testCode.is_activated ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 8px 0',
                    lineHeight: '1.4'
                  }}>
                    {testCode.title}
                  </h4>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => toggleActivation(testCode.id, testCode.is_activated)}
                    style={{
                      padding: '8px',
                      background: testCode.is_activated ? '#f59e0b' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {testCode.is_activated ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                  </button>
                  <button
                    onClick={() => deleteTestCode(testCode.id)}
                    style={{
                      padding: '8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <BookOpen size={16} style={{ color: '#8b5cf6' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {testCode.subject_name}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Users size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {testCode.class_level}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock size={16} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {testCode.duration_minutes} mins
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FileText size={16} style={{ color: '#6366f1' }} />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {testCode.question_count} questions
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb',
                fontSize: '12px',
                color: '#9ca3af'
              }}>
                <span>Used {testCode.usage_count} times</span>
                <span>
                  Created {new Date(testCode.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                Create New Test Code
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Test name will be automatically generated as: Subject - Term - Session
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Subject
                  </label>
                  <select
                    value={createForm.subject_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, subject_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select Subject</option>
                    {(lookupData.subjects || []).map(subject => (
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
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Class Level
                  </label>
                  <select
                    value={createForm.class_level}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, class_level: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select Class</option>
                    <option value="JSS1">JSS 1</option>
                    <option value="JSS2">JSS 2</option>
                    <option value="JSS3">JSS 3</option>
                    <option value="SS1">SS 1</option>
                    <option value="SS2">SS 2</option>
                    <option value="SS3">SS 3</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={createForm.duration_minutes}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={createForm.total_questions}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, total_questions: parseInt(e.target.value) || 20 }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Term
                  </label>
                  <select
                    value={createForm.term_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, term_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select Term</option>
                    {(lookupData.terms || []).map(term => (
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
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Session
                  </label>
                  <select
                    value={createForm.session_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, session_id: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select Session</option>
                    {(lookupData.sessions || []).map(session => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Number of Codes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={createForm.code_count}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, code_count: parseInt(e.target.value) || 1 }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.expires_at}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, expires_at: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '8px'
              }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '12px 20px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createTestCode}
                  disabled={creating}
                  style={{
                    padding: '12px 20px',
                    background: creating ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {creating ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Create Test Code{createForm.code_count > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}