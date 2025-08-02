import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'

interface Teacher {
  id: number
  full_name: string
  email: string
  username: string
  is_active: boolean
  created_at: string
}

interface Assignment {
  id: number
  teacher_id: number
  teacher_name: string
  teacher_email: string
  subject_id: number
  subject_name: string
  class_level: string
  created_at: string
  assigned_by_name: string
}

interface LookupData {
  subjects?: Array<{id: number, name: string}>
  terms?: Array<{id: number, name: string}>
  sessions?: Array<{id: number, name: string}>
}

interface CreateAssignmentForm {
  teacher_id: string
  subject_id: string
  class_level: string
}

export default function OptimizedTeacherAssignment() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [lookupData, setLookupData] = useState<LookupData>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Filters
  const [teacherFilter, setTeacherFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')

  // Create form
  const [createForm, setCreateForm] = useState<CreateAssignmentForm>({
    teacher_id: '',
    subject_id: '',
    class_level: ''
  })

  // Memoized fetch functions to prevent unnecessary re-renders
  const fetchAssignments = useCallback(async () => {
    try {
      const response = await api.get('/admin/assignments')
      setAssignments(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await api.get('/admin/teachers')
      setTeachers(response.data.data?.teachers || [])
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
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

  useEffect(() => {
    // Load all data in parallel for better performance
    Promise.all([
      fetchAssignments(),
      fetchTeachers(),
      fetchLookupData()
    ])
  }, [fetchAssignments, fetchTeachers, fetchLookupData])

  const createAssignment = useCallback(async () => {
    if (!createForm.teacher_id || !createForm.subject_id || !createForm.class_level) {
      alert('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const response = await api.post('/admin/assignments', {
        teacher_id: parseInt(createForm.teacher_id),
        subject_id: parseInt(createForm.subject_id),
        class_level: createForm.class_level
      })
      
      if (response.data.success) {
        await fetchAssignments()
        setShowCreateModal(false)
        setCreateForm({
          teacher_id: '',
          subject_id: '',
          class_level: ''
        })
        alert('Assignment created successfully!')
      }
    } catch (error: any) {
      console.error('Failed to create assignment:', error)
      alert('Failed to create assignment: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreating(false)
    }
  }, [createForm, fetchAssignments])

  const deleteAssignment = useCallback(async (assignmentId: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    
    try {
      await api.delete(`/admin/assignments/${assignmentId}`)
      await fetchAssignments()
      alert('Assignment deleted successfully!')
    } catch (error: any) {
      console.error('Failed to delete assignment:', error)
      alert('Failed to delete assignment: ' + (error.response?.data?.message || error.message))
    }
  }, [fetchAssignments])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const classLevels = useMemo(() => ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'], [])

  // Memoized filtered assignments for performance
  const filteredAssignments = useMemo(() => {
    if (!Array.isArray(assignments)) return []
    
    return assignments.filter(assignment => {
      if (teacherFilter && assignment.teacher_name !== teacherFilter) return false
      if (subjectFilter && assignment.subject_name !== subjectFilter) return false
      if (classFilter && assignment.class_level !== classFilter) return false
      return true
    })
  }, [assignments, teacherFilter, subjectFilter, classFilter])

  // Memoized assignment statistics for performance
  const stats = useMemo(() => {
    if (!Array.isArray(assignments)) {
      return { total: 0, teachers: 0, subjects: 0, classes: 0 }
    }
    
    const teacherCount = new Set(assignments.map(a => a.teacher_id)).size
    const subjectCount = new Set(assignments.map(a => a.subject_id)).size
    const classCount = new Set(assignments.map(a => a.class_level)).size
    
    return {
      total: assignments.length,
      teachers: teacherCount,
      subjects: subjectCount,
      classes: classCount
    }
  }, [assignments])

  // Memoized active teachers for dropdown
  const activeTeachers = useMemo(() => 
    teachers.filter(t => t.is_active), [teachers]
  )

  const clearFilters = useCallback(() => {
    setTeacherFilter('')
    setSubjectFilter('')
    setClassFilter('')
  }, [])

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
            Teacher Assignments
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0
          }}>
            Manage subject and class assignments for teachers
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
          + Create New Assignment
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
          { label: 'Total Assignments', value: stats.total, color: '#6366f1' },
          { label: 'Teachers Assigned', value: stats.teachers, color: '#8b5cf6' },
          { label: 'Subjects Covered', value: stats.subjects, color: '#06b6d4' },
          { label: 'Class Levels', value: stats.classes, color: '#10b981' }
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
          Filter Assignments
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
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
            <option value="">All Teachers</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.full_name}>
                {teacher.full_name}
              </option>
            ))}
          </select>

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

      {/* Assignments Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '16px'
      }}>
        {filteredAssignments.map((assignment) => (
          <div
            key={assignment.id}
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
              marginBottom: '16px'
            }}>
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 4px 0'
                }}>
                  {assignment.teacher_name}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0
                }}>
                  {assignment.teacher_email}
                </p>
              </div>
              
              <button
                onClick={() => deleteAssignment(assignment.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  padding: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '18px',
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
                title="Delete Assignment"
              >
                ×
              </button>
            </div>

            {/* Assignment Details */}
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
                  {assignment.subject_name}
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
                  Class Level
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {assignment.class_level}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#64748b'
              }}>
                Created {formatDate(assignment.created_at)}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#64748b'
              }}>
                by {assignment.assigned_by_name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAssignments.length === 0 && !loading && (
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
          }}>📚</div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 8px 0'
          }}>
            No assignments found
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0 0 24px 0'
          }}>
            {(teacherFilter || subjectFilter || classFilter) 
              ? 'Try adjusting your filters or create a new assignment.'
              : 'Get started by creating your first teacher assignment.'
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
            Create Assignment
          </button>
        </div>
      )}

      {/* Create Assignment Modal */}
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
            maxWidth: '500px',
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
              Create New Assignment
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Teacher *
              </label>
              <select
                value={createForm.teacher_id}
                onChange={(e) => setCreateForm({...createForm, teacher_id: e.target.value})}
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
                <option value="">Select Teacher</option>
                {activeTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.email})
                  </option>
                ))}
              </select>
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
                onClick={createAssignment}
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
                {creating ? 'Creating...' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}