
-- Complete CBT Portal Database Migration
-- Compatible with PostgreSQL and MySQL
-- Run this to create/update the complete database structure

-- Start transaction
BEGIN;

-- Drop existing tables if they exist (for clean installation)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS test_codes CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    matric_number VARCHAR(50) UNIQUE,
    class_id INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_matric_number ON users(matric_number);
CREATE INDEX idx_users_class_id ON users(class_id);
CREATE INDEX idx_users_active ON users(active);

-- =====================================================
-- TABLE: classes
-- =====================================================
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    level VARCHAR(20) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_level ON classes(level);
CREATE INDEX idx_classes_active ON classes(active);

-- =====================================================
-- TABLE: subjects
-- =====================================================
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    category VARCHAR(50),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_category ON subjects(category);
CREATE INDEX idx_subjects_active ON subjects(active);

-- =====================================================
-- TABLE: teacher_assignments
-- =====================================================
CREATE TABLE teacher_assignments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, class_id, subject_id)
);

CREATE INDEX idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX idx_teacher_assignments_subject ON teacher_assignments(subject_id);

-- =====================================================
-- TABLE: questions
-- =====================================================
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    session VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    test_type VARCHAR(10) NOT NULL CHECK (test_type IN ('CA', 'Exam')),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    image VARCHAR(255),
    difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_by INTEGER DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    edited_at TIMESTAMP NULL DEFAULT NULL
);

CREATE INDEX idx_questions_class_subject ON questions(class_id, subject_id);
CREATE INDEX idx_questions_session_term ON questions(session, term);
CREATE INDEX idx_questions_test_type ON questions(test_type);
CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_edited_by ON questions(edited_by);

-- =====================================================
-- TABLE: test_codes
-- =====================================================
CREATE TABLE test_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    class_id INTEGER NOT NULL REFERENCES classes(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    session VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    test_type VARCHAR(10) NOT NULL CHECK (test_type IN ('CA', 'Exam')),
    num_questions INTEGER NOT NULL CHECK (num_questions > 0),
    score_per_question INTEGER NOT NULL CHECK (score_per_question > 0),
    duration INTEGER NOT NULL CHECK (duration > 0),
    class_name VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT false,
    disabled BOOLEAN DEFAULT false,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    disabled_at TIMESTAMP
);

CREATE INDEX idx_test_codes_code ON test_codes(code);
CREATE INDEX idx_test_codes_class_subject ON test_codes(class_id, subject_id);
CREATE INDEX idx_test_codes_active ON test_codes(active);
CREATE INDEX idx_test_codes_disabled ON test_codes(disabled);
CREATE INDEX idx_test_codes_created_by ON test_codes(created_by);

-- =====================================================
-- TABLE: test_results
-- =====================================================
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_code_id INTEGER NOT NULL REFERENCES test_codes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_score INTEGER NOT NULL CHECK (total_score > 0),
    time_taken INTEGER NOT NULL CHECK (time_taken >= 0),
    questions_answered INTEGER NOT NULL CHECK (questions_answered >= 0),
    correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
    wrong_answers INTEGER NOT NULL CHECK (wrong_answers >= 0),
    answers_json TEXT,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_score > 0 THEN ROUND((score * 100.0 / total_score), 2)
            ELSE 0 
        END
    ) STORED,
    grade VARCHAR(2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_score = 0 THEN 'F'
            WHEN (score * 100.0 / total_score) >= 80 THEN 'A'
            WHEN (score * 100.0 / total_score) >= 70 THEN 'B'
            WHEN (score * 100.0 / total_score) >= 60 THEN 'C'
            WHEN (score * 100.0 / total_score) >= 50 THEN 'D'
            ELSE 'F'
        END
    ) STORED,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, test_code_id)
);

CREATE INDEX idx_test_results_student ON test_results(student_id);
CREATE INDEX idx_test_results_test_code ON test_results(test_code_id);
CREATE INDEX idx_test_results_completed_at ON test_results(completed_at);
CREATE INDEX idx_test_results_score ON test_results(score);
CREATE INDEX idx_test_results_percentage ON test_results(percentage);

-- =====================================================
-- TABLE: activity_logs
-- =====================================================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for questions table
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA (if not exists)
-- =====================================================

-- Insert default classes
INSERT INTO classes (name, description, level) VALUES
('JSS 1', 'Junior Secondary School 1', 'junior'),
('JSS 2', 'Junior Secondary School 2', 'junior'),
('JSS 3', 'Junior Secondary School 3', 'junior'),
('SS 1', 'Senior Secondary School 1', 'senior'),
('SS 2', 'Senior Secondary School 2', 'senior'),
('SS 3', 'Senior Secondary School 3', 'senior')
ON CONFLICT (name) DO NOTHING;

-- Insert default subjects
INSERT INTO subjects (name, code, description, category) VALUES
('Mathematics', 'MATH', 'Mathematics', 'Core'),
('English Language', 'ENG', 'English Language', 'Core'),
('Integrated Science', 'SCI', 'Basic Science', 'Science'),
('Physics', 'PHY', 'Physics', 'Science'),
('Chemistry', 'CHE', 'Chemistry', 'Science'),
('Biology', 'BIO', 'Biology', 'Science'),
('Computer Science', 'CSC', 'Computer Science', 'Science'),
('Further Mathematics', 'F-MATH', 'Further Mathematics', 'Science'),
('Literature in English', 'LIT', 'Literature in English', 'Arts'),
('Government', 'GOV', 'Government', 'Arts'),
('History', 'HIS', 'History', 'Arts'),
('Christian Religious Studies', 'CRS', 'Christian Religious Studies', 'Arts'),
('Islamic Religious Studies', 'IRS', 'Islamic Religious Studies', 'Arts'),
('Geography', 'GEO', 'Geography', 'Arts'),
('Economics', 'ECO', 'Economics', 'Commercial'),
('Accounting', 'ACC', 'Accounting', 'Commercial'),
('Commerce', 'COM', 'Commerce', 'Commercial'),
('Business Studies', 'BUS', 'Business Studies', 'Commercial'),
('Technical Drawing', 'TD', 'Technical Drawing', 'Technical'),
('Basic Technology', 'BT', 'Basic Technology', 'Technical'),
('Home Economics', 'HE', 'Home Economics', 'Technical'),
('French', 'FRE', 'French Language', 'Languages'),
('Yoruba', 'YOR', 'Yoruba Language', 'Languages'),
('Igbo', 'IGB', 'Igbo Language', 'Languages'),
('Hausa', 'HAU', 'Hausa Language', 'Languages'),
('Civic Education', 'CIV', 'Civic Education', 'Others'),
('Physical and Health Education', 'PHE', 'Physical and Health Education', 'Others'),
('Agricultural Science', 'AGR', 'Agricultural Science', 'Others'),
('Fine Arts', 'ART', 'Fine Arts', 'Others'),
('Music', 'MUS', 'Music', 'Others')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (if not exists)
INSERT INTO users (username, email, password, full_name, role, active) VALUES
('admin', 'admin@cbtportal.com', '$2y$10$CMwjfENyj9D5vFsDeAT0Je49/gOEIHmT5c1YxdaIatf45h/SU7.gW', 'System Administrator', 'admin', true)
ON CONFLICT (username) DO NOTHING;

COMMIT;
