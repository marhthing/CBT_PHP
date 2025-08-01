import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { formatDate, calculateGrade } from '../../lib/utils'
import { Trophy, Clock, Target, TrendingUp, BookOpen } from 'lucide-react'

export default function TestResults() {
  const { data: results, isLoading } = useQuery({
    queryKey: ['student-results'],
    queryFn: async () => {
      const response = await api.get('/student/results')
      return response.data.results
    },
  })

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh'
      }}>
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

  const totalTests = results?.length || 0
  const averageScore = totalTests > 0 
    ? Math.round(results.reduce((acc: number, result: any) => 
        acc + (result.score / result.total_questions) * 100, 0
      ) / totalTests)
    : 0

  const bestScore = totalTests > 0
    ? Math.max(...results.map((r: any) => (r.score / r.total_questions) * 100))
    : 0

  const recentTests = results?.slice(0, 5) || []

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#10b981'
      case 'B': return '#3b82f6'
      case 'C': return '#f59e0b'
      case 'D': return '#f97316'
      case 'F': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981'
    if (percentage >= 70) return '#3b82f6'
    if (percentage >= 60) return '#f59e0b'
    if (percentage >= 50) return '#f97316'
    return '#ef4444'
  }

  const styles = {
    container: {
      maxWidth: '1200px',
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
    resultsCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      marginBottom: '2rem'
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '1.5rem'
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
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#f3f4f6',
      borderRadius: '4px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '4rem 2rem',
      color: '#6b7280'
    },
    emptyIcon: {
      margin: '0 auto 1rem',
      color: '#d1d5db'
    },
    performanceGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem'
    },
    performanceCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)'
    },
    subjectName: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.5rem'
    },
    subjectStats: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '0.875rem',
      color: '#6b7280',
      marginBottom: '0.75rem'
    },
    scoreDisplay: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '0.5rem'
    }
  }

  const subjectPerformance = results?.reduce((acc: any, result: any) => {
    const percentage = (result.score / result.total_questions) * 100
    if (!acc[result.subject]) {
      acc[result.subject] = {
        total: 0,
        count: 0,
        best: 0
      }
    }
    acc[result.subject].total += percentage
    acc[result.subject].count += 1
    acc[result.subject].best = Math.max(acc[result.subject].best, percentage)
    return acc
  }, {}) || {}

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Test Results</h1>
        <p style={styles.subtitle}>
          View your test performance and track your progress
        </p>
      </div>

      {/* Summary Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Total Tests</span>
            <div style={styles.iconContainer}>
              <Target size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{totalTests}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Average Score</span>
            <div style={styles.iconContainer}>
              <TrendingUp size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{averageScore}%</div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${averageScore}%`,
                backgroundColor: getPerformanceColor(averageScore)
              }}
            />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Best Score</span>
            <div style={styles.iconContainer}>
              <Trophy size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{Math.round(bestScore)}%</div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${bestScore}%`,
                backgroundColor: getPerformanceColor(bestScore)
              }}
            />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <span style={styles.statLabel}>Subjects</span>
            <div style={styles.iconContainer}>
              <BookOpen size={24} />
            </div>
          </div>
          <div style={styles.statValue}>{Object.keys(subjectPerformance).length}</div>
        </div>
      </div>

      {/* Subject Performance */}
      {Object.keys(subjectPerformance).length > 0 && (
        <div style={styles.resultsCard}>
          <h3 style={styles.cardTitle}>Performance by Subject</h3>
          <div style={styles.performanceGrid}>
            {Object.entries(subjectPerformance).map(([subject, stats]: [string, any]) => {
              const avgScore = Math.round(stats.total / stats.count)
              return (
                <div key={subject} style={styles.performanceCard}>
                  <div style={styles.subjectName}>{subject}</div>
                  <div style={styles.subjectStats}>
                    <span>{stats.count} test{stats.count !== 1 ? 's' : ''}</span>
                    <span>Best: {Math.round(stats.best)}%</span>
                  </div>
                  <div style={{
                    ...styles.scoreDisplay,
                    color: getPerformanceColor(avgScore)
                  }}>
                    {avgScore}%
                  </div>
                  <div style={styles.progressBar}>
                    <div 
                      style={{
                        ...styles.progressFill,
                        width: `${avgScore}%`,
                        backgroundColor: getPerformanceColor(avgScore)
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Test Results */}
      <div style={styles.resultsCard}>
        <h3 style={styles.cardTitle}>Recent Test Results</h3>
        
        {recentTests.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Test</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Percentage</th>
                <th style={styles.th}>Grade</th>
                <th style={styles.th}>Time Taken</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTests.map((result: any) => {
                const percentage = Math.round((result.score / result.total_questions) * 100)
                const grade = calculateGrade(percentage)
                const timeTaken = Math.round(result.time_taken / 60)
                
                return (
                  <tr key={result.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>
                        {result.test_title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {result.class_level}
                      </div>
                    </td>
                    <td style={styles.td}>{result.subject}</td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>
                        {result.score}/{result.total_questions}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: getPerformanceColor(percentage)
                      }}>
                        {percentage}%
                      </div>
                      <div style={styles.progressBar}>
                        <div 
                          style={{
                            ...styles.progressFill,
                            width: `${percentage}%`,
                            backgroundColor: getPerformanceColor(percentage)
                          }}
                        />
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: getGradeColor(grade)
                      }}>
                        {grade}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} style={{ color: '#9ca3af' }} />
                        {timeTaken} min
                      </div>
                    </td>
                    <td style={styles.td}>{formatDate(result.completed_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>
            <Trophy size={64} style={styles.emptyIcon} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              No test results yet
            </h3>
            <p>Take your first test to see your results and track your progress.</p>
          </div>
        )}
      </div>

      {/* All Results */}
      {results?.length > 5 && (
        <div style={styles.resultsCard}>
          <h3 style={styles.cardTitle}>All Test Results ({results.length})</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Test</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Percentage</th>
                <th style={styles.th}>Grade</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {results?.slice(5).map((result: any) => {
                const percentage = Math.round((result.score / result.total_questions) * 100)
                const grade = calculateGrade(percentage)
                
                return (
                  <tr key={result.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '500', color: '#1f2937' }}>
                        {result.test_title}
                      </div>
                    </td>
                    <td style={styles.td}>{result.subject}</td>
                    <td style={styles.td}>
                      {result.score}/{result.total_questions}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        fontWeight: '600',
                        color: getPerformanceColor(percentage)
                      }}>
                        {percentage}%
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: getGradeColor(grade)
                      }}>
                        {grade}
                      </span>
                    </td>
                    <td style={styles.td}>{formatDate(result.completed_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}