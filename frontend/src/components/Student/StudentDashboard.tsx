import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { BookOpen, ClipboardList, Trophy, Clock, Play, TrendingUp, Target, Award } from 'lucide-react'

export default function StudentDashboard() {
  const navigate = useNavigate()

  const { data: availableTests } = useQuery({
    queryKey: ['student-tests'],
    queryFn: async () => {
      const response = await api.get('/student/tests')
      return response.data.tests
    },
  })

  const { data: recentResults } = useQuery({
    queryKey: ['student-results'],
    queryFn: async () => {
      const response = await api.get('/student/results')
      return response.data.results
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
    welcome: {
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
    sectionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
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
    testCard: {
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      marginBottom: '1rem',
      transition: 'all 0.3s ease',
      backgroundColor: '#fafafa'
    },
    testHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.75rem'
    },
    testTitle: {
      fontSize: '1.125rem',
      fontWeight: '700',
      color: '#1e293b'
    },
    testMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '0.875rem',
      color: '#64748b',
      marginBottom: '1rem'
    },
    testMetaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
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
      border: '1px solid #e2e8f0'
    },
    badge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    resultCard: {
      padding: '1rem',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    resultInfo: {
      flex: 1
    },
    resultTitle: {
      fontSize: '0.975rem',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '0.25rem'
    },
    resultMeta: {
      fontSize: '0.8rem',
      color: '#64748b'
    },
    scoreContainer: {
      textAlign: 'right' as const
    },
    score: {
      fontSize: '1.5rem',
      fontWeight: '800',
      color: '#059669'
    },
    scoreLabel: {
      fontSize: '0.75rem',
      color: '#64748b',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em'
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

  const stats = [
    {
      label: 'Available Tests',
      value: availableTests?.length || 0,
      change: 'Ready to take',
      icon: BookOpen,
      color: '#3b82f6'
    },
    {
      label: 'Completed Tests',
      value: recentResults?.length || 0,
      change: 'This term',
      icon: ClipboardList,
      color: '#10b981'
    },
    {
      label: 'Average Score',
      value: recentResults?.length ? Math.round(recentResults.reduce((acc: number, result: any) => acc + (result.score / result.total_questions * 100), 0) / recentResults.length) + '%' : '0%',
      change: 'Overall performance',
      icon: Trophy,
      color: '#f59e0b'
    },
    {
      label: 'Total Time',
      value: recentResults?.length ? Math.round(recentResults.reduce((acc: number, result: any) => acc + result.time_taken, 0) / 60) + ' min' : '0 min',
      change: 'Time spent testing',
      icon: Clock,
      color: '#8b5cf6'
    }
  ]

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.welcome}>Welcome to Your Dashboard!</h1>
        <p style={styles.subtitle}>
          Sure Foundation Comprehensive School - Take tests and track your academic progress
        </p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
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
                <div style={styles.statLabel}>{stat.label}</div>
                <div style={{ ...styles.iconContainer, backgroundColor: `${stat.color}15`, borderColor: `${stat.color}30` }}>
                  <Icon size={24} style={{ color: stat.color }} />
                </div>
              </div>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statChange}>{stat.change}</div>
            </div>
          )
        })}
      </div>

      {/* Main Content Sections */}
      <div style={styles.sectionsGrid}>
        {/* Available Tests */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Target size={24} />
            Available Tests
          </h2>
          {availableTests && availableTests.length > 0 ? (
            availableTests.slice(0, 3).map((test: any, index: number) => (
              <div
                key={index}
                style={styles.testCard}
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
                <div style={styles.testHeader}>
                  <h3 style={styles.testTitle}>{test.title}</h3>
                  <span style={styles.badge}>Active</span>
                </div>
                <div style={styles.testMeta}>
                  <div style={styles.testMetaItem}>
                    <BookOpen size={16} />
                    {test.subject}
                  </div>
                  <div style={styles.testMetaItem}>
                    <Clock size={16} />
                    {test.duration_minutes} min
                  </div>
                  <div style={styles.testMetaItem}>
                    <ClipboardList size={16} />
                    {test.question_count} questions
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/student/take-test/${test.code}`)}
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
                  <Play size={16} />
                  Start Test
                </button>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <BookOpen size={48} style={styles.emptyIcon} />
              <p>No tests available at the moment.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Check back later for new tests from your teachers.
              </p>
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <TrendingUp size={24} />
            Recent Results
          </h2>
          {recentResults && recentResults.length > 0 ? (
            <>
              {recentResults.slice(0, 4).map((result: any, index: number) => (
                <div key={index} style={styles.resultCard}>
                  <div style={styles.resultInfo}>
                    <div style={styles.resultTitle}>
                      {result.test_code?.title || 'Test'}
                    </div>
                    <div style={styles.resultMeta}>
                      {result.test_code?.subject} • {new Date(result.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={styles.scoreContainer}>
                    <div style={styles.score}>
                      {Math.round((result.score / result.total_questions) * 100)}%
                    </div>
                    <div style={styles.scoreLabel}>
                      {result.score}/{result.total_questions}
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/student/results')}
                style={{ ...styles.button, ...styles.secondaryButton, width: '100%', marginTop: '1rem' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9'
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                <Award size={16} />
                View All Results
              </button>
            </>
          ) : (
            <div style={styles.emptyState}>
              <ClipboardList size={48} style={styles.emptyIcon} />
              <p>No test results yet.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Complete some tests to see your performance here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}