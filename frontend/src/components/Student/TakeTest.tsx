import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../lib/api'
import { TestQuestion, TestSubmission } from '../../types'
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'

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
      const response = await api.get(`/student/take-test?code=${testCode}`)
      return response.data
    },
  })

  const submitTestMutation = useMutation({
    mutationFn: async (submission: TestSubmission) => {
      const response = await api.post('/student/submit-test', submission)
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

  const getTimeColor = (seconds: number) => {
    if (seconds < 300) return '#ef4444' // Red for < 5 minutes
    if (seconds < 600) return '#f59e0b' // Yellow for < 10 minutes
    return '#10b981' // Green for > 10 minutes
  }

  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '1.5rem 2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    testInfo: {
      flex: 1
    },
    testTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '0.5rem'
    },
    testMeta: {
      fontSize: '0.875rem',
      color: '#64748b',
      display: 'flex',
      gap: '1rem',
      alignItems: 'center'
    },
    timer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      borderRadius: '12px',
      fontSize: '1.125rem',
      fontWeight: '700',
      color: 'white'
    },
    progressBar: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '1.5rem 2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      marginBottom: '2rem'
    },
    progressHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1rem'
    },
    progressText: {
      fontSize: '0.875rem',
      color: '#64748b'
    },
    progressTrack: {
      width: '100%',
      height: '8px',
      backgroundColor: '#f1f5f9',
      borderRadius: '4px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#4f46e5',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    },
    questionCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      marginBottom: '2rem'
    },
    questionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem'
    },
    questionNumber: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#4f46e5',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em'
    },
    questionText: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1e293b',
      lineHeight: '1.6',
      marginBottom: '2rem'
    },
    optionsGrid: {
      display: 'grid',
      gap: '1rem'
    },
    option: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem 1.5rem',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: '#ffffff'
    },
    optionSelected: {
      borderColor: '#4f46e5',
      backgroundColor: '#f8faff'
    },
    optionRadio: {
      width: '20px',
      height: '20px',
      border: '2px solid #d1d5db',
      borderRadius: '50%',
      position: 'relative' as const,
      flexShrink: 0
    },
    optionRadioSelected: {
      borderColor: '#4f46e5'
    },
    optionRadioDot: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '10px',
      height: '10px',
      backgroundColor: '#4f46e5',
      borderRadius: '50%'
    },
    optionLabel: {
      fontWeight: '600',
      color: '#4f46e5',
      marginRight: '0.75rem',
      fontSize: '1rem'
    },
    optionText: {
      color: '#374151',
      fontSize: '1rem',
      flex: 1
    },
    navigation: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '1.5rem 2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    navButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'white',
      color: '#374151'
    },
    submitButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 2rem',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)'
    },
    alert: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '0.875rem',
      marginBottom: '1rem'
    },
    alertError: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      color: '#6b7280',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'color 0.2s ease',
      marginBottom: '1rem'
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh'
    }
  }

  if (isLoading) {
    return (
      <div style={styles.loading}>
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

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.alert}>
          <AlertCircle size={20} />
          <span>{(error as any)?.response?.data?.message || 'Failed to load test'}</span>
        </div>
        <button
          style={styles.navButton}
          onClick={() => navigate('/student')}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!testData?.questions?.length) {
    return (
      <div style={styles.container}>
        <div style={styles.alert}>
          <AlertCircle size={20} />
          <span>This test has no questions or is not available.</span>
        </div>
        <button
          style={styles.navButton}
          onClick={() => navigate('/student')}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const question = testData.questions[currentQuestion]
  const isLastQuestion = currentQuestion === testData.questions.length - 1
  const totalQuestions = testData.questions.length
  const answeredQuestions = Object.keys(answers).length
  const progress = ((currentQuestion + 1) / totalQuestions) * 100

  return (
    <div style={styles.container}>
      {/* Test Header */}
      <div style={styles.header}>
        <div style={styles.testInfo}>
          <h1 style={styles.testTitle}>{testData.test_code.title}</h1>
          <div style={styles.testMeta}>
            <span>{testData.test_code.subject}</span>
            <span>•</span>
            <span>{testData.test_code.class_level}</span>
            <span>•</span>
            <span>{totalQuestions} Questions</span>
          </div>
        </div>
        <div style={{
          ...styles.timer,
          backgroundColor: getTimeColor(timeLeft)
        }}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressBar}>
        <div style={styles.progressHeader}>
          <span style={styles.progressText}>
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span style={styles.progressText}>
            {answeredQuestions} answered
          </span>
        </div>
        <div style={styles.progressTrack}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${progress}%`
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div style={styles.questionCard}>
        <div style={styles.questionHeader}>
          <span style={styles.questionNumber}>
            Question {currentQuestion + 1}
          </span>
        </div>
        
        <div style={styles.questionText}>
          {question.question_text}
        </div>

        <div style={styles.optionsGrid}>
          {['A', 'B', 'C', 'D'].map((option) => {
            const optionText = question[`option_${option.toLowerCase()}`]
            const isSelected = answers[question.id] === option
            
            return (
              <div
                key={option}
                style={{
                  ...styles.option,
                  ...(isSelected ? styles.optionSelected : {})
                }}
                onClick={() => handleAnswerSelect(question.id, option)}
              >
                <div style={{
                  ...styles.optionRadio,
                  ...(isSelected ? styles.optionRadioSelected : {})
                }}>
                  {isSelected && <div style={styles.optionRadioDot} />}
                </div>
                <span style={styles.optionLabel}>{option}.</span>
                <span style={styles.optionText}>{optionText}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={styles.navigation}>
        <button
          style={{
            ...styles.navButton,
            opacity: currentQuestion === 0 ? 0.5 : 1,
            cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer'
          }}
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft size={16} />
          Previous
        </button>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {!isLastQuestion ? (
            <button
              style={styles.navButton}
              onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              style={styles.submitButton}
              onClick={handleSubmit}
              disabled={submitTestMutation.isPending}
            >
              {submitTestMutation.isPending ? 'Submitting...' : 'Submit Test'}
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}