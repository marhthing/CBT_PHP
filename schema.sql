-- PostgreSQL Database Schema for CBT Portal
-- Generated: August 2, 2025

-- Drop existing tables with CASCADE
DROP TABLE IF EXISTS test_answers CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS test_codes CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS terms CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Create lookup tables first
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE terms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    reg_number VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    current_term VARCHAR(20) DEFAULT 'First',
    current_session VARCHAR(20) DEFAULT '2024/2025'
);

-- Teacher assignments table (fixed structure)
CREATE TABLE teacher_assignments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_level VARCHAR(10) NOT NULL,
    term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_level VARCHAR(10) NOT NULL,
    term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test codes table
CREATE TABLE test_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_level VARCHAR(10) NOT NULL,
    term_id INTEGER NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    pass_score INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT false,
    is_activated BOOLEAN DEFAULT false,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    activated_at TIMESTAMP,
    batch_id VARCHAR(255) NULL
);

-- Test results table
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    test_code_id INTEGER NOT NULL REFERENCES test_codes(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER NOT NULL, -- in seconds
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test answers table
CREATE TABLE test_answers (
    id SERIAL PRIMARY KEY,
    result_id INTEGER NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer CHAR(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert lookup data
INSERT INTO subjects (name, code, description) VALUES
('Mathematics', 'MATH', 'General Mathematics'),
('English Language', 'ENG', 'English Language and Literature'),
('Physics', 'PHY', 'Applied Physics'),
('Chemistry', 'CHEM', 'General Chemistry'),
('Biology', 'BIO', 'General Biology'),
('Geography', 'GEO', 'Physical and Human Geography'),
('History', 'HIST', 'Nigerian and World History'),
('Economics', 'ECON', 'Applied Economics'),
('Government', 'GOVT', 'Government and Civics'),
('Literature', 'LIT', 'Literature in English'),
('Agricultural Science', 'AGRIC', 'Agricultural Science'),
('Computer Science', 'CS', 'Computer Science and ICT'),
('Further Mathematics', 'FMATH', 'Advanced Mathematics'),
('Civic Education', 'CIVIC', 'Civic Education'),
('Trade/Business Studies', 'BUS', 'Business Studies');

INSERT INTO terms (name, display_order) VALUES
('First', 1),
('Second', 2),
('Third', 3);

INSERT INTO sessions (name, start_date, end_date, is_current) VALUES
('2024/2025', '2024-09-01', '2025-07-31', true),
('2023/2024', '2023-09-01', '2024-07-31', false),
('2025/2026', '2025-09-01', '2026-07-31', false);

-- Insert sample users with hashed passwords for 'password123'
INSERT INTO users (username, email, reg_number, password, role, full_name) VALUES
('admin', 'admin@sfgs.edu.ng', NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator'),
('teacher1', 'teacher1@sfgs.edu.ng', NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'John Doe'),
(NULL, NULL, '2023001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Jane Smith');

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_reg_number ON users(reg_number);
CREATE INDEX idx_questions_subject_class ON questions(subject_id, class_level);
CREATE INDEX idx_questions_teacher ON questions(teacher_id);
CREATE INDEX idx_test_codes_subject_class ON test_codes(subject_id, class_level);
CREATE INDEX idx_test_results_student ON test_results(student_id);
CREATE INDEX idx_test_results_test_code ON test_results(test_code_id);
CREATE INDEX idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_subject_class ON teacher_assignments(subject_id, class_level);