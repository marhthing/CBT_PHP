export interface User {
  id: number
  username: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  full_name: string
  created_at: string
  current_term?: string
  current_session?: string
}

export interface Question {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  subject: string
  class_level: string
  difficulty: 'easy' | 'medium' | 'hard'
  teacher_id: number
  created_at: string
}

export interface TestCode {
  id: number
  code: string
  title: string
  subject: string
  class_level: string
  duration_minutes: number
  question_count: number
  is_active: boolean
  created_by: number
  created_at: string
  expires_at: string
}

export interface TestResult {
  id: number
  test_code_id: number
  student_id: number
  score: number
  total_questions: number
  time_taken: number
  submitted_at: string
  percentage: number
  grade: string
  test_code: {
    code: string
    title: string
    subject: string
    class_level: string
    duration_minutes: number
  }
}

export interface TestQuestion {
  id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

export interface TestSubmission {
  test_code: string
  answers: { [questionId: number]: string }
  time_taken: number
}

export interface TeacherAssignment {
  id: number
  teacher_id: number
  class_level: string
  subject: string
  assigned_by: number
  created_at: string
  teacher: User
}

export interface BulkUploadQuestion {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  subject: string
  class_level: string
  difficulty: string
}
