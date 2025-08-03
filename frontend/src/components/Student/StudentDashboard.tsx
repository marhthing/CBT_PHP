
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  BarChart3, 
  FileText, 
  Clock, 
  TrendingUp, 
  Award 
} from 'lucide-react'

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

interface TestResult {
  id: number
  score: number
  total_questions: number
  percentage: number
  test_title: string
  subject: string
  submitted_at: string
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [availableTests, setAvailableTests] = useState<TestCode[]>([])
  const [recentResults, setRecentResults] = useState<TestResult[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [testsResponse, resultsResponse] = await Promise.all([
        api.get('/student/available-tests'),
        api.get('/student/results')
      ])
      
      setAvailableTests(testsResponse.data.data || [])
      setRecentResults(resultsResponse.data.data?.slice(0, 4) || [])
    } catch (error) {
      // Failed to fetch dashboard data
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Available Tests',
      value: availableTests.length,
      color: '#3b82f6',
      bgColor: 'bg-blue-50',
      icon: FileText,
      route: '/student/test'
    },
    {
      title: 'Tests Completed',
      value: recentResults.length,
      color: '#10b981',
      bgColor: 'bg-green-50',
      icon: Award,
      route: '/student/results'
    },
    {
      title: 'Average Score',
      value: recentResults.length > 0 
        ? `${Math.round(recentResults.reduce((sum, result) => sum + result.percentage, 0) / recentResults.length)}%`
        : '0%',
      color: '#8b5cf6',
      bgColor: 'bg-purple-50',
      icon: TrendingUp,
      route: '#'
    },
    {
      title: 'Best Score',
      value: recentResults.length > 0 
        ? `${Math.max(...recentResults.map(r => r.percentage))}%`
        : '0%',
      color: '#f59e0b',
      bgColor: 'bg-yellow-50',
      icon: BarChart3,
      route: '#'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.full_name}</p>
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
                onClick={() => card.route !== '#' && navigate(card.route)}
                className={`${card.bgColor} rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
                  card.route !== '#' ? 'cursor-pointer hover:scale-105' : ''
                }`}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/student/test')}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <FileText size={20} className="text-blue-600" />
                  <span className="font-medium text-gray-900">Take Test</span>
                </button>
                <button
                  onClick={() => navigate('/student/results')}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <BarChart3 size={20} className="text-green-600" />
                  <span className="font-medium text-gray-900">View Results</span>
                </button>
              </div>
            </div>
          </div>

          {/* Available Tests & Recent Results */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-6">
              {/* Available Tests */}
              {availableTests.length > 0 && (
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
              )}

              {/* Recent Results */}
              {recentResults.length > 0 && (
                <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Award size={20} />
                      Recent Results
                    </h2>
                    <button
                      onClick={() => navigate('/student/results')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {result.test_title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.subject} • {new Date(result.submitted_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          result.percentage >= 50 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
