import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { BookOpen, Users, FileText, ClipboardList, TrendingUp, Plus, Eye, Settings } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/questions?stats=true')
      return response.data
    },
  })

  const { data: recentTests } = useQuery({
    queryKey: ['admin-recent-tests'],
    queryFn: async () => {
      const response = await api.get('/admin/test-codes?recent=true')
      return response.data.test_codes
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
    recentSection: {
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
    }
  }

  const statCards = [
    {
      label: 'Total Questions',
      value: stats?.total_questions || 0,
      change: `+${stats?.questions_this_week || 0} this week`,
      icon: FileText,
      color: '#3b82f6'
    },
    {
      label: 'Active Test Codes',
      value: stats?.active_test_codes || 0,
      change: `+${stats?.tests_this_month || 0} this month`,
      icon: BookOpen,
      color: '#10b981'
    },
    {
      label: 'Total Teachers',
      value: stats?.total_teachers || 0,
      change: `${stats?.active_teachers || 0} active`,
      icon: Users,
      color: '#f59e0b'
    },
    {
      label: 'Tests Completed',
      value: stats?.completed_tests || 0,
      change: `${stats?.completion_rate || 0}% completion rate`,
      icon: ClipboardList,
      color: '#8b5cf6'
    }
  ]

  const quickActions = [
    {
      title: 'Manage Test Codes',
      description: 'Generate new test codes, configure test settings, and monitor active tests across all subjects.',
      icon: BookOpen,
      primaryAction: () => navigate('/admin/test-codes'),
      primaryLabel: 'Manage Codes',
      secondaryAction: () => navigate('/admin/test-codes?action=create'),
      secondaryLabel: 'Create New'
    },
    {
      title: 'Teacher Management',
      description: 'Assign teachers to subjects, manage permissions, and track teaching activities and performance.',
      icon: Users,
      primaryAction: () => navigate('/admin/teachers'),
      primaryLabel: 'View Teachers',
      secondaryAction: () => navigate('/admin/teachers?action=assign'),
      secondaryLabel: 'Assign'
    },
    {
      title: 'Question Bank',
      description: 'Browse, review, and manage all questions from teachers. Monitor quality and approve submissions.',
      icon: FileText,
      primaryAction: () => navigate('/admin/questions'),
      primaryLabel: 'View All',
      secondaryAction: () => navigate('/admin/questions?filter=pending'),
      secondaryLabel: 'Review'
    }
  ]

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <p style={styles.subtitle}>
          Comprehensive management for Sure Foundation Comprehensive School CBT System
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

      {/* Recent Activity */}
      <div style={styles.recentSection}>
        <h2 style={styles.sectionTitle}>
          <TrendingUp size={24} />
          Recent Test Activity
        </h2>
        {recentTests && recentTests.length > 0 ? (
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>Test Code</th>
                <th style={styles.tableHeaderCell}>Subject</th>
                <th style={styles.tableHeaderCell}>Class</th>
                <th style={styles.tableHeaderCell}>Created</th>
                <th style={styles.tableHeaderCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTests.slice(0, 5).map((test: any, index: number) => (
                <tr key={index}>
                  <td style={styles.tableCell}>
                    <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{test.code}</span>
                  </td>
                  <td style={styles.tableCell}>{test.subject}</td>
                  <td style={styles.tableCell}>{test.class}</td>
                  <td style={styles.tableCell}>{new Date(test.created_at).toLocaleDateString()}</td>
                  <td style={styles.tableCell}>
                    <span style={styles.badge}>{test.status || 'Active'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <ClipboardList size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No recent test activity found.</p>
          </div>
        )}
      </div>
    </div>
  )
}