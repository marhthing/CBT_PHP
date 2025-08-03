import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../../lib/api'
import { Users, UserPlus, BookOpen, GraduationCap, Plus, X, Save, Trash2 } from 'lucide-react'
import ConfirmationModal from '../ui/ConfirmationModal'

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
  class_levels?: Array<{id: string, name: string}>
}

interface CreateAssignmentForm {
  teacher_id: string
  subject_id: string
  class_level: string
  term_id: string
  session_id: string
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
    class_level: '',
    term_id: '',
    session_id: ''
  })

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Memoized fetch functions to prevent unnecessary re-renders
  const fetchAssignments = useCallback(async () => {
    try {
      const response = await api.get('/admin/assignments')
      
      // The API returns data in response.data.data structure  
      const assignmentsData = response.data.data || []
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : [])
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
      setAssignments([]) // Set empty array on error
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
    if (!createForm.teacher_id || !createForm.subject_id || !createForm.class_level || !createForm.term_id || !createForm.session_id) {
      setError('Please fill in all required fields')
      return
    }

    setCreating(true)
    setError('')
    try {
      const response = await api.post('/admin/assignments', createForm)
      if (response.data.success) {
        await fetchAssignments()
        setShowCreateModal(false)
        setCreateForm({ teacher_id: '', subject_id: '', class_level: '', term_id: '', session_id: '' })
        setSuccessMessage('Assignment created successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        // Handle case where response is received but success is false
        setError(response.data.message || 'Failed to create assignment')
      }
    } catch (error: any) {
      console.error('Failed to create assignment:', error)
      setError('Failed to create assignment: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreating(false)
    }
  }, [createForm, fetchAssignments])

  const handleDeleteAssignment = useCallback((assignmentId: number) => {
    setAssignmentToDelete(assignmentId)
    setShowDeleteModal(true)
  }, [])

  const confirmDeleteAssignment = useCallback(async () => {
    if (!assignmentToDelete) return
    
    setDeleting(true)
    try {
      const response = await api.delete(`/admin/assignments?id=${assignmentToDelete}`)
      if (response.data.success) {
        await fetchAssignments()
        setSuccessMessage('Assignment deleted successfully')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      console.error('Failed to delete assignment:', error)
      setError('Failed to delete assignment: ' + (error.response?.data?.message || error.message))
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setAssignmentToDelete(null)
    }
  }, [assignmentToDelete, fetchAssignments])

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
      <div className="flex justify-center items-center min-h-[60vh] text-lg text-gray-500">
        <div className="flex items-center space-x-3">
          <div className="loading-spinner w-5 h-5"></div>
          Loading assignments...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teacher Assignments</h1>
            <p className="text-gray-600 mt-1">Manage teacher subject and class assignments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Create Assignment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search teachers..."
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Subjects</option>
              {(lookupData.subjects || []).map(subject => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Classes</option>
              {(lookupData.class_levels || []).map(classLevel => (
                <option key={classLevel.id} value={classLevel.id}>
                  {classLevel.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
          Assignments ({filteredAssignments.length})
        </h2>

        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 sm:py-16 text-gray-500">
            <UserPlus size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No assignments found
            </h3>
            <p className="text-sm">
              {teacherFilter || subjectFilter || classFilter
                ? 'Try adjusting your filters'
                : 'No teacher assignments have been created yet'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {assignment.teacher_name}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      {assignment.teacher_email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id)}
                    className="ml-2 p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-indigo-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-indigo-600 truncate">
                      {assignment.subject_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap size={14} className="text-purple-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-purple-600 truncate">
                      {assignment.class_level}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created {new Date(assignment.created_at).toLocaleDateString()}
                  </p>
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
                  {(lookupData.class_levels || []).map(classLevel => (
                    <option key={classLevel.id} value={classLevel.id}>
                      {classLevel.name}
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
                  Term *
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
                  Session *
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

              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              {successMessage && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  color: '#166534',
                  fontSize: '14px'
                }}>
                  {successMessage}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createAssignment}
                  disabled={creating}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    creating 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {creating ? (
                    <>
                      <div className="loading-spinner w-4 h-4"></div>
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setAssignmentToDelete(null)
        }}
        onConfirm={confirmDeleteAssignment}
        title="Delete Assignment"
        message="Are you sure you want to delete this teacher assignment? This action cannot be undone."
        isDestructive={true}
        loading={deleting}
      />
    </div>
  )
}