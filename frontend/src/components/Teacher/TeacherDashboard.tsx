
import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { BookOpen, BarChart3, FileText, Users, Plus, Activity } from 'lucide-react'

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
  const authContext = useContext(AuthContext)
  const user = authContext?.user
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
      // Failed to fetch teacher data
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Questions',
      value: stats.total_questions,
      icon: BookOpen,
      color: '#3b82f6',
      bgColor: 'bg-blue-50',
      route: '/teacher/questions'
    },
    {
      title: 'Subjects',
      value: stats.subjects_count,
      icon: BarChart3,
      color: '#10b981',
      bgColor: 'bg-green-50',
      route: '/teacher/questions'
    },
    {
      title: 'Assignments',
      value: assignments.length,
      icon: FileText,
      color: '#8b5cf6',
      bgColor: 'bg-purple-50',
      route: '/teacher/assignments'
    },
    {
      title: 'This Week',
      value: stats.this_week,
      icon: Activity,
      color: '#ef4444',
      bgColor: 'bg-red-50',
      route: '/teacher/questions'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
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
        {/* Stats Cards - Responsive Grid */}
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

        {/* Quick Actions & Recent Questions - Better Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus size={20} />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/teacher/questions')}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <BookOpen size={20} className="text-blue-600" />
                  <span className="font-medium text-gray-900">Manage Questions</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Questions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={20} />
                Recent Questions
              </h2>
              {stats.recent_questions.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_questions.slice(0, 4).map((question) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            question.question_type === 'multiple_choice' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {question.question_type === 'multiple_choice' ? 'MC' : 'T/F'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                          {question.question_text.substring(0, 80)}
                          {question.question_text.length > 80 ? '...' : ''}
                        </p>
                        <p className="text-xs text-gray-500">Class {question.class_level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No questions found</p>
                  <p className="text-sm text-gray-400 mt-1">Start by uploading some questions!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Assignments */}
        {assignments.length > 0 && (
          <div className="bg-white rounded-lg p-4 lg:p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users size={20} />
                Recent Assignments
              </h2>
              <button
                onClick={() => navigate('/teacher/assignments')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.slice(0, 6).map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.subject}
                    </div>
                    <div className="text-xs text-gray-500">
                      Class {assignment.class_level}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {assignment.term} {assignment.session}
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
    </div>
  )
}

export default TeacherDashboard
