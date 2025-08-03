import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useNavigate } from 'react-router-dom'

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

interface Test {
  id: number
  code: string
  title: string
  subject: string
  class_level: string
  duration_minutes: number
  question_count: number
  is_activated: boolean
  expires_at: string
  created_at: string
  already_participated: boolean
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [availableTests, setAvailableTests] = useState<TestCode[]>([])
  const [recentResults, setRecentResults] = useState<TestResult[]>([])

  useEffect(() => {
    fetchAvailableTests()
    fetchRecentResults()
  }, [])

  const fetchAvailableTests = async () => {
    try {
      const response = await api.get('/student/available-tests')
      setAvailableTests(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch available tests:', error)
    }
  }

  const fetchRecentResults = async () => {
    try {
      const response = await api.get('/student/results')
      setRecentResults(response.data.data?.slice(0, 5) || [])
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
  }



  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-4 sm:p-6 rounded-xl shadow-moderate">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">
          Welcome, {user?.full_name}
        </h1>
        <p className="text-sm opacity-90">
          View your dashboard and take tests when ready
        </p>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="card-title">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/student/test')}
            className="btn-primary btn-lg flex flex-col items-center space-y-2 h-auto py-4"
          >
            <span className="text-2xl">📝</span>
            <span>Take Test</span>
          </button>

          <button
            onClick={() => navigate('/student/results')}
            className="btn-success btn-lg flex flex-col items-center space-y-2 h-auto py-4"
          >
            <span className="text-2xl">📊</span>
            <span>View Results</span>
          </button>
        </div>
      </div>

      {/* Available Tests */}
      {availableTests.length > 0 && (
        <div className="card">
          <h2 className="card-title">
            Available Tests
          </h2>

          <div className="space-y-2">
            {availableTests.map((test) => (
              <div
                key={test.id}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-center mb-2">
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
                      ? 'bg-primary-600 text-white hover:bg-primary-700' 
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  Use Code: {test.code}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h2 className="card-title">
              Recent Results
            </h2>
            <button
              onClick={() => navigate('/student/results')}
              className="btn-link text-xs"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {recentResults.map((result) => (
              <div
                key={result.id}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center"
              >
                <div>
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
  )
}