import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { FileText, Upload, Users, BookOpen } from 'lucide-react'

export default function TeacherDashboard() {
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      const response = await api.get('/api/teacher/questions.php?stats=true')
      return response.data
    },
  })

  const { data: classes } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: async () => {
      const response = await api.get('/api/teacher/classes.php')
      return response.data.classes
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your questions and track your teaching activities
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.subjects_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.this_week || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Question Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Create, edit, and organize your questions by subject and class level.
            </p>
            <Button 
              onClick={() => navigate('/teacher/questions')}
              className="w-full"
            >
              Manage Questions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Upload multiple questions at once using CSV or Excel files.
            </p>
            <Button 
              onClick={() => navigate('/teacher/bulk-upload')}
              variant="outline"
              className="w-full"
            >
              Bulk Upload
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classes && classes.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((assignment: any) => (
                <div key={assignment.id} className="border rounded-lg p-3">
                  <div className="font-medium">{assignment.subject}</div>
                  <div className="text-sm text-muted-foreground">
                    Class {assignment.class_level}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No classes assigned yet. Contact your administrator.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recent_questions && stats.recent_questions.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_questions.map((question: any) => (
                <div key={question.id} className="border rounded-lg p-3">
                  <div className="font-medium truncate">{question.question_text}</div>
                  <div className="text-sm text-muted-foreground">
                    {question.subject} - {question.class_level} ({question.difficulty})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No questions created yet. Start by adding your first question.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
