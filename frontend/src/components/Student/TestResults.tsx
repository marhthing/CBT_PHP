import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface TestResult {
  id: number
  score: number
  total_questions: number
  percentage: number
  grade: string
  time_taken: number
  submitted_at: string
  test_code: {
    code: string
    title: string
    subject: string
    class_level: string
    duration_minutes: number
  }
}

interface FilterOptions {
  subject: string
  term: string
  session: string
}

export default function TestResults() {
  const [results, setResults] = useState<TestResult[]>([])
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterOptions>({
    subject: '',
    term: '',
    session: ''
  })
  const [lookupData, setLookupData] = useState<any>({})

  useEffect(() => {
    fetchResults()
    fetchLookupData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [results, filters])

  const fetchResults = async () => {
    try {
      const response = await api.get('/student/results')
      console.log('API Response:', response.data) // Debug log
      setResults(response.data.data?.results || [])
    } catch (error) {
      console.error('Failed to fetch results:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLookupData = async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || {})
    } catch (error) {
      console.error('Failed to fetch lookup data:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...results]

    if (filters.subject) {
      filtered = filtered.filter(result => result.test_code?.subject === filters.subject)
    }

    setFilteredResults(filtered)
  }

  const resetFilters = () => {
    setFilters({ subject: '', term: '', session: '' })
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return { bg: '#dcfce7', color: '#166534' }
    if (percentage >= 70) return { bg: '#fef3c7', color: '#92400e' }
    if (percentage >= 50) return { bg: '#dbeafe', color: '#1e40af' }
    return { bg: '#fef2f2', color: '#dc2626' }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        color: '#64748b'
      }}>
        Loading results...
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '100%',
      margin: '0 auto',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        padding: '20px 16px',
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          margin: '0 0 4px 0'
        }}>
          Test Results
        </h1>
        <p style={{ 
          fontSize: '14px', 
          opacity: 0.9,
          margin: '0'
        }}>
          View your test performance and grades
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Subject
              </label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="">All Subjects</option>
                {lookupData.subjects?.map((subject: any) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Term
              </label>
              <select
                value={filters.term}
                onChange={(e) => setFilters(prev => ({ ...prev, term: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="">All Terms</option>
                {lookupData.terms?.map((term: any) => (
                  <option key={term.id} value={term.name}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Session
              </label>
              <select
                value={filters.session}
                onChange={(e) => setFilters(prev => ({ ...prev, session: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                <option value="">All Sessions</option>
                {lookupData.sessions?.map((session: any) => (
                  <option key={session.id} value={session.name}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={resetFilters}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              alignSelf: 'flex-start'
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      {filteredResults.length > 0 && (
        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1e40af'
              }}>
                {filteredResults.length}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Total Tests
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#059669'
              }}>
                {Math.round(filteredResults.reduce((sum, result) => sum + result.percentage, 0) / filteredResults.length)}%
              </div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Average Score
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#7c3aed'
              }}>
                {Math.max(...filteredResults.map(r => r.percentage))}%
              </div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Best Score
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#dc2626'
              }}>
                {filteredResults.filter(r => r.percentage >= 50).length}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Passed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {filteredResults.length > 0 ? (
          <div>
            {filteredResults.map((result) => {
              const gradeColors = getGradeColor(result.percentage)
              return (
                <div
                  key={result.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: '0 0 4px 0'
                      }}>
                        {result.test_code?.title}
                      </h3>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '4px'
                      }}>
                        {result.test_code?.subject} • {result.test_code?.class_level}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#94a3b8'
                      }}>
                        Code: {result.test_code?.code} • {new Date(result.submitted_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'right'
                    }}>
                      {/* Primary Score Display */}
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '800',
                        color: '#1e293b',
                        marginBottom: '2px'
                      }}>
                        {result.score}/{result.total_questions}
                      </div>
                      {/* Secondary Percentage Display */}
                      <div style={{
                        background: gradeColors.bg,
                        color: gradeColors.color,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {result.percentage}%
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '12px',
                    fontSize: '11px',
                    color: '#64748b'
                  }}>
                    <div>
                      <span style={{ fontWeight: '500' }}>Duration:</span> {Math.round(result.time_taken / 60)} min
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>Grade:</span> {
                        result.percentage >= 80 ? 'A' :
                        result.percentage >= 70 ? 'B' :
                        result.percentage >= 60 ? 'C' :
                        result.percentage >= 50 ? 'D' : 'F'
                      }
                    </div>
                    <div>
                      <span style={{ fontWeight: '500' }}>Status:</span> {
                        result.percentage >= 50 ? 'Passed' : 'Failed'
                      }
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 8px 0'
            }}>
              No Results Found
            </h3>
            <p style={{
              fontSize: '14px',
              margin: '0',
              opacity: 0.8
            }}>
              {results.length === 0 ? 
                "You haven't taken any tests yet. Start by entering a test code!" :
                "No results match your current filters. Try adjusting the filter options."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}