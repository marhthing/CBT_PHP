import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { FileText, Upload, Users, ClipboardList, Plus, Eye, BookOpen, TrendingUp } from 'lucide-react'

export default function TeacherDashboard() {
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      const response = await api.get('/teacher/questions?stats=true')
      return response.data
    },
  })

  const { data: recentQuestions } = useQuery({
    queryKey: ['teacher-recent-questions'],
    queryFn: async () => {
      const response = await api.get('/teacher/questions?recent=true')
      return response.data.questions
    },
  })

  const { data: classes } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: async () => {
      const response = await api.get('/teacher/classes')
      return response.data.classes
    },
  })

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
      transition: 'all 0.3s ease',
      position: 'relative' as const,
      overflow: 'hidden'
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
    statChange: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#059669',
      marginTop: '0.5rem'
    },
    iconContainer: {
      width: '50px',
      height: '50px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f9ff',
      border: '2px solid #e0f2fe'
    },
    actionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2.5rem'
    },
    actionCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      transition: 'all 0.3s ease'
    },
    actionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    actionIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4f46e5',
      color: 'white'
    },
    actionTitle: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#1e293b'
    },
    actionDescription: {
      color: '#64748b',
      fontSize: '0.975rem',
      lineHeight: '1.6',
      marginBottom: '1.5rem'
    },
    button: {
      display: 'inline-flex',
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
      transition: 'all 0.3s ease',
      textDecoration: 'none'
    },
    secondaryButton: {
      backgroundColor: '#f8fafc',
      color: '#475569',
      border: '1px solid #e2e8f0',
      marginLeft: '0.75rem'
    },
    sectionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
      gap: '2rem'
    },
    section: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0'
    },
    tableHeaderCell: {
      padding: '0.875rem 1rem',
      textAlign: 'left' as const,
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#475569',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em'
    },
    tableCell: {
      padding: '1rem',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '0.875rem',
      color: '#374151'
    },
    badge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    classCard: {
      padding: '1.25rem',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      marginBottom: '1rem',
      transition: 'all 0.3s ease',
      backgroundColor: '#fafafa'
    },
    classHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.75rem'
    },
    className: {
      fontSize: '1.125rem',
      fontWeight: '700',
      color: '#1e293b'
    },
    classMeta: {
      fontSize: '0.875rem',
      color: '#64748b'
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '3rem 1rem',
      color: '#64748b'
    },
    emptyIcon: {
      margin: '0 auto 1rem',
      opacity: 0.5
    }
  }

  const statCards = [
    {
      label: 'Questions Created',
      value: stats?.total_questions || 0,
      change: `+${stats?.questions_this_week || 0} this week`,
      icon: FileText,
      color: '#3b82f6'
    },
    {
      label: 'Classes Assigned',
      value: classes?.length || 0,
      change: 'Active assignments',
      icon: Users,
      color: '#10b981'
    },
    {
      label: 'Subjects Teaching',
      value: stats?.subjects_count || 0,
      change: 'Different subjects',
      icon: BookOpen,
      color: '#f59e0b'
    },
    {
      label: 'Tests Created',
      value: stats?.tests_created || 0,
      change: 'This term',
      icon: ClipboardList,
      color: '#8b5cf6'
    }
  ]

  const quickActions = [
    {
      title: 'Question Management',
      description: 'Create, edit, and organize your questions by subject and difficulty level. Build comprehensive question banks.',
      icon: FileText,
      primaryAction: () => navigate('/teacher/questions'),
      primaryLabel: 'Manage Questions',
      secondaryAction: () => navigate('/teacher/questions?action=create'),
      secondaryLabel: 'Add New'
    },
    {
      title: 'Bulk Upload',
      description: 'Upload multiple questions at once using Excel or CSV files. Perfect for importing large question sets.',
      icon: Upload,
      primaryAction: () => navigate('/teacher/bulk-upload'),
      primaryLabel: 'Upload Questions',
      secondaryAction: () => navigate('/teacher/bulk-upload?help=template'),
      secondaryLabel: 'Get Template'
    }
  ]

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Teacher Dashboard</h1>
        <p style={styles.subtitle}>
          Create and manage questions for Sure Foundation Comprehensive School
        </p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              style={styles.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={styles.statCardHeader}>
                <div style={styles.statLabel}>{card.label}</div>
                <div style={{ ...styles.iconContainer, backgroundColor: `${card.color}15`, borderColor: `${card.color}30` }}>
                  <Icon size={24} style={{ color: card.color }} />
                </div>
              </div>
              <div style={styles.statValue}>{card.value}</div>
              <div style={styles.statChange}>{card.change}</div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div style={styles.actionsGrid}>
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <div key={index} style={styles.actionCard}>
              <div style={styles.actionHeader}>
                <div style={styles.actionIcon}>
                  <Icon size={20} />
                </div>
                <h3 style={styles.actionTitle}>{action.title}</h3>
              </div>
              <p style={styles.actionDescription}>{action.description}</p>
              <div>
                <button
                  onClick={action.primaryAction}
                  style={styles.button}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4338ca'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#4f46e5'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Plus size={16} />
                  {action.primaryLabel}
                </button>
                <button
                  onClick={action.secondaryAction}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9'
                    e.currentTarget.style.borderColor = '#cbd5e1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }}
                >
                  <Eye size={16} />
                  {action.secondaryLabel}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Content Sections */}
      <div style={styles.sectionsGrid}>
        {/* Assigned Classes */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Users size={24} />
            Your Classes
          </h2>
          {classes && classes.length > 0 ? (
            classes.map((classItem: any, index: number) => (
              <div
                key={index}
                style={styles.classCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4f46e5'
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.backgroundColor = '#fafafa'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={styles.classHeader}>
                  <h3 style={styles.className}>
                    {classItem.class_level} - {classItem.subject}
                  </h3>
                  <span style={styles.badge}>Active</span>
                </div>
                <div style={styles.classMeta}>
                  Assigned on {new Date(classItem.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <Users size={48} style={styles.emptyIcon} />
              <p>No class assignments yet.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Contact your administrator for class assignments.
              </p>
            </div>
          )}
        </div>

        {/* Recent Questions */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <TrendingUp size={24} />
            Recent Questions
          </h2>
          {recentQuestions && recentQuestions.length > 0 ? (
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.tableHeaderCell}>Question</th>
                  <th style={styles.tableHeaderCell}>Subject</th>
                  <th style={styles.tableHeaderCell}>Class</th>
                  <th style={styles.tableHeaderCell}>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentQuestions.slice(0, 5).map((question: any, index: number) => (
                  <tr key={index}>
                    <td style={styles.tableCell}>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {question.question_text}
                      </div>
                    </td>
                    <td style={styles.tableCell}>{question.subject}</td>
                    <td style={styles.tableCell}>{question.class_level}</td>
                    <td style={styles.tableCell}>
                      {new Date(question.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyState}>
              <FileText size={48} style={styles.emptyIcon} />
              <p>No questions created yet.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Start creating questions for your students.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}