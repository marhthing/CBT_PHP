import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { formatDate, calculateGrade } from '../../lib/utils'
import { Trophy, Clock, Target } from 'lucide-react'

export default function TestResults() {
  const { data: results, isLoading } = useQuery({
    queryKey: ['student-results'],
    queryFn: async () => {
      const response = await api.get('/api/student/results.php')
      return response.data.results
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalTests = results?.length || 0
  const averageScore = totalTests > 0 
    ? Math.round(results.reduce((acc: number, result: any) => 
        acc + (result.score / result.total_questions) * 100, 0
      ) / totalTests)
    : 0

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500'
      case 'B': return 'bg-blue-500'
      case 'C': return 'bg-yellow-500'
      case 'D': return 'bg-orange-500'
      case 'F': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Results</h1>
        <p className="text-muted-foreground">
          View your test performance and track your progress
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTests > 0 ? calculateGrade(averageScore, 100) : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle>All Results</CardTitle>
        </CardHeader>
        <CardContent>
          {results && results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result: any) => {
                const percentage = Math.round((result.score / result.total_questions) * 100)
                const grade = calculateGrade(result.score, result.total_questions)
                
                return (
                  <div key={result.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{result.test_code.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.test_code.subject} - {result.test_code.class_level}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatDate(result.submitted_at)}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${getGradeColor(grade)} text-white`}
                          >
                            Grade {grade}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold">
                          {result.score}/{result.total_questions}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getGradeColor(grade)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No test results found. Take your first test to see results here!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
