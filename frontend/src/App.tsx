import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/MobileBottomBar'
import SimpleLogin from './components/Auth/SimpleLogin'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import StudentDashboard from './components/Student/StudentDashboard'
import TakeTest from './components/Student/TakeTest'
import TestResults from './components/Student/TestResults'
import TeacherDashboard from './components/Teacher/TeacherDashboard'
import TeacherAllQuestions from './components/Teacher/TeacherAllQuestions'
import AdminDashboard from './components/Admin/AdminDashboard'
import TestCodeManager from './components/Admin/TestCodeManager'
import TeacherAssignment from './components/Admin/TeacherAssignment'
import AllQuestions from './components/Admin/AllQuestions'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
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

  return (
    <Routes>
      {/* Login route - no layout */}
      <Route 
        path="/login" 
        element={!user ? <SimpleLogin /> : <Navigate to="/" replace />} 
      />
      
      {/* All other routes require authentication and use layout */}
      <Route
        path="/*"
        element={
          user ? (
            <Layout>
              <Routes>
                {/* Root redirect based on user role */}
                <Route
                  path="/"
                  element={
                    user.role === 'student' ? <Navigate to="/student" replace /> :
                    user.role === 'teacher' ? <Navigate to="/teacher" replace /> :
                    user.role === 'admin' ? <Navigate to="/admin" replace /> :
                    <Navigate to="/login" replace />
                  }
                />

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
                  path="/student/test"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <TakeTest />
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
                      <TeacherAllQuestions />
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

                {/* Catch all - redirect to appropriate dashboard */}
                <Route 
                  path="*" 
                  element={<Navigate to="/" replace />} 
                />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

export default App