import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'

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
}

interface FilterOptions {
  subject_id: string
  class_level: string
  term_id: string
  session_id: string
  is_active: string
  is_activated: string
}

export default function TestCodeManager() {
  const { user } = useAuth()
  const [testCodes, setTestCodes] = useState<TestCode[]>([])
  const [filteredTestCodes, setFilteredTestCodes] = useState<TestCode[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    subject_id: '',
    class_level: '',
    term_id: '',
    session_id: '',
    is_active: '',
    is_activated: ''
  })
  const [lookupData, setLookupData] = useState<any>({})
  const [selectedCodes, setSelectedCodes] = useState<number[]>([])

  useEffect(() => {
    fetchTestCodes()
    fetchLookupData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [testCodes, filters])

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
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || {})
    } catch (error) {
      console.error('Failed to fetch lookup data:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...testCodes]

    if (filters.subject_id) {
      filtered = filtered.filter(tc => tc.subject_name === filters.subject_id)
    }
    if (filters.class_level) {
      filtered = filtered.filter(tc => tc.class_level === filters.class_level)
    }
    if (filters.is_active) {
      filtered = filtered.filter(tc => tc.is_active.toString() === filters.is_active)
    }
    if (filters.is_activated) {
      filtered = filtered.filter(tc => tc.is_activated.toString() === filters.is_activated)
    }

    setFilteredTestCodes(filtered)
  }

  const resetFilters = () => {
    setFilters({
      subject_id: '',
      class_level: '',
      term_id: '',
      session_id: '',
      is_active: '',
      is_activated: ''
    })
  }

  const toggleTestCodeActivation = async (testCodeId: number, isActivated: boolean) => {
    try {
      await api.patch(`/admin/test-codes/${testCodeId}/toggle-activation`, {
        is_activated: !isActivated
      })
      
      // Update the local state
      setTestCodes(prev => prev.map(tc => 
        tc.id === testCodeId ? { ...tc, is_activated: !isActivated } : tc
      ))
    } catch (error) {
      console.error('Failed to toggle test code activation:', error)
    }
  }

  const batchToggleActivation = async (activate: boolean) => {
    if (selectedCodes.length === 0) return

    try {
      await Promise.all(
        selectedCodes.map(id => 
          api.patch(`/admin/test-codes/${id}/toggle-activation`, {
            is_activated: activate
          })
        )
      )
      
      // Update local state
      setTestCodes(prev => prev.map(tc => 
        selectedCodes.includes(tc.id) ? { ...tc, is_activated: activate } : tc
      ))
      
      setSelectedCodes([])
    } catch (error) {
      console.error('Failed to batch toggle activation:', error)
    }
  }

  const toggleSelection = (id: number) => {
    setSelectedCodes(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedCodes.length === filteredTestCodes.length) {
      setSelectedCodes([])
    } else {
      setSelectedCodes(filteredTestCodes.map(tc => tc.id))
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        color: '#64748b'
      }}>
        Loading test codes...
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '100%',
      margin: '0 auto',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        padding: '20px 16px',
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          margin: '0 0 4px 0'
        }}>
          Test Code Manager
        </h1>
        <p style={{ 
          fontSize: '14px', 
          opacity: 0.9,
          margin: '0'
        }}>
          Manage and activate test codes for exams
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Subject
            </label>
            <select
              value={filters.subject_id}
              onChange={(e) => setFilters(prev => ({ ...prev, subject_id: e.target.value }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="">All Subjects</option>
              {lookupData.subjects?.map((subject: any) => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Class
            </label>
            <select
              value={filters.class_level}
              onChange={(e) => setFilters(prev => ({ ...prev, class_level: e.target.value }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="">All Classes</option>
              <option value="JSS1">JSS1</option>
              <option value="JSS2">JSS2</option>
              <option value="JSS3">JSS3</option>
              <option value="SS1">SS1</option>
              <option value="SS2">SS2</option>
              <option value="SS3">SS3</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Status
            </label>
            <select
              value={filters.is_activated}
              onChange={(e) => setFilters(prev => ({ ...prev, is_activated: e.target.value }))}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '2px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={resetFilters}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedCodes.length > 0 && (
        <div style={{
          background: '#dbeafe',
          border: '1px solid #93c5fd',
          color: '#1e40af',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>
            {selectedCodes.length} test code(s) selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => batchToggleActivation(true)}
              style={{
                background: '#059669',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Activate All
            </button>
            <button
              onClick={() => batchToggleActivation(false)}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Deactivate All
            </button>
          </div>
        </div>
      )}

      {/* Test Codes List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: '#f8fafc',
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <input
            type="checkbox"
            checked={selectedCodes.length === filteredTestCodes.length && filteredTestCodes.length > 0}
            onChange={selectAll}
            style={{ cursor: 'pointer' }}
          />
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Select All ({filteredTestCodes.length} codes)
          </span>
        </div>

        {/* Test Codes */}
        {filteredTestCodes.length > 0 ? (
          <div>
            {filteredTestCodes.map((testCode) => (
              <div
                key={testCode.id}
                style={{
                  padding: '16px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: selectedCodes.includes(testCode.id) ? '#f8fafc' : 'white'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedCodes.includes(testCode.id)}
                  onChange={() => toggleSelection(testCode.id)}
                  style={{ cursor: 'pointer' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '6px'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: '0 0 2px 0'
                      }}>
                        {testCode.code} - {testCode.title}
                      </h3>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        {testCode.subject_name} • {testCode.class_level} • {testCode.duration_minutes} min • {testCode.question_count} questions
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{
                        background: testCode.is_activated ? '#dcfce7' : '#fef3c7',
                        color: testCode.is_activated ? '#166534' : '#92400e',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {testCode.is_activated ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <button
                        onClick={() => toggleTestCodeActivation(testCode.id, testCode.is_activated)}
                        style={{
                          background: testCode.is_activated ? '#dc2626' : '#059669',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        {testCode.is_activated ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px',
                    fontSize: '11px',
                    color: '#64748b'
                  }}>
                    <div>
                      <span style={{ fontWeight: '500' }}>Created:</span> {new Date(testCode.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>Expires:</span> {new Date(testCode.expires_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>Used:</span> {testCode.usage_count} times
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>By:</span> {testCode.created_by_name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔑</div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>
              No Test Codes Found
            </h3>
            <p style={{
              fontSize: '14px',
              margin: '0',
              opacity: 0.8
            }}>
              {testCodes.length === 0 ? 
                "No test codes have been created yet." :
                "No test codes match your current filters."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}