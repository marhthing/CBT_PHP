import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'

interface QuestionForm {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  subject_id: string
  class_level: string
  difficulty: string
  term_id: string
  session_id: string
}

export default function QuestionManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  
  const [formData, setFormData] = useState<QuestionForm>({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: '',
    subject_id: '',
    class_level: '',
    difficulty: 'medium',
    term_id: '1',
    session_id: '1'
  })

  const queryClient = useQueryClient()

  const { data: questions, isLoading } = useQuery({
    queryKey: ['teacher-questions', searchTerm, subjectFilter, classFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (subjectFilter) params.append('subject', subjectFilter)
      if (classFilter) params.append('class', classFilter)
      
      const response = await api.get(`/teacher/questions?${params}`)
      return response.data.questions
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
    mutationFn: async (data: QuestionForm) => {
      const response = await api.post('/teacher/questions', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] })
      setIsCreateOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuestionForm }) => {
      const response = await api.put(`/teacher/questions?id=${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] })
      setEditingQuestion(null)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/teacher/questions?id=${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] })
    },
  })

  const resetForm = () => {
    setFormData({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: '',
      subject_id: '',
      class_level: '',
      difficulty: 'medium',
      term_id: '1',
      session_id: '1'
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (question: any) => {
    setEditingQuestion(question)
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      subject_id: question.subject_id?.toString() || '',
      class_level: question.class_level,
      difficulty: question.difficulty,
      term_id: question.term_id?.toString() || '1',
      session_id: question.session_id?.toString() || '1'
    })
    setIsCreateOpen(true)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'hard': return '#ef4444'
      default: return '#6b7280'
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
    filtersCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      marginBottom: '2rem'
    },
    filtersGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem'
    },
    searchContainer: {
      position: 'relative' as const,
      gridColumn: 'span 2'
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem 1rem 0.75rem 2.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    searchIcon: {
      position: 'absolute' as const,
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
      width: '16px',
      height: '16px'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      outline: 'none'
    },
    questionsCard: {
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
    textarea: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical' as const
    },
    optionsGrid: {
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
          <h1 style={styles.title}>Question Manager</h1>
          <p style={styles.subtitle}>
            Create and manage questions for your subjects
          </p>
        </div>
        <button
          style={styles.addButton}
          onClick={() => {
            resetForm()
            setEditingQuestion(null)
            setIsCreateOpen(true)
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
        >
          <Plus size={16} />
          New Question
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filtersCard}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem' }}>
          Filter Questions
        </h3>
        <div style={styles.filtersGrid}>
          <div style={styles.searchContainer}>
            <Search style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            style={styles.select}
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects?.map((subject: any) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>

          <select
            style={styles.select}
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(classLevel => (
              <option key={classLevel} value={classLevel}>{classLevel}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div style={styles.questionsCard}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem' }}>
          My Questions ({questions?.length || 0})
        </h3>
        
        {questions?.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Question</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Difficulty</th>
                <th style={styles.th}>Correct Answer</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question: any) => (
                <tr key={question.id}>
                  <td style={styles.td}>
                    <div style={{ maxWidth: '300px' }}>
                      {question.question_text.length > 100 
                        ? question.question_text.substring(0, 100) + '...'
                        : question.question_text
                      }
                    </div>
                  </td>
                  <td style={styles.td}>{question.subject}</td>
                  <td style={styles.td}>{question.class_level}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: getDifficultyColor(question.difficulty)
                    }}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td style={styles.td}>{question.correct_answer}</td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        style={styles.editButton}
                        onClick={() => handleEdit(question)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        style={styles.deleteButton}
                        onClick={() => deleteMutation.mutate(question.id)}
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
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <Search size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
            <p>No questions found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Create/Edit Question Modal */}
      {isCreateOpen && (
        <div style={styles.modal} onClick={() => setIsCreateOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingQuestion ? 'Edit Question' : 'Create New Question'}
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
                <label style={styles.label}>Question Text *</label>
                <textarea
                  style={styles.textarea}
                  value={formData.question_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                  placeholder="Enter your question here..."
                  required
                />
              </div>

              <div style={styles.optionsGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Option A *</label>
                  <input
                    style={styles.input}
                    value={formData.option_a}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_a: e.target.value }))}
                    placeholder="Option A"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Option B *</label>
                  <input
                    style={styles.input}
                    value={formData.option_b}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_b: e.target.value }))}
                    placeholder="Option B"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Option C *</label>
                  <input
                    style={styles.input}
                    value={formData.option_c}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_c: e.target.value }))}
                    placeholder="Option C"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Option D *</label>
                  <input
                    style={styles.input}
                    value={formData.option_d}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_d: e.target.value }))}
                    placeholder="Option D"
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Correct Answer *</label>
                <select
                  style={styles.select}
                  value={formData.correct_answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
                  required
                >
                  <option value="">Select correct answer</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div style={styles.optionsGrid}>
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
                  <label style={styles.label}>Difficulty</label>
                  <select
                    style={styles.select}
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
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
                  ? (editingQuestion ? 'Updating...' : 'Creating...') 
                  : (editingQuestion ? 'Update Question' : 'Create Question')
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}