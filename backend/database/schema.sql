-- CBT Portal Database Schema
-- PostgreSQL Schema for Computer-Based Testing System

-- Enable UUID extension (optional, for UUID primary keys)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for all system users (students, teachers, admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Teacher assignments table (which subjects/classes teachers can manage)
CREATE TABLE teacher_assignments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    class_level VARCHAR(10) NOT NULL,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique assignment per teacher-subject-class combination
    UNIQUE(teacher_id, subject, class_level)
);

-- Create indexes for teacher_assignments
CREATE INDEX idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_subject ON teacher_assignments(subject);
CREATE INDEX idx_teacher_assignments_class_level ON teacher_assignments(class_level);

-- Questions table for storing all test questions
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    subject VARCHAR(100) NOT NULL,
    class_level VARCHAR(10) NOT NULL,
    difficulty VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for questions table
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_class_level ON questions(class_level);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_teacher_id ON questions(teacher_id);
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_questions_subject_class ON questions(subject, class_level);

-- Test codes table for managing test access
CREATE TABLE test_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class_level VARCHAR(10) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    question_count INTEGER NOT NULL DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for test_codes
CREATE INDEX idx_test_codes_code ON test_codes(code);
CREATE INDEX idx_test_codes_subject ON test_codes(subject);
CREATE INDEX idx_test_codes_class_level ON test_codes(class_level);
CREATE INDEX idx_test_codes_is_active ON test_codes(is_active);
CREATE INDEX idx_test_codes_expires_at ON test_codes(expires_at);
CREATE INDEX idx_test_codes_created_by ON test_codes(created_by);

-- Test results table for storing completed test submissions
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    test_code_id INTEGER REFERENCES test_codes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER NOT NULL, -- in seconds
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one result per student per test
    UNIQUE(test_code_id, student_id)
);

-- Create indexes for test_results
CREATE INDEX idx_test_results_test_code_id ON test_results(test_code_id);
CREATE INDEX idx_test_results_student_id ON test_results(student_id);
CREATE INDEX idx_test_results_submitted_at ON test_results(submitted_at);
CREATE INDEX idx_test_results_score ON test_results(score);

-- Test answers table for storing individual question responses
CREATE TABLE test_answers (
    id SERIAL PRIMARY KEY,
    result_id INTEGER REFERENCES test_results(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    
    -- Ensure one answer per question per result
    UNIQUE(result_id, question_id)
);

-- Create indexes for test_answers
CREATE INDEX idx_test_answers_result_id ON test_answers(result_id);
CREATE INDEX idx_test_answers_question_id ON test_answers(question_id);
CREATE INDEX idx_test_answers_is_correct ON test_answers(is_correct);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_codes_updated_at BEFORE UPDATE ON test_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development/testing (optional)
-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role, full_name) VALUES
('admin', 'admin@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator');

-- Insert sample teacher (password: teacher123)
INSERT INTO users (username, email, password, role, full_name) VALUES
('teacher1', 'teacher1@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'John Doe'),
('teacher2', 'teacher2@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Jane Smith');

-- Insert sample student (password: student123)
INSERT INTO users (username, email, password, role, full_name) VALUES
('student1', 'student1@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Alice Johnson'),
('student2', 'student2@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Bob Wilson');

-- Insert sample teacher assignments
INSERT INTO teacher_assignments (teacher_id, subject, class_level, assigned_by) VALUES
(2, 'Mathematics', 'SS1', 1),
(2, 'Mathematics', 'SS2', 1),
(3, 'English Language', 'SS1', 1),
(3, 'English Language', 'SS2', 1);

-- Insert sample questions
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, subject, class_level, difficulty, teacher_id) VALUES
('What is 2 + 2?', '2', '3', '4', '5', 'C', 'Mathematics', 'SS1', 'easy', 2),
('What is 5 × 3?', '8', '15', '12', '18', 'B', 'Mathematics', 'SS1', 'easy', 2),
('What is the square root of 16?', '2', '4', '6', '8', 'B', 'Mathematics', 'SS1', 'medium', 2),
('Solve: 2x + 3 = 7', 'x = 1', 'x = 2', 'x = 3', 'x = 4', 'B', 'Mathematics', 'SS2', 'medium', 2),
('What is a noun?', 'An action word', 'A describing word', 'A naming word', 'A connecting word', 'C', 'English Language', 'SS1', 'easy', 3),
('Which is a pronoun?', 'Run', 'Beautiful', 'He', 'Quickly', 'C', 'English Language', 'SS1', 'easy', 3);

