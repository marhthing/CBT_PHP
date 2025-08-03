import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import { api } from '../../lib/api'

interface Stats {
  total_questions: number
  subjects_count: number
  this_week: number
  recent_questions: Question[]
}

interface Question {
  id: number
  question_text: string
  class_level: string
  question_type: string
}

interface Assignment {
  id: number
  teacher_name: string
  class_level: string
  subject: string
  term: string
  session: string
  created_at: string
}

const TeacherDashboard: React.FC = () => {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    total_questions: 0,
    subjects_count: 0,
    this_week: 0,
    recent_questions: []
  })
  const [assignments, setAssignments] = useState<Assignment[]>([])

  useEffect(() => {
    fetchTeacherData()
  }, [])

  const fetchTeacherData = async () => {
    try {
      const [statsResponse, assignmentsResponse] = await Promise.all([
        api.get('/teacher/questions?stats=true'),
        api.get('/teacher/assignments')
      ])
      
      const statsData = statsResponse.data.data || {}
      setStats({
        total_questions: statsData.total_questions || 0,
        subjects_count: statsData.subjects_count || 0,
        this_week: statsData.this_week || 0,
        recent_questions: statsData.recent_questions || []
      })
      
      setAssignments(assignmentsResponse.data.data || [])
    } catch (error) {
      console.error('Failed to fetch teacher data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] text-gray-500">
        <div className="flex items-center space-x-3">
          <div className="loading-spinner w-5 h-5"></div>
          Loading dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-4 sm:p-6 rounded-xl shadow-moderate">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">
          Teacher Dashboard
        </h1>
        <p className="text-sm opacity-90">
          Welcome back, {user?.full_name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600 mb-1">
            {stats.total_questions}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Questions
          </div>
        </div>

        <div className="card text-center">
          <div className="text-2xl font-bold text-success-600 mb-1">
            {stats.subjects_count}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Subjects
          </div>
        </div>

        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {assignments.length}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Assignments
          </div>
        </div>

        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {stats.this_week}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            This Week
          </div>
        </div>
      </div>

      {/* Recent Questions */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h2 className="card-title">
            Recent Questions
          </h2>
          <button
            onClick={() => navigate('/teacher/questions')}
            className="btn-link text-xs"
          >
            View All
          </button>
        </div>
        
        {stats.recent_questions.length > 0 ? (
          <div className="space-y-2">
            {stats.recent_questions.slice(0, 5).map((question) => (
              <div
                key={question.id}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="text-sm font-medium text-gray-900 mb-1 leading-relaxed">
                  {question.question_text.substring(0, 80)}
                  {question.question_text.length > 80 ? '...' : ''}
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    Class {question.class_level}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    question.question_type === 'multiple_choice' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {question.question_type === 'multiple_choice' ? 'MC' : 'T/F'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm py-6">
            No questions found. Start by uploading some questions!
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="card-title">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/teacher/questions')}
            className="btn-primary btn-lg flex flex-col items-center space-y-2 h-auto py-4"
          >
            <span className="text-2xl">📚</span>
            <span>Manage Questions</span>
          </button>

          <button
            onClick={() => navigate('/teacher/bulk-upload')}
            className="btn-success btn-lg flex flex-col items-center space-y-2 h-auto py-4"
          >
            <span className="text-2xl">📤</span>
            <span>Bulk Upload</span>
          </button>

          <button
            onClick={() => navigate('/teacher/classes')}
            className="btn-warning btn-lg flex flex-col items-center space-y-2 h-auto py-4"
          >
            <span className="text-2xl">🎓</span>
            <span>View Classes</span>
          </button>
        </div>
      </div>

      {/* Recent Assignments */}
      {assignments.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h2 className="card-title">
              Recent Assignments
            </h2>
            <button
              onClick={() => navigate('/teacher/assignments')}
              className="btn-link text-xs"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {assignments.slice(0, 5).map((assignment) => (
              <div
                key={assignment.id}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium text-gray-900">
                    {assignment.subject} - Class {assignment.class_level}
                  </div>
                  <div className="text-xs text-gray-500">
                    {assignment.term} {assignment.session}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Created: {new Date(assignment.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherDashboard