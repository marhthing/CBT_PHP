import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { Plus, Trash2, Users, BookOpen, X } from 'lucide-react'

interface AssignmentForm {
  teacher_id: number
  subject_id: number
  class_level: string
}

export default function TeacherAssignment() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState<AssignmentForm>({
    teacher_id: 0,
    subject_id: 0,
    class_level: ''
  })

  const queryClient = useQueryClient()

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['admin-assignments'],
    queryFn: async () => {
      const response = await api.get('/admin/assignments')
      return response.data.assignments
    },
  })

  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: async () => {
      const response = await api.get('/admin/teachers')
      return response.data.teachers
    },
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/system/lookup?type=subjects')
      return response.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: AssignmentForm) => {
      const response = await api.post('/admin/assignments', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] })
      setIsCreateOpen(false)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/admin/assignments?id=${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] })
    },
  })

  const resetForm = () => {
    setFormData({
      teacher_id: 0,
      subject_id: 0,
      class_level: ''
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2.5rem'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      transition: 'all 0.3s ease'
    },
    statCardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1rem'
    },
    statLabel: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em'
    },
    statValue: {
      fontSize: '2.5rem',
      fontWeight: '800',
      color: '#1e293b',
      lineHeight: '1'
    },
    iconContainer: {
      width: '50px',
      height: '50px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f9ff',
      color: '#0ea5e9'
    },
    assignmentsCard: {
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
    deleteButton: {
      padding: '0.5rem',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
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
      maxWidth: '500px',
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
    select: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      outline: 'none'
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

  const totalAssignments = assignments?.length || 0
  const uniqueTeachers = [...new Set(assignments?.map((a: any) => a.teacher_id) || [])].length
  const uniqueSubjects = [...new Set(assignments?.map((a: any) => a.subject) || [])].length

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Teacher Assignments</h1>
          <p style={styles.subtitle}>
            Assign teachers to specific subjects and class levels
          </p>
        </div>
        <button
          style={styles.addButton}
          onClick={() => setIsCreateOpen(true)}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
        >
          <Plus size={16} />
          New Assignment
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Total Assignments</span>
            <div style={styles.iconContainer}>
              <BookOpen size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{totalAssignments}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Assigned Teachers</span>
            <div style={styles.iconContainer}>
              <Users size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{uniqueTeachers}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Subjects Covered</span>
            <div style={styles.iconContainer}>
              <BookOpen size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{uniqueSubjects}</div>
        </div>
      </div>

      {/* Assignments Table */}
      <div style={styles.assignmentsCard}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem' }}>
          Current Assignments ({totalAssignments})
        </h3>
        
        {assignments?.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Teacher</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Class Level</th>
                <th style={styles.th}>Assigned Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment: any) => (
                <tr key={assignment.id}>
                  <td style={styles.td}>{assignment.teacher_name}</td>
                  <td style={styles.td}>{assignment.subject}</td>
                  <td style={styles.td}>{assignment.class_level}</td>
                  <td style={styles.td}>{formatDate(assignment.created_at)}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.deleteButton}
                      onClick={() => deleteMutation.mutate(assignment.id)}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
            <p>No teacher assignments found</p>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {isCreateOpen && (
        <div style={styles.modal} onClick={() => setIsCreateOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create Teacher Assignment</h2>
              <button
                style={styles.closeButton}
                onClick={() => setIsCreateOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Teacher</label>
                <select
                  style={styles.select}
                  value={formData.teacher_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: parseInt(e.target.value) }))}
                  required
                >
                  <option value={0}>Select teacher</option>
                  {teachers?.map((teacher: any) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.username})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <select
                  style={styles.select}
                  value={formData.subject_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_id: parseInt(e.target.value) }))}
                  required
                >
                  <option value={0}>Select subject</option>
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

              <button
                type="submit"
                style={styles.submitButton}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}