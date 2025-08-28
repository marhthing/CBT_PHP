import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import { 
  Trophy, 
  TrendingUp, 
  Award, 
  BookOpen,
  Filter,
  RefreshCw,
  FileText,
  Clock
} from 'lucide-react'

interface TestResult {
  id: number
  score: number
  total_questions: number
  max_possible_score: number
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
    test_type: string
  }
}

interface TestCode {
  id: number
  code: string
  title: string
  subject: string
  class_level: string
  duration_minutes: number
  question_count: number
  is_active: boolean
  is_activated: boolean
}

interface FilterOptions {
  subject: string
  term: string
  session: string
}

export default function TestResults() {
  const navigate = useNavigate()
  const [results, setResults] = useState<TestResult[]>([])
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([])
  const [availableTests, setAvailableTests] = useState<TestCode[]>([])
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
      const [resultsResponse, testsResponse] = await Promise.all([
        api.get('/student/results'),
        api.get('/student/available-tests')
      ])
      setResults(resultsResponse.data.data?.results || [])
      setAvailableTests(testsResponse.data.data || [])
    } catch (error) {
      // Failed to fetch results
    } finally {
      setLoading(false)
    }
  }

  const fetchLookupData = async () => {
    try {
      const response = await api.get('/system/lookup')
      setLookupData(response.data.data || {})
    } catch (error) {
      // Failed to fetch lookup data
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

  const getTestTypeColor = (testType: string) => {
    switch (testType) {
      case 'First CA':
        return 'bg-blue-100 text-blue-800'
      case 'Second CA':
        return 'bg-green-100 text-green-800'
      case 'Examination':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const statCards = [
    {
      title: 'Total Tests',
      value: filteredResults.length,
      color: '#3b82f6',
      bgColor: 'bg-blue-50',
      icon: BookOpen
    },
    {
      title: 'Average Score',
      value: filteredResults.length > 0 
        ? `${Math.round(filteredResults.reduce((sum, result) => sum + result.percentage, 0) / filteredResults.length)}%`
        : '0%',
      color: '#10b981',
      bgColor: 'bg-green-50',
      icon: TrendingUp
    },
    {
      title: 'Best Score',
      value: filteredResults.length > 0 
        ? `${Math.max(...filteredResults.map(r => r.percentage))}%`
        : '0%',
      color: '#8b5cf6',
      bgColor: 'bg-purple-50',
      icon: Trophy
    },
    {
      title: 'Passed',
      value: filteredResults.filter(r => r.percentage >= 50).length,
      color: '#f59e0b',
      bgColor: 'bg-yellow-50',
      icon: Award
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading results...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Test Results</h1>
            <p className="text-gray-600 mt-1">View your test performance and grades</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="text-sm text-gray-500">
              <span className="font-medium">Last Updated:</span> {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {statCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <div
                key={index}
                className={`${card.bgColor} rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold" style={{ color: card.color }}>
                      {card.value}
                    </p>
                  </div>
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: card.color, opacity: 0.1 }}
                  >
                    <IconComponent size={24} style={{ color: card.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions & Available Tests */}
        {availableTests.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Action */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen size={20} />
                  Quick Action
                </h2>
                <button
                  onClick={() => navigate('/student/test')}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <FileText size={20} className="text-blue-600" />
                  <span className="font-medium text-gray-900">Take New Test</span>
                </button>
              </div>
            </div>

            {/* Available Tests */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={20} />
                  Available Tests
                </h2>
                <div className="space-y-3">
                  {availableTests.slice(0, 3).map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {test.title}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            test.is_activated 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {test.is_activated ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {test.subject} • {test.class_level} • {test.duration_minutes} min • {test.question_count} questions
                        </div>
                        <button
                          onClick={() => navigate(`/student/test?code=${test.code}`)}
                          disabled={!test.is_activated}
                          className={`px-3 py-1.5 rounded text-xs font-medium ${
                            test.is_activated 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-gray-400 text-white cursor-not-allowed'
                          }`}
                        >
                          Use Code: {test.code}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter size={20} />
            Filter Results
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term
              </label>
              <select
                value={filters.term}
                onChange={(e) => setFilters(prev => ({ ...prev, term: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session
              </label>
              <select
                value={filters.session}
                onChange={(e) => setFilters(prev => ({ ...prev, session: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sessions</option>
                {lookupData.sessions?.map((session: any) => (
                  <option key={session.id} value={session.name}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Results History</h2>
          </div>

          {filteredResults.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredResults.map((result) => {
                const gradeColors = getGradeColor(result.percentage)
                return (
                  <div
                    key={result.id}
                    className="p-4 lg:p-6 hover:bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {result.test_code?.title}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Subject:</span> {result.test_code?.subject}
                          </div>
                          <div>
                            <span className="font-medium">Class:</span> {result.test_code?.class_level}
                          </div>
                          <div>
                            <span className="font-medium">Code:</span> {result.test_code?.code}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {new Date(result.submitted_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> 
                            <span className={`ml-1 px-2 py-1 text-xs rounded-full font-medium ${getTestTypeColor(result.test_code?.test_type)}`}>
                              {result.test_code?.test_type || 'First CA'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {result.score}/{result.max_possible_score}
                          </div>
                          <div className="text-sm text-gray-500">Score</div>
                        </div>

                        <div className="text-center">
                          <div 
                            className="px-3 py-1 rounded-lg text-lg font-bold"
                            style={{ backgroundColor: gradeColors.bg, color: gradeColors.color }}
                          >
                            {result.percentage}%
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Grade: {
                              result.percentage >= 80 ? 'A' :
                              result.percentage >= 70 ? 'B' :
                              result.percentage >= 60 ? 'C' :
                              result.percentage >= 50 ? 'D' : 'F'
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Duration:</span> {Math.round(result.time_taken / 60)} min
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {
                          result.percentage >= 50 ? 
                          <span className="text-green-600 font-semibold">Passed</span> : 
                          <span className="text-red-600 font-semibold">Failed</span>
                        }
                      </div>
                      <div>
                        <span className="font-medium">Questions:</span> {result.total_questions}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Results Found
              </h3>
              <p className="text-gray-600">
                {results.length === 0 ? 
                  "You haven't taken any tests yet. Start by entering a test code!" :
                  "No results match your current filters. Try adjusting the filter options."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}