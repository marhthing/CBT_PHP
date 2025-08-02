import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import { Users, UserPlus, BookOpen, GraduationCap, Search, Plus, X, Save, Trash2 } from 'lucide-react'

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

export default function TeacherAssignment() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [lookupData, setLookupData] = useState<LookupData>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
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
      const assignmentsData = response.data.data || response.data || []
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
      setAssignments([]) // Set empty array on error
      setError('Failed to load assignments')
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

  // Load data on mount
  useEffect(() => {
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
      const response = await api.post('/admin/assignments', createForm)
      if (response.data.success) {
        await fetchAssignments()
        setShowCreateModal(false)
        setCreateForm({ teacher_id: '', subject_id: '', class_level: '' })
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
      const response = await api.delete(`/admin/assignments/${assignmentId}`)
      if (response.data.success) {
        await fetchAssignments()
      }
    } catch (error: any) {
      console.error('Failed to delete assignment:', error)
      alert('Failed to delete assignment: ' + (error.response?.data?.message || error.message))
    }
  }, [fetchAssignments])

  // Memoized filtered assignments for performance
  const filteredAssignments = useMemo(() => {
    if (!Array.isArray(assignments)) return []
    return assignments.filter(assignment => {
      const matchesTeacher = !teacherFilter || assignment.teacher_name.toLowerCase().includes(teacherFilter.toLowerCase())
      const matchesSubject = !subjectFilter || assignment.subject_name === subjectFilter
      const matchesClass = !classFilter || assignment.class_level === classFilter
      
      return matchesTeacher && matchesSubject && matchesClass
    })
  }, [assignments, teacherFilter, subjectFilter, classFilter])

  // Memoized stats for performance
  const assignmentStats = useMemo(() => {
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return {
        totalAssignments: 0,
        assignedTeachers: 0,
        assignedSubjects: 0,
        assignedClasses: 0
      }
    }
    
    const uniqueTeachers = new Set(assignments.map(a => a.teacher_id)).size
    const uniqueSubjects = new Set(assignments.map(a => a.subject_id)).size
    const uniqueClasses = new Set(assignments.map(a => a.class_level)).size
    
    return {
      totalAssignments: assignments.length,
      assignedTeachers: uniqueTeachers,
      assignedSubjects: uniqueSubjects,
      assignedClasses: uniqueClasses
    }
  }, [assignments])

  const statsCards = useMemo(() => [
    {
      title: 'Total Assignments',
      value: assignmentStats.totalAssignments,
      icon: BookOpen,
      color: '#6366f1'
    },
    {
      title: 'Assigned Teachers',
      value: assignmentStats.assignedTeachers,
      icon: Users,
      color: '#8b5cf6'
    },
    {
      title: 'Subjects Covered',
      value: assignmentStats.assignedSubjects,
      icon: BookOpen,
      color: '#10b981'
    },
    {
      title: 'Class Levels',
      value: assignmentStats.assignedClasses,
      icon: GraduationCap,
      color: '#f59e0b'
    }
  ], [assignmentStats])

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
          Loading assignments...
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
            Teacher Assignments
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Manage teacher subject and class assignments
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
          Create Assignment
        </button>
      </div>

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
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          gap: '16px'
        }}>
          <input
            type="text"
            placeholder="Search teachers..."
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              placeholder: 'rgba(255, 255, 255, 0.7)'
            }}
          />

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white'
            }}
          >
            <option value="">All Subjects</option>
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
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white'
            }}
          >
            <option value="">All Classes</option>
            <option value="JSS1" style={{ color: '#1f2937' }}>JSS 1</option>
            <option value="JSS2" style={{ color: '#1f2937' }}>JSS 2</option>
            <option value="JSS3" style={{ color: '#1f2937' }}>JSS 3</option>
            <option value="SS1" style={{ color: '#1f2937' }}>SS 1</option>
            <option value="SS2" style={{ color: '#1f2937' }}>SS 2</option>
            <option value="SS3" style={{ color: '#1f2937' }}>SS 3</option>
          </select>
        </div>

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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <Plus size={16} />
          Create Assignment
        </button>
      </div>

      {/* Assignments List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '20px'
        }}>
          Assignments ({filteredAssignments.length})
        </h2>

        {filteredAssignments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <UserPlus size={64} style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              No assignments found
            </h3>
            <p style={{ margin: 0 }}>
              {teacherFilter || subjectFilter || classFilter
                ? 'Try adjusting your filters'
                : 'No teacher assignments have been created yet'
              }
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#f9fafb',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 8px 0'
                    }}>
                      {assignment.teacher_name}
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 8px 0'
                    }}>
                      {assignment.teacher_email}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteAssignment(assignment.id)}
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

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <BookOpen size={16} style={{ color: '#6366f1' }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#6366f1'
                    }}>
                      {assignment.subject_name}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <GraduationCap size={16} style={{ color: '#8b5cf6' }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#8b5cf6'
                    }}>
                      {assignment.class_level}
                    </span>
                  </div>
                </div>

                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e5e7eb',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  Created {new Date(assignment.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
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
            maxWidth: '500px',
            width: '100%'
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
                Create New Assignment
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
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Teacher
                </label>
                <select
                  value={createForm.teacher_id}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, teacher_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.email})
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
                  onClick={createAssignment}
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
                      Create Assignment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}