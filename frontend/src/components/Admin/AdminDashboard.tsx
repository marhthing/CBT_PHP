import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { BookOpen, Users, FileText, ClipboardList, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/api/admin/questions.php?stats=true')
      return response.data
    },
  })

  const { data: recentTests } = useQuery({
    queryKey: ['admin-recent-tests'],
    queryFn: async () => {
      const response = await api.get('/api/admin/test-codes.php?recent=true')
      return response.data.test_codes
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage the CBT system, oversee tests, and monitor system-wide activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_questions || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.questions_this_week || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Test Codes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_tests || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_tests || 0} total created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_teachers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.assigned_teachers || 0} with assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Submissions</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_submissions || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.submissions_today || 0} today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Test Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Create and manage test codes for students to access tests.
            </p>
            <Button 
              onClick={() => navigate('/admin/test-codes')}
              className="w-full"
            >
              Manage Test Codes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teacher Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Assign teachers to classes and subjects for question management.
            </p>
            <Button 
              onClick={() => navigate('/admin/teachers')}
              variant="outline"
              className="w-full"
            >
              Manage Teachers
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Question Bank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              View and manage all questions across all subjects and teachers.
            </p>
            <Button 
              onClick={() => navigate('/admin/questions')}
              variant="outline"
              className="w-full"
            >
              View All Questions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Test Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Test Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTests && recentTests.length > 0 ? (
            <div className="space-y-3">
              {recentTests.map((test: any) => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{test.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {test.subject} - {test.class_level} | Code: {test.code}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      test.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {test.is_active ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {test.question_count} questions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No test codes created yet. Create your first test code to get started!
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.subject_stats && stats.subject_stats.length > 0 ? (
              <div className="space-y-3">
                {stats.subject_stats.map((subject: any) => (
                  <div key={subject.subject} className="flex items-center justify-between">
                    <span className="text-sm">{subject.subject}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(subject.question_count / stats.total_questions) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">
                        {subject.question_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.class_stats && stats.class_stats.length > 0 ? (
              <div className="space-y-3">
                {stats.class_stats.map((cls: any) => (
                  <div key={cls.class_level} className="flex items-center justify-between">
                    <span className="text-sm">Class {cls.class_level}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(cls.question_count / stats.total_questions) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">
                        {cls.question_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
