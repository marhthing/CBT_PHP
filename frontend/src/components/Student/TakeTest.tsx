import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

interface TestData {
  id: number
  title: string
  subject: string
  class_level: string
  duration_minutes: number
  questions: Question[]
}

export default function TakeTest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { testCode } = useParams()
  const [searchParams] = useSearchParams()
  const queryCode = searchParams.get('code')
  const [inputTestCode, setInputTestCode] = useState(testCode || queryCode || '')
  const [testData, setTestData] = useState<TestData | null>(null)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [testStarted, setTestStarted] = useState(false)

  useEffect(() => {
    const codeToUse = testCode || queryCode
    if (codeToUse) {
      validateAndStartTest(codeToUse)
    }
  }, [testCode, queryCode])

  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [testStarted, timeLeft])

  const validateTestCode = async () => {
    if (!inputTestCode.trim()) {
      setError('Please enter a test code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/student/validate-test-code', {
        test_code: inputTestCode.toUpperCase()
      })

      if (response.data.success) {
        validateAndStartTest(inputTestCode.toUpperCase())
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid test code')
    } finally {
      setLoading(false)
    }
  }

  const validateAndStartTest = async (code: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get(`/student/take-test?test_code=${code}`)
      
      if (response.data.success) {
        const test = response.data.data
        setTestData(test)
        setTimeLeft(test.duration_minutes * 60)
        setTestStarted(true)
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to start test')
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const nextQuestion = () => {
    if (currentQuestion < (testData?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const submitTest = async () => {
    if (submitting) return

    setSubmitting(true)

    try {
      await api.post('/student/submit-test', {
        test_code: inputTestCode.toUpperCase(),
        answers
      })

      navigate('/student/results', { 
        state: { message: 'Test submitted successfully!' }
      })
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit test')
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeLeft <= 300) return '#dc2626' // Red for last 5 minutes
    if (timeLeft <= 600) return '#f59e0b' // Yellow for last 10 minutes
    return '#059669' // Green
  }

  if (!testStarted) {
    return (
      <div style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
          color: 'white',
          padding: '20px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            margin: '0 0 8px 0'
          }}>
            Enter Test Code
          </h1>
          <p style={{ 
            fontSize: '14px', 
            opacity: 0.9,
            margin: '0'
          }}>
            Get your test code from your teacher
          </p>
        </div>

        {/* Test Code Form */}
        <div style={{
          background: 'white',
          padding: '24px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Test Code
            </label>
            <input
              type="text"
              value={inputTestCode}
              onChange={(e) => setInputTestCode(e.target.value.toUpperCase())}
              placeholder="Enter test code (e.g., TEST123)"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: '600'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              onKeyPress={(e) => e.key === 'Enter' && validateTestCode()}
            />
          </div>

          <button
            onClick={validateTestCode}
            disabled={loading || !inputTestCode.trim()}
            style={{
              width: '100%',
              background: loading || !inputTestCode.trim() ? '#9ca3af' : 'linear-gradient(135deg, #1e40af, #3b82f6)',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || !inputTestCode.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Validating...' : 'Start Test'}
          </button>
        </div>
      </div>
    )
  }

  if (!testData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        color: '#64748b'
      }}>
        Loading test...
      </div>
    )
  }

  const question = testData.questions[currentQuestion]
  const answeredCount = Object.keys(answers).length
  const progress = ((currentQuestion + 1) / testData.questions.length) * 100

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Test Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div>
            <h1 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0 0 4px 0'
            }}>
              {testData.title}
            </h1>
            <div style={{
              fontSize: '12px',
              opacity: 0.9
            }}>
              {testData.subject} • {testData.class_level}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '8px 12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: getTimeColor()
            }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{
              fontSize: '10px',
              opacity: 0.8
            }}>
              Time Left
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          height: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'white',
            height: '100%',
            width: `${progress}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          marginTop: '4px',
          opacity: 0.9
        }}>
          <span>Question {currentQuestion + 1} of {testData.questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
      </div>

      {/* Question Card */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '16px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          {question.question_text}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['A', 'B', 'C', 'D'].map((letter) => {
            const optionText = question[`option_${letter.toLowerCase()}` as keyof Question] as string
            const isSelected = answers[question.id] === letter
            
            return (
              <button
                key={letter}
                onClick={() => selectAnswer(question.id, letter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  background: isSelected ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isSelected ? '#1e40af' : '#374151',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    const target = e.target as HTMLButtonElement
                    target.style.borderColor = '#93c5fd'
                    target.style.background = '#f8fafc'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    const target = e.target as HTMLButtonElement
                    target.style.borderColor = '#e2e8f0'
                    target.style.background = 'white'
                  }
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: isSelected ? '#3b82f6' : '#e2e8f0',
                  color: isSelected ? 'white' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {letter}
                </span>
                <span style={{ flex: 1 }}>{optionText}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          style={{
            background: currentQuestion === 0 ? '#f1f5f9' : 'white',
            border: '1px solid #e2e8f0',
            color: currentQuestion === 0 ? '#9ca3af' : '#374151',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ← Previous
        </button>

        {currentQuestion === testData.questions.length - 1 ? (
          <button
            onClick={submitTest}
            disabled={submitting}
            style={{
              background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #ef4444)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            style={{
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Next →
          </button>
        )}
      </div>

      {/* Question Grid (Mobile Hidden) */}
      <div style={{
        display: window.innerWidth >= 768 ? 'block' : 'none',
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginTop: '16px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '12px'
        }}>
          Question Overview
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
          gap: '8px'
        }}>
          {testData.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                background: answers[testData.questions[index].id] ? '#dcfce7' :
                           currentQuestion === index ? '#3b82f6' : 'white',
                color: currentQuestion === index ? 'white' : 
                       answers[testData.questions[index].id] ? '#166534' : '#64748b',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px',
          borderRadius: '8px',
          marginTop: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}