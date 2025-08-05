-- MySQL Database Schema for CBT Portal (InfinityFree Compatible)
-- Converted from PostgreSQL to MySQL format

SET foreign_key_checks = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS test_answers;
DROP TABLE IF EXISTS test_results;
DROP TABLE IF EXISTS test_codes;
DROP TABLE IF EXISTS teacher_assignments;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS terms;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS class_levels;

SET foreign_key_checks = 1;

-- Create class_levels table
CREATE TABLE class_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL,
    level_type ENUM('junior', 'senior') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create terms table
CREATE TABLE terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    display_order INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subjects table
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    reg_number VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    current_term VARCHAR(20) DEFAULT 'First',
    current_session VARCHAR(20) DEFAULT '2024/2025'
);

-- Create questions table
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT,
    option_d TEXT,
    correct_answer ENUM('A', 'B', 'C', 'D') NOT NULL,
    subject_id INT NOT NULL,
    class_level VARCHAR(10) NOT NULL,
    term_id INT NOT NULL,
    session_id INT NOT NULL,
    teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    question_type VARCHAR(20) DEFAULT 'multiple_choice',
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create teacher_assignments table
CREATE TABLE teacher_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_level VARCHAR(10) NOT NULL,
    term_id INT NOT NULL,
    session_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Create test_codes table
CREATE TABLE test_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject_id INT NOT NULL,
    class_level VARCHAR(10) NOT NULL,
    term_id INT NOT NULL,
    session_id INT NOT NULL,
    duration_minutes INT NOT NULL,
    total_questions INT NOT NULL,
    pass_score INT DEFAULT 50,
    is_active BOOLEAN DEFAULT FALSE,
    is_activated BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    activated_at TIMESTAMP NULL,
    batch_id VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    test_type VARCHAR(20) DEFAULT 'test',
    score_per_question INT DEFAULT 1,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    used_by INT NULL,
    status VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create test_results table
CREATE TABLE test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_code_id INT NOT NULL,
    student_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    time_taken INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_code_id) REFERENCES test_codes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create test_answers table
CREATE TABLE test_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    result_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer ENUM('A', 'B', 'C', 'D'),
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_id) REFERENCES test_results(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT INTO class_levels (name, display_name, display_order, level_type) VALUES
('JSS1', 'Junior Secondary School 1', 1, 'junior'),
('JSS2', 'Junior Secondary School 2', 2, 'junior'),
('SSS1', 'Senior Secondary School 1', 3, 'senior');

INSERT INTO sessions (name, start_date, end_date, is_current) VALUES
('2023/2024', '2023-09-01', '2024-07-31', FALSE),
('2024/2025', '2024-09-01', '2025-07-31', TRUE),
('2025/2026', '2025-09-01', '2026-07-31', FALSE);

INSERT INTO terms (name, display_order) VALUES
('First', 1),
('Second', 2),
('Third', 3);

INSERT INTO subjects (name, code, description) VALUES
('Mathematics', 'MATH', 'Core mathematics curriculum'),
('English Language', 'ENG', 'English language and literature'),
('Physics', 'PHY', 'Basic physics principles'),
('Chemistry', 'CHEM', 'Chemical reactions and principles'),
('Biology', 'BIO', 'Study of living organisms'),
('Geography', 'GEO', 'Physical and human geography'),
('History', 'HIST', 'Historical events and analysis'),
('Economics', 'ECON', 'Economic principles and theories'),
('Government', 'GOVT', 'Civics and government studies'),
('Literature', 'LIT', 'Literary works and analysis'),
('Agricultural Science', 'AGRIC', 'Agricultural practices and science'),
('Computer Science', 'CS', 'Computer programming and IT'),
('Fine Arts', 'ART', 'Visual arts and creativity'),
('Music', 'MUS', 'Music theory and practice'),
('Physical Education', 'PE', 'Physical fitness and sports');

INSERT INTO users (username, email, reg_number, password, role, full_name) VALUES
('admin', 'admin@sfgs.edu.ng', NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator'),
('teacher1', 'teacher1@sfgs.edu.ng', NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'John Teacher'),
(NULL, NULL, 'SFGS/2024/001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Jane Student');

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_reg_number ON users(reg_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_questions_subject_id ON questions(subject_id);
CREATE INDEX idx_questions_subject_class ON questions(subject_id, class_level);
CREATE INDEX idx_questions_teacher ON questions(teacher_id);
CREATE INDEX idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_test_codes_active ON test_codes(is_active);
CREATE INDEX idx_test_codes_subject_class ON test_codes(subject_id, class_level);
CREATE INDEX idx_test_results_student ON test_results(student_id);
CREATE INDEX idx_test_results_test_code ON test_results(test_code_id);
CREATE INDEX idx_test_results_date ON test_results(submitted_at);
CREATE INDEX idx_test_results_submitted_at ON test_results(submitted_at);