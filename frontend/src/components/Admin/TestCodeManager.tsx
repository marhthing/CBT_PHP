import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Edit, Trash2, Power, PowerOff, Copy, CheckCircle } from 'lucide-react'

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
      return response.data.test_codes || []
    },
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/system/lookup?type=subjects')
      return response.data.data || []
    },
  })

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const response = await api.get('/system/lookup?type=terms')
      return response.data.data || []
    },
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/system/lookup?type=sessions')
      return response.data.data || []
    },
  })

  const createTestMutation = useMutation({
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

  const updateTestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: TestCodeForm }) => {
      const response = await api.put(`/admin/test-codes/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
      setEditingTest(null)
      resetForm()
    },
  })

  const deleteTestMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/test-codes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number, is_active: boolean }) => {
      const response = await api.patch(`/admin/test-codes/${id}/status`, { is_active })
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
      updateTestMutation.mutate({ id: editingTest.id, data: formData })
    } else {
      createTestMutation.mutate(formData)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      marginBottom: '2rem'
    },
    title: {
      fontSize: '2.25rem',
      fontWeight: '800',
      color: '#1e293b',
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#64748b',
      fontSize: '1.125rem'
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '0.75rem 1.5rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)'
    },
    buttonSecondary: {
      background: 'white',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    buttonDanger: {
      background: '#dc2626',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      cursor: 'pointer'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      marginBottom: '1.5rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      fontWeight: '600',
      color: '#374151',
      padding: '1rem',
      textAlign: 'left' as const,
      borderBottom: '1px solid #e5e7eb'
    },
    tableCell: {
      padding: '1rem',
      borderBottom: '1px solid #f1f5f9',
      color: '#374151'
    },
    badge: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600'
    },
    badgeActive: {
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    badgeInactive: {
      backgroundColor: '#fee2e2',
      color: '#dc2626'
    },
    modal: {
      position: 'fixed' as const,
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '2rem',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto' as const
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
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box' as const
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      outline: 'none',
      boxSizing: 'border-box' as const
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Test Code Manager</h1>
        <p style={styles.subtitle}>Create and manage test codes for your examinations</p>
        <div style={{ marginTop: '1rem' }}>
          <button
            style={styles.buttonPrimary}
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={16} />
            Create Test Code
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#1e293b' }}>
          Active Test Codes
        </h2>
        
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Code</th>
              <th style={styles.tableHeader}>Title</th>
              <th style={styles.tableHeader}>Subject</th>
              <th style={styles.tableHeader}>Class</th>
              <th style={styles.tableHeader}>Duration</th>
              <th style={styles.tableHeader}>Questions</th>
              <th style={styles.tableHeader}>Status</th>
              <th style={styles.tableHeader}>Expires</th>
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testCodes?.map((test: any) => (
              <tr key={test.id}>
                <td style={styles.tableCell}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong>{test.code}</strong>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                      onClick={() => copyToClipboard(test.code)}
                      title="Copy code"
                    >
                      {copiedCode === test.code ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </td>
                <td style={styles.tableCell}>{test.title}</td>
                <td style={styles.tableCell}>{test.subject_name}</td>
                <td style={styles.tableCell}>{test.class_level}</td>
                <td style={styles.tableCell}>{test.duration_minutes} min</td>
                <td style={styles.tableCell}>{test.question_count}</td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.badge,
                    ...(test.is_active ? styles.badgeActive : styles.badgeInactive)
                  }}>
                    {test.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.tableCell}>{formatDate(test.expires_at)}</td>
                <td style={styles.tableCell}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      style={styles.buttonSecondary}
                      onClick={() => {
                        setEditingTest(test)
                        setFormData({
                          title: test.title,
                          subject_id: test.subject_id,
                          class_level: test.class_level,
                          duration_minutes: test.duration_minutes,
                          question_count: test.question_count,
                          expires_at: test.expires_at.split('T')[0],
                          term_id: test.term_id,
                          session_id: test.session_id
                        })
                        setIsCreateOpen(true)
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      style={styles.buttonSecondary}
                      onClick={() => toggleStatusMutation.mutate({
                        id: test.id,
                        is_active: !test.is_active
                      })}
                    >
                      {test.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                    </button>
                    <button
                      style={styles.buttonDanger}
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this test code?')) {
                          deleteTestMutation.mutate(test.id)
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!testCodes || testCodes.length === 0) && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <p>No test codes created yet. Create your first test code to get started.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isCreateOpen && (
        <div style={styles.modal} onClick={() => setIsCreateOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1e293b' }}>
              {editingTest ? 'Edit Test Code' : 'Create New Test Code'}
            </h2>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Test Title</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Subject</label>
                  <select
                    style={styles.select}
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects?.map((subject: any) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Class Level</label>
                  <select
                    style={styles.select}
                    value={formData.class_level}
                    onChange={(e) => setFormData({ ...formData, class_level: e.target.value })}
                    required
                  >
                    <option value="">Select Class</option>
                    <option value="JSS1">JSS1</option>
                    <option value="JSS2">JSS2</option>
                    <option value="JSS3">JSS3</option>
                    <option value="SS1">SS1</option>
                    <option value="SS2">SS2</option>
                    <option value="SS3">SS3</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Duration (minutes)</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    min="1"
                    max="180"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Number of Questions</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={formData.question_count}
                    onChange={(e) => setFormData({ ...formData, question_count: parseInt(e.target.value) })}
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Expires At</label>
                <input
                  type="date"
                  style={styles.input}
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" style={styles.buttonPrimary}>
                  {editingTest ? 'Update Test Code' : 'Create Test Code'}
                </button>
                <button
                  type="button"
                  style={styles.buttonSecondary}
                  onClick={() => {
                    setIsCreateOpen(false)
                    setEditingTest(null)
                    resetForm()
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}