import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { ClipboardList, Clock, Trophy } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

export default function StudentDashboard() {
  const [testCode, setTestCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const { data: recentResults } = useQuery({
    queryKey: ['student-recent-results'],
    queryFn: async () => {
      const response = await api.get('/api/student/results.php?limit=5')
      return response.data.results
    },
  })

  const handleJoinTest = () => {
    if (!testCode.trim()) {
      setError('Please enter a test code')
      return
    }
    setError('')
    navigate(`/student/take-test/${testCode.trim().toUpperCase()}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Enter a test code to start your test or view your results
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Join Test Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Join Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label htmlFor="testCode" className="text-sm font-medium">
                Test Code
              </label>
              <Input
                id="testCode"
                placeholder="Enter test code (e.g., ABC123)"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button onClick={handleJoinTest} className="w-full">
              Start Test
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tests Completed</span>
                <span className="font-medium">{recentResults?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className="font-medium">
                  {recentResults && recentResults.length > 0
                    ? Math.round(
                        recentResults.reduce((acc: number, result: any) => 
                          acc + (result.score / result.total_questions) * 100, 0
                        ) / recentResults.length
                      ) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentResults && recentResults.length > 0 ? (
            <div className="space-y-3">
              {recentResults.map((result: any) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{result.test_code.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {result.test_code.subject} - {result.test_code.class_level}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {result.score}/{result.total_questions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round((result.score / result.total_questions) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No test results yet. Join a test to get started!
            </div>
          )}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/student/results')}
              className="w-full"
            >
              View All Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
