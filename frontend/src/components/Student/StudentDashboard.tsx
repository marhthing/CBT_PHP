import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { BookOpen, BarChart3 } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome, {user?.full_name}</h1>
            <p className="text-gray-600 mt-1">What would you like to do today?</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Main Action Buttons */}
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={() => navigate('/student/test')}
            className="w-full flex items-center justify-center gap-4 p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <BookOpen size={32} />
            <div className="text-left">
              <div className="text-xl font-semibold">Take Test</div>
              <div className="text-blue-100 text-sm">Enter test code and start exam</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/student/results')}
            className="w-full flex items-center justify-center gap-4 p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <BarChart3 size={32} />
            <div className="text-left">
              <div className="text-xl font-semibold">View Results</div>
              <div className="text-green-100 text-sm">Check your test performance</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}