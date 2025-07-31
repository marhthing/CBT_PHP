import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Login from './components/Auth/Login'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import StudentDashboard from './components/Student/StudentDashboard'
import TakeTest from './components/Student/TakeTest'
import TestResults from './components/Student/TestResults'
import TeacherDashboard from './components/Teacher/TeacherDashboard'
import QuestionManager from './components/Teacher/QuestionManager'
import BulkUpload from './components/Teacher/BulkUpload'
import AdminDashboard from './components/Admin/AdminDashboard'
import TestCodeManager from './components/Admin/TestCodeManager'
import TeacherAssignment from './components/Admin/TeacherAssignment'
import AllQuestions from './components/Admin/AllQuestions'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/take-test/:testCode"
          element={
            <ProtectedRoute requiredRole="student">
              <TakeTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/results"
          element={
            <ProtectedRoute requiredRole="student">
              <TestResults />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/questions"
          element={
            <ProtectedRoute requiredRole="teacher">
              <QuestionManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/bulk-upload"
          element={
            <ProtectedRoute requiredRole="teacher">
              <BulkUpload />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/test-codes"
          element={
            <ProtectedRoute requiredRole="admin">
              <TestCodeManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute requiredRole="admin">
              <TeacherAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <ProtectedRoute requiredRole="admin">
              <AllQuestions />
            </ProtectedRoute>
          }
        />

        {/* Default redirects */}
        <Route
          path="/"
          element={
            <Navigate
              to={
                user.role === 'student'
                  ? '/student'
                  : user.role === 'teacher'
                  ? '/teacher'
                  : '/admin'
              }
              replace
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
