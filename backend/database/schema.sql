-- CBT Portal Database Schema
-- PostgreSQL Schema for Computer-Based Testing System

-- Lookup tables for better data normalization
CREATE TABLE terms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Users table for all system users (students, teachers, admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    full_name VARCHAR(255) NOT NULL,
    reg_number VARCHAR(20) UNIQUE,
    current_term VARCHAR(20) DEFAULT 'First',
    current_session VARCHAR(20) DEFAULT '2024/2025',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_reg_number ON users(reg_number);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Teacher assignments table (which subjects/classes teachers can manage)
CREATE TABLE teacher_assignments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) NOT NULL,
    class_level VARCHAR(10) NOT NULL,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique assignment per teacher-subject-class combination
    UNIQUE(teacher_id, subject_id, class_level)
);

-- Create indexes for teacher_assignments
CREATE INDEX idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_subject_id ON teacher_assignments(subject_id);
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
    subject_id INTEGER REFERENCES subjects(id) NOT NULL,
    class_level VARCHAR(10) NOT NULL,
    term_id INTEGER REFERENCES terms(id) DEFAULT 1,
    session_id INTEGER REFERENCES sessions(id) DEFAULT 1,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for questions table
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_class_level ON questions(class_level);

CREATE INDEX idx_questions_teacher_id ON questions(teacher_id);
CREATE INDEX idx_questions_created_at ON questions(created_at);
CREATE INDEX idx_questions_subject_class ON questions(subject_id, class_level);

-- Test codes table for managing test access
CREATE TABLE test_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subject_id INTEGER REFERENCES subjects(id) NOT NULL,
    class_level VARCHAR(10) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    question_count INTEGER NOT NULL DEFAULT 20,
    term_id INTEGER REFERENCES terms(id) DEFAULT 1,
    session_id INTEGER REFERENCES sessions(id) DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_activated BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for test_codes
CREATE INDEX idx_test_codes_code ON test_codes(code);
CREATE INDEX idx_test_codes_subject_id ON test_codes(subject_id);
CREATE INDEX idx_test_codes_class_level ON test_codes(class_level);
CREATE INDEX idx_test_codes_is_active ON test_codes(is_active);
CREATE INDEX idx_test_codes_expires_at ON test_codes(expires_at);
CREATE INDEX idx_test_codes_created_by ON test_codes(created_by);

-- Test results table for storing test outcomes
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    test_code_id INTEGER REFERENCES test_codes(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER NOT NULL, -- in seconds
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for test_results
CREATE INDEX idx_test_results_test_code_id ON test_results(test_code_id);
CREATE INDEX idx_test_results_student_id ON test_results(student_id);
CREATE INDEX idx_test_results_submitted_at ON test_results(submitted_at);

-- Test answers table for storing individual answers
CREATE TABLE test_answers (
    id SERIAL PRIMARY KEY,
    result_id INTEGER REFERENCES test_results(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for test_answers
CREATE INDEX idx_test_answers_result_id ON test_answers(result_id);
CREATE INDEX idx_test_answers_question_id ON test_answers(question_id);

-- Create functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_codes_updated_at BEFORE UPDATE ON test_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default lookup data
INSERT INTO terms (name, display_order) VALUES 
('First', 1), ('Second', 2), ('Third', 3);

INSERT INTO sessions (name, start_date, end_date, is_current) VALUES 
('2024/2025', '2024-09-01', '2025-07-31', true);

INSERT INTO subjects (name, code) VALUES 
('Mathematics', 'MATH'),
('English Language', 'ENG'),
('Physics', 'PHY'),
('Chemistry', 'CHEM'),
('Biology', 'BIO'),
('Economics', 'ECON'),
('Government', 'GOV'),
('History', 'HIST'),
('Geography', 'GEO'),
('Literature', 'LIT');

-- Sample data for development/testing (password: password123)
INSERT INTO users (username, email, password, role, full_name, reg_number) VALUES
('admin', 'admin@sfgs.edu.ng', '$2y$10$KrCmWnksoqB8EmsD9UEupu87sg6G/w.SXySusvUCVFLOkln84/gBG', 'admin', 'System Administrator', NULL),
('teacher1', 'teacher1@sfgs.edu.ng', '$2y$10$KrCmWnksoqB8EmsD9UEupu87sg6G/w.SXySusvUCVFLOkln84/gBG', 'teacher', 'John Doe', NULL),
('teacher2', 'teacher2@sfgs.edu.ng', '$2y$10$KrCmWnksoqB8EmsD9UEupu87sg6G/w.SXySusvUCVFLOkln84/gBG', 'teacher', 'Jane Smith', NULL),
('2023001', 'student1@sfgs.edu.ng', '$2y$10$KrCmWnksoqB8EmsD9UEupu87sg6G/w.SXySusvUCVFLOkln84/gBG', 'student', 'Alice Johnson', '2023001'),
('2023002', 'student2@sfgs.edu.ng', '$2y$10$KrCmWnksoqB8EmsD9UEupu87sg6G/w.SXySusvUCVFLOkln84/gBG', 'student', 'Bob Wilson', '2023002');

-- Insert sample teacher assignments using subject_id
INSERT INTO teacher_assignments (teacher_id, subject_id, class_level, assigned_by) VALUES
(2, 1, 'SS1', 1), -- John Doe -> Mathematics -> SS1
(2, 1, 'SS2', 1), -- John Doe -> Mathematics -> SS2
(3, 2, 'SS1', 1), -- Jane Smith -> English Language -> SS1
(3, 2, 'SS2', 1); -- Jane Smith -> English Language -> SS2

-- Insert sample questions using subject_id
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, subject_id, class_level, teacher_id, term_id, session_id) VALUES
('What is 2 + 2?', '2', '3', '4', '5', 'C', 1, 'SS1', 2, 1, 1),
('What is 5 × 3?', '8', '15', '12', '18', 'B', 1, 'SS1', 2, 1, 1),
('What is the square root of 16?', '2', '4', '6', '8', 'B', 1, 'SS1', 2, 1, 1),
('Solve: 2x + 3 = 7', 'x = 1', 'x = 2', 'x = 3', 'x = 4', 'B', 1, 'SS2', 2, 1, 1),
('What is a noun?', 'An action word', 'A describing word', 'A naming word', 'A connecting word', 'C', 2, 'SS1', 3, 1, 1),
('Which is a pronoun?', 'Run', 'Beautiful', 'He', 'Quickly', 'C', 2, 'SS1', 3, 1, 1);

-- Insert sample test codes using subject_id
INSERT INTO test_codes (code, title, subject_id, class_level, duration_minutes, question_count, expires_at, created_by, term_id, session_id) VALUES
('TEST01', 'Mathematics Mid-term Test', 1, 'SS1', 30, 3, CURRENT_TIMESTAMP + INTERVAL '30 days', 1, 1, 1),
('TEST02', 'English Language Quiz', 2, 'SS1', 20, 2, CURRENT_TIMESTAMP + INTERVAL '15 days', 1, 1, 1);