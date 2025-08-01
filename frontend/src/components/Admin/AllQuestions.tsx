import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { Search, FileText, Users, BookOpen, TrendingUp } from 'lucide-react'

export default function AllQuestions() {
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')

  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-questions', searchTerm, subjectFilter, classFilter, teacherFilter, difficultyFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (subjectFilter) params.append('subject', subjectFilter)
      if (classFilter) params.append('class', classFilter)
      if (teacherFilter) params.append('teacher', teacherFilter)
      if (difficultyFilter) params.append('difficulty', difficultyFilter)
      
      const response = await api.get(`/admin/questions?${params}`)
      return response.data.questions
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-question-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/questions?stats=true')
      return response.data
    },
  })

  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers-list'],
    queryFn: async () => {
      const response = await api.get('/admin/teachers')
      return response.data.teachers
    },
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'hard': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const uniqueSubjects = [...new Set(questions?.map((q: any) => q.subject) || [])]
  const uniqueClasses = [...new Set(questions?.map((q: any) => q.class_level) || [])]

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      marginBottom: '2.5rem'
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
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      fontSize: '1rem',
      color: '#6b7280'
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
        <h1 style={styles.title}>All Questions</h1>
        <p style={styles.subtitle}>
          View and manage questions from all teachers across the system
        </p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Total Questions</span>
            <div style={styles.iconContainer}>
              <FileText size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{stats?.total_questions || 0}</div>
          <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
            +{stats?.questions_this_week || 0} this week
          </p>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Subjects</span>
            <div style={styles.iconContainer}>
              <BookOpen size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{uniqueSubjects.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Active Teachers</span>
            <div style={styles.iconContainer}>
              <Users size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{stats?.active_teachers || 0}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Avg per Teacher</span>
            <div style={styles.iconContainer}>
              <TrendingUp size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{stats?.avg_questions_per_teacher || 0}</div>
        </div>
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
            {uniqueSubjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <select
            style={styles.select}
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {uniqueClasses.map(classLevel => (
              <option key={classLevel} value={classLevel}>{classLevel}</option>
            ))}
          </select>

          <select
            style={styles.select}
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
          >
            <option value="">All Teachers</option>
            {teachers?.map((teacher: any) => (
              <option key={teacher.id} value={teacher.full_name}>{teacher.full_name}</option>
            ))}
          </select>

          <select
            style={styles.select}
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div style={styles.questionsCard}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem' }}>
          Questions ({questions?.length || 0})
        </h3>
        
        {questions?.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Question</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Difficulty</th>
                <th style={styles.th}>Teacher</th>
                <th style={styles.th}>Created</th>
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
                  <td style={styles.td}>{question.teacher_name}</td>
                  <td style={styles.td}>{formatDate(question.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db' }} />
            <p>No questions found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}