-- Insert sample test code
INSERT INTO test_codes (code, title, subject, class_level, duration_minutes, question_count, expires_at, created_by) VALUES
('TEST01', 'Mathematics Mid-term Test', 'Mathematics', 'SS1', 30, 3, CURRENT_TIMESTAMP + INTERVAL '30 days', 1),
('TEST02', 'English Language Quiz', 'English Language', 'SS1', 20, 2, CURRENT_TIMESTAMP + INTERVAL '15 days', 1);

-- Create views for common queries
CREATE VIEW active_test_codes AS
SELECT 
    tc.*,
    u.full_name as created_by_name,
    COUNT(tr.id) as submission_count
FROM test_codes tc
LEFT JOIN users u ON tc.created_by = u.id
LEFT JOIN test_results tr ON tc.id = tr.test_code_id
WHERE tc.is_active = true AND tc.expires_at > CURRENT_TIMESTAMP
GROUP BY tc.id, u.full_name;

CREATE VIEW teacher_question_stats AS
SELECT 
    u.id as teacher_id,
    u.full_name as teacher_name,
    COUNT(q.id) as total_questions,
    COUNT(DISTINCT q.subject) as subjects_taught,
    COUNT(DISTINCT q.class_level) as classes_taught,
    MAX(q.created_at) as last_question_created
FROM users u
LEFT JOIN questions q ON u.id = q.teacher_id
WHERE u.role = 'teacher'
GROUP BY u.id, u.full_name;

CREATE VIEW student_performance AS
SELECT 
    u.id as student_id,
    u.full_name as student_name,
    COUNT(tr.id) as tests_taken,
    AVG(CAST(tr.score AS FLOAT) / tr.total_questions * 100) as average_percentage,
    MAX(tr.submitted_at) as last_test_date
FROM users u
LEFT JOIN test_results tr ON u.id = tr.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name;

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cbt_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cbt_app_user;

-- Comments for documentation
COMMENT ON TABLE users IS 'All system users including students, teachers, and administrators';
COMMENT ON TABLE teacher_assignments IS 'Maps teachers to subjects and classes they can manage';
COMMENT ON TABLE questions IS 'Question bank with multiple choice options';
COMMENT ON TABLE test_codes IS 'Test access codes generated by administrators';
COMMENT ON TABLE test_results IS 'Completed test submissions with scores';
COMMENT ON TABLE test_answers IS 'Individual question responses for each test result';

COMMENT ON COLUMN users.role IS 'User role: student, teacher, or admin';
COMMENT ON COLUMN questions.correct_answer IS 'Correct answer option: A, B, C, or D';
COMMENT ON COLUMN questions.difficulty IS 'Question difficulty: easy, medium, or hard';
COMMENT ON COLUMN test_codes.code IS 'Unique access code for students to join tests';
COMMENT ON COLUMN test_results.time_taken IS 'Time taken to complete test in seconds';
COMMENT ON COLUMN test_answers.selected_answer IS 'Student selected answer: A, B, C, or D';

-- Performance optimization: Analyze tables after initial data load
-- ANALYZE users;
-- ANALYZE teacher_assignments;
-- ANALYZE questions;
-- ANALYZE test_codes;
-- ANALYZE test_results;
-- ANALYZE test_answers;
