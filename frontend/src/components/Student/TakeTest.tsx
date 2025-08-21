import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Send
} from 'lucide-react'

interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  question_type: 'multiple_choice' | 'true_false'
}

interface TestData {
  id: number
  title: string
  subject: string
  class_level: string
  duration_minutes: number
  questions: Question[]
}

interface TestPreview {
  test_id: number
  title: string
  subject: string
  class_level: string
  duration_minutes: number
  question_count: number
}

export default function TakeTest() {
  const { } = useAuth()
  const navigate = useNavigate()
  const { testCode } = useParams()
  const [searchParams] = useSearchParams()
  const queryCode = searchParams.get('code')
  const [inputTestCode, setInputTestCode] = useState(testCode || queryCode || '')
  const [testPreview, setTestPreview] = useState<TestPreview | null>(null)
  const [testData, setTestData] = useState<TestData | null>(null)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [testStarted, setTestStarted] = useState(false)

  // Browser back button protection
  useEffect(() => {
    const isInTestPhase = testPreview || testStarted

    if (isInTestPhase) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.'
        return 'Are you sure you want to leave? Your test progress will be lost.'
      }

      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault()
        const confirmLeave = confirm('Are you sure you want to leave the test? Your progress will be lost and you may not be able to retake this test.')
        
        if (!confirmLeave) {
          // Push current state back to prevent navigation
          window.history.pushState(null, '', window.location.pathname + window.location.search)
        } else {
          // Allow navigation but reset test state
          setTestPreview(null)
          setTestData(null)
          setTestStarted(false)
          setAnswers({})
          navigate('/student/test', { replace: true })
        }
      }

      // Add listeners
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('popstate', handlePopState)

      // Push initial state to intercept back navigation
      window.history.pushState(null, '', window.location.pathname + window.location.search)

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [testPreview, testStarted, navigate])

  // Hide bottom navigation during test phases (mobile only)
  useEffect(() => {
    const hideBottomNav = testPreview || testStarted
    const bottomNav = document.querySelector('#mobile-bottom-nav') as HTMLElement
    const isMobile = window.innerWidth < 768 // md breakpoint
    
    if (bottomNav && isMobile) {
      if (hideBottomNav) {
        bottomNav.style.display = 'none'
      } else {
        bottomNav.style.display = 'flex' // Use flex to match original layout
      }
    }

    // Cleanup on unmount - only restore if mobile
    return () => {
      const bottomNav = document.querySelector('#mobile-bottom-nav') as HTMLElement
      const isMobile = window.innerWidth < 768
      if (bottomNav && isMobile) {
        bottomNav.style.display = 'flex'
      }
    }
  }, [testPreview, testStarted])

  useEffect(() => {
    const codeToUse = testCode || queryCode
    if (codeToUse) {
      setInputTestCode(codeToUse.toUpperCase())
      setTimeout(() => validateTestCode(), 100)
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
        setTestPreview(response.data.data)
        setInputTestCode(inputTestCode.toUpperCase())
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid test code')
    } finally {
      setLoading(false)
    }
  }

  const startTest = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get(`/student/take-test?test_code=${inputTestCode}`)

      if (response.data.success) {
        const test = response.data.data
        setTestData(test)
        setTimeLeft(test.duration_minutes * 60)
        setTestStarted(true)
        setTestPreview(null)
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
      const timeTaken = (testData?.duration_minutes || 0) * 60 - timeLeft
      await api.post('/student/submit-test', {
        test_code: inputTestCode.toUpperCase(),
        answers,
        time_taken: timeTaken
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

  // Test Preview Phase
  if (testPreview && !testStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Test Preview</h1>
            <p className="text-gray-600 mt-1">Review test details before starting</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 pb-20 sm:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Test Details Card */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                {testPreview.title}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Subject
                    </label>
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {testPreview.subject}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Class Level
                    </label>
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {testPreview.class_level}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Duration
                    </label>
                    <div className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Clock size={18} className="sm:w-5 sm:h-5" />
                      {testPreview.duration_minutes} minutes
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Questions
                    </label>
                    <div className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText size={18} className="sm:w-5 sm:h-5" />
                      {testPreview.question_count} questions
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Test Instructions
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Read each question carefully before selecting your answer</li>
                  <li>• You can navigate between questions using the Previous/Next buttons</li>
                  <li>• Your test will auto-submit when time expires</li>
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• Once started, you cannot pause or restart the test</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-red-800">{error}</div>
                </div>
              )}

              <button
                onClick={startTest}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Starting Test...'
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Start Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Test Code Input Phase
  if (!testStarted && !testPreview) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 sm:p-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Enter Test Code</h1>
            <p className="text-gray-600 mt-1">Get your test code from your teacher</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 pb-20 sm:pb-6">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="text-red-800 text-sm sm:text-base">{error}</div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Code
                </label>
                <input
                  type="text"
                  value={inputTestCode}
                  onChange={(e) => setInputTestCode(e.target.value.toUpperCase())}
                  placeholder="Enter test code (e.g., TEST123)"
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg text-center text-base sm:text-lg font-semibold tracking-wider uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && validateTestCode()}
                />
              </div>

              <button
                onClick={validateTestCode}
                disabled={loading || !inputTestCode.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold transition-colors text-sm sm:text-base"
              >
                {loading ? 'Validating...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Active Test Phase
  if (!testData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading test...</div>
      </div>
    )
  }

  const question = testData.questions[currentQuestion]
  const answeredCount = Object.keys(answers).length
  const progress = ((currentQuestion + 1) / testData.questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Test Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-3 sm:p-4 sticky top-0 z-10">
        <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
              {testData.title}
            </h1>
            <div className="text-xs sm:text-sm text-gray-600 truncate">
              {testData.subject} • {testData.class_level}
            </div>
          </div>

          <div className="text-right ml-3">
            <div 
              className="text-lg sm:text-xl lg:text-2xl font-bold mb-1"
              style={{ color: getTimeColor() }}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-gray-500">Time Left</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs sm:text-sm text-gray-600">
          <span>Question {currentQuestion + 1} of {testData.questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>
      </div>

      <div className="p-4 sm:p-6 pb-24 sm:pb-6">
        <div className="max-w-5xl mx-auto">
          {/* Question Card */}
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
            <div className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 leading-relaxed">
              {question.question_text}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(question.question_type === 'true_false' ? ['A', 'B'] : ['A', 'B', 'C', 'D']).map((letter) => {
                const optionText = question[`option_${letter.toLowerCase()}` as keyof Question] as string
                const isSelected = answers[question.id] === letter

                if (!optionText || optionText.trim() === '') {
                  return null
                }

                return (
                  <button
                    key={letter}
                    onClick={() => selectAnswer(question.id, letter)}
                    className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 text-blue-900' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isSelected 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {letter}
                    </div>
                    <span className="text-left flex-1 text-sm sm:text-base">{optionText}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            {currentQuestion === testData.questions.length - 1 ? (
              <button
                onClick={submitTest}
                disabled={submitting}
                className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
              >
                <Send size={14} className="sm:w-4 sm:h-4" />
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                Next
                <ArrowRight size={14} className="sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          {/* Question Grid - Desktop Only */}
          <div className="hidden lg:block mt-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Question Overview</h3>

              <div className="grid grid-cols-10 gap-2">
                {testData.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                      answers[testData.questions[index].id] 
                        ? 'bg-green-100 text-green-800 border-green-300' :
                      currentQuestion === index 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } border`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}