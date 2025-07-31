import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { Clock, CheckCircle } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../lib/api'
import { TestQuestion, TestSubmission } from '../../types'

export default function TakeTest() {
  const { testCode } = useParams()
  const navigate = useNavigate()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [startTime] = useState(Date.now())

  const { data: testData, isLoading, error } = useQuery({
    queryKey: ['test', testCode],
    queryFn: async () => {
      const response = await api.get(`/api/student/take-test.php?code=${testCode}`)
      return response.data
    },
  })

  const submitTestMutation = useMutation({
    mutationFn: async (submission: TestSubmission) => {
      const response = await api.post('/api/student/submit-test.php', submission)
      return response.data
    },
    onSuccess: () => {
      navigate('/student/results')
    },
  })

  useEffect(() => {
    if (testData?.test_code?.duration_minutes) {
      setTimeLeft(testData.test_code.duration_minutes * 60)
    }
  }, [testData])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft])

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmit = () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)
    submitTestMutation.mutate({
      test_code: testCode!,
      answers,
      time_taken: timeTaken
    })
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {(error as any)?.response?.data?.message || 'Failed to load test'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/student')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  if (!testData?.questions?.length) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            This test has no questions or is not available.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/student')}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const question = testData.questions[currentQuestion]
  const isLastQuestion = currentQuestion === testData.questions.length - 1

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Test Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{testData.test_code.title}</h1>
          <p className="text-muted-foreground">
            {testData.test_code.subject} - {testData.test_code.class_level}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </Badge>
          <Badge variant="secondary">
            Question {currentQuestion + 1} of {testData.questions.length}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all"
          style={{ 
            width: `${((currentQuestion + 1) / testData.questions.length) * 100}%` 
          }}
        />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle>Question {currentQuestion + 1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg">{question.question_text}</div>
          
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option) => {
              const optionText = question[`option_${option.toLowerCase()}` as keyof TestQuestion]
              const isSelected = answers[question.id] === option
              
              return (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(question.id, option)}
                  className={`w-full text-left p-4 border rounded-lg transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                      {isSelected && <CheckCircle className="h-4 w-4" />}
                      {!isSelected && option}
                    </div>
                    <span>{optionText}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {!isLastQuestion ? (
            <Button 
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={submitTestMutation.isPending}
            >
              {submitTestMutation.isPending ? 'Submitting...' : 'Submit Test'}
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle>Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {testData.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded text-sm font-medium ${
                  index === currentQuestion
                    ? 'bg-primary text-primary-foreground'
                    : answers[testData.questions[index].id]
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
