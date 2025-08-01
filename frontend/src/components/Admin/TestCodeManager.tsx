import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { Plus, Edit, Trash2, Power, PowerOff, Copy, CheckCircle, X } from 'lucide-react'

interface TestCodeForm {
  title: string
  subject_id: string
  class_level: string
  duration_minutes: number
  question_count: number
  expires_at: string
  term_id: string
  session_id: string
}

export default function TestCodeManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<any>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<TestCodeForm>({
    title: '',
    subject_id: '',
    class_level: '',
    duration_minutes: 60,
    question_count: 20,
    expires_at: '',
    term_id: '1',
    session_id: '1'
  })

  const queryClient = useQueryClient()

  const { data: testCodes, isLoading } = useQuery({
    queryKey: ['admin-test-codes'],
    queryFn: async () => {
      const response = await api.get('/admin/test-codes')
      return response.data.test_codes
    },
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/system/lookup?type=subjects')
      return response.data.data
    },
  })

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const response = await api.get('/system/lookup?type=terms')
      return response.data.data
    },
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/system/lookup?type=sessions')
      return response.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: TestCodeForm) => {
      const response = await api.post('/admin/test-codes', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
      setIsCreateOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TestCodeForm }) => {
      const response = await api.put(`/admin/test-codes?id=${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
      setEditingTest(null)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/admin/test-codes?id=${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.patch(`/admin/test-codes?id=${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
    },
  })

  const resetForm = () => {
    setFormData({
      title: '',
      subject_id: '',
      class_level: '',
      duration_minutes: 60,
      question_count: 20,
      expires_at: '',
      term_id: '1',
      session_id: '1'
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTest) {
      updateMutation.mutate({ id: editingTest.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (testCode: any) => {
    setEditingTest(testCode)
    setFormData({
      title: testCode.title,
      subject_id: testCode.subject_id?.toString() || '',
      class_level: testCode.class_level,
      duration_minutes: testCode.duration_minutes,
      question_count: testCode.question_count,
      expires_at: testCode.expires_at?.split('T')[0] || '',
      term_id: testCode.term_id?.toString() || '1',
      session_id: testCode.session_id?.toString() || '1'
    })
    setIsCreateOpen(true)
  }

  const copyTestCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'inactive': return '#ef4444'
      case 'expired': return '#6b7280'
      default: return '#f59e0b'
    }
  }

  const classes = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3']

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '2.5rem'
    },
    headerContent: {
      flex: 1
    },
    title: {
      fontSize: '2.25rem',
      fontWeight: '800',
      color: '#1e293b',
      marginBottom: '0.5rem',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      color: '#64748b',
      fontSize: '1.125rem',
      fontWeight: '400'
    },
    addButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)'
    },
    testCodesCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const
    },
    th: {
      textAlign: 'left' as const,
      padding: '1rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #e5e7eb'
    },
    td: {
      padding: '1rem',
      fontSize: '0.875rem',
      color: '#6b7280',
      borderBottom: '1px solid #f3f4f6'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: 'white'
    },
    codeDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
      backgroundColor: '#f8fafc',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#1e293b'
    },
    copyButton: {
      padding: '0.25rem',
      backgroundColor: 'transparent',
      color: '#6b7280',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'color 0.2s ease'
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem'
    },
    editButton: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem',
      backgroundColor: '#eff6ff',
      color: '#2563eb',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    deleteButton: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    statusButton: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem',
      backgroundColor: '#f0fdf4',
      color: '#059669',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      width: '100%',
      maxWidth: '600px',
      margin: '1rem',
      maxHeight: '90vh',
      overflowY: 'auto' as const
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem'
    },
    modalTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1f2937'
    },
    closeButton: {
      padding: '0.5rem',
      backgroundColor: 'transparent',
      color: '#6b7280',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      outline: 'none'
    },
    select: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      outline: 'none'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem'
    },
    submitButton: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '1rem'
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh'
    }
  }

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3b82f6',
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
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Test Code Manager</h1>
          <p style={styles.subtitle}>
            Create and manage test codes for online examinations
          </p>
        </div>
        <button
          style={styles.addButton}
          onClick={() => {
            resetForm()
            setEditingTest(null)
            setIsCreateOpen(true)
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
        >
          <Plus size={16} />
          New Test Code
        </button>
      </div>

      {/* Test Codes Table */}
      <div style={styles.testCodesCard}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem' }}>
          Test Codes ({testCodes?.length || 0})
        </h3>
        
        {testCodes?.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Test Code</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Duration</th>
                <th style={styles.th}>Questions</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Expires At</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testCodes.map((testCode: any) => (
                <tr key={testCode.id}>
                  <td style={styles.td}>
                    <div style={styles.codeDisplay}>
                      <span>{testCode.code}</span>
                      <button
                        style={{
                          ...styles.copyButton,
                          color: copiedCode === testCode.code ? '#10b981' : '#6b7280'
                        }}
                        onClick={() => copyTestCode(testCode.code)}
                      >
                        {copiedCode === testCode.code ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>
                      {testCode.title}
                    </div>
                  </td>
                  <td style={styles.td}>{testCode.subject}</td>
                  <td style={styles.td}>{testCode.class_level}</td>
                  <td style={styles.td}>{testCode.duration_minutes} min</td>
                  <td style={styles.td}>{testCode.question_count}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: getStatusColor(testCode.status)
                    }}>
                      {testCode.status}
                    </span>
                  </td>
                  <td style={styles.td}>{formatDate(testCode.expires_at)}</td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        style={{
                          ...styles.statusButton,
                          backgroundColor: testCode.status === 'active' ? '#fef2f2' : '#f0fdf4',
                          color: testCode.status === 'active' ? '#dc2626' : '#059669'
                        }}
                        onClick={() => toggleStatusMutation.mutate(testCode.id)}
                        title={testCode.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {testCode.status === 'active' ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>
                      <button
                        style={styles.editButton}
                        onClick={() => handleEdit(testCode)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        style={styles.deleteButton}
                        onClick={() => deleteMutation.mutate(testCode.id)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
            <CheckCircle size={64} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              No test codes yet
            </h3>
            <p>Create your first test code to start administering online tests.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Test Code Modal */}
      {isCreateOpen && (
        <div style={styles.modal} onClick={() => setIsCreateOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingTest ? 'Edit Test Code' : 'Create New Test Code'}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => setIsCreateOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Test Title *</label>
                <input
                  style={styles.input}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Mathematics Mid-Term Test"
                  required
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Subject *</label>
                  <select
                    style={styles.select}
                    value={formData.subject_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
                    required
                  >
                    <option value="">Select subject</option>
                    {subjects?.map((subject: any) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Class Level *</label>
                  <select
                    style={styles.select}
                    value={formData.class_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, class_level: e.target.value }))}
                    required
                  >
                    <option value="">Select class level</option>
                    {classes.map(classLevel => (
                      <option key={classLevel} value={classLevel}>
                        {classLevel}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Duration (minutes) *</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                    min="5"
                    max="180"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Number of Questions *</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={formData.question_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, question_count: parseInt(e.target.value) }))}
                    min="1"
                    max="100"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Expires At *</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Term</label>
                  <select
                    style={styles.select}
                    value={formData.term_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, term_id: e.target.value }))}
                  >
                    {terms?.map((term: any) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? (editingTest ? 'Updating...' : 'Creating...') 
                  : (editingTest ? 'Update Test Code' : 'Create Test Code')
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}