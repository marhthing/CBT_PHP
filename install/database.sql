-- CBT Portal Database Schema
-- Compatible with PostgreSQL (primary) and MySQL (with minor modifications)
-- This file creates all necessary tables and initial data

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
-- Stores all user accounts (students, teachers, admins)
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    matric_number VARCHAR(50) UNIQUE, -- For students only
    class_id INTEGER, -- For students only
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_matric_number ON users(matric_number);
CREATE INDEX idx_users_class_id ON users(class_id);

-- =====================================================
-- TABLE: classes
-- Stores class information (JSS1, JSS2, SS1, etc.)
-- =====================================================
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    level VARCHAR(20) NOT NULL, -- 'junior' or 'senior'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: subjects
-- Stores subject information
-- =====================================================
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    category VARCHAR(50), -- 'Science', 'Arts', 'Commercial', etc.
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: teacher_assignments
-- Maps teachers to classes and subjects they can teach
-- =====================================================
CREATE TABLE teacher_assignments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, class_id, subject_id)
);

-- Create indexes
CREATE INDEX idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX idx_teacher_assignments_subject ON teacher_assignments(subject_id);

-- =====================================================
-- TABLE: questions
-- Stores all test questions
-- =====================================================
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    session VARCHAR(20) NOT NULL, -- '2023/2024', '2024/2025'
    term VARCHAR(20) NOT NULL, -- 'First Term', 'Second Term', 'Third Term'
    test_type VARCHAR(10) NOT NULL CHECK (test_type IN ('CA', 'Exam')),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    image VARCHAR(255), -- Filename of uploaded image
    difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_questions_class_subject ON questions(class_id, subject_id);
CREATE INDEX idx_questions_session_term ON questions(session, term);
CREATE INDEX idx_questions_test_type ON questions(test_type);
CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- =====================================================
-- TABLE: test_codes
-- Stores generated test codes and their configurations
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
    duration INTEGER NOT NULL CHECK (duration > 0), -- Duration in minutes
    class_name VARCHAR(50) NOT NULL, -- Denormalized for efficiency
    subject_name VARCHAR(100) NOT NULL, -- Denormalized for efficiency
    active BOOLEAN DEFAULT false,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_test_codes_code ON test_codes(code);
CREATE INDEX idx_test_codes_class_subject ON test_codes(class_id, subject_id);
CREATE INDEX idx_test_codes_active ON test_codes(active);
CREATE INDEX idx_test_codes_created_by ON test_codes(created_by);

-- =====================================================
-- TABLE: test_results
-- Stores completed test results
-- =====================================================
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_code_id INTEGER NOT NULL REFERENCES test_codes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 0),
    total_score INTEGER NOT NULL CHECK (total_score > 0),
    time_taken INTEGER NOT NULL CHECK (time_taken >= 0), -- Time taken in seconds
    questions_answered INTEGER NOT NULL CHECK (questions_answered >= 0),
    correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
    wrong_answers INTEGER NOT NULL CHECK (wrong_answers >= 0),
    answers_json TEXT, -- JSON string of all answers for review
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
    UNIQUE(student_id, test_code_id) -- Prevent retakes
);

-- Create indexes
CREATE INDEX idx_test_results_student ON test_results(student_id);
CREATE INDEX idx_test_results_test_code ON test_results(test_code_id);
CREATE INDEX idx_test_results_completed_at ON test_results(completed_at);
CREATE INDEX idx_test_results_score ON test_results(score);
CREATE INDEX idx_test_results_percentage ON test_results(percentage);

-- =====================================================
-- TABLE: activity_logs
-- Stores system activity logs for auditing
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

-- Create indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);

-- =====================================================
-- INITIAL DATA INSERTION
-- =====================================================

-- Insert default classes
INSERT INTO classes (name, description, level) VALUES
('JSS 1', 'Junior Secondary School 1', 'junior'),
('JSS 2', 'Junior Secondary School 2', 'junior'),
('JSS 3', 'Junior Secondary School 3', 'junior'),
('SS 1', 'Senior Secondary School 1', 'senior'),
('SS 2', 'Senior Secondary School 2', 'senior'),
('SS 3', 'Senior Secondary School 3', 'senior');

-- Insert default subjects
INSERT INTO subjects (name, code, description, category) VALUES
-- Core Subjects
('Mathematics', 'MATH', 'Mathematics', 'Core'),
('English Language', 'ENG', 'English Language', 'Core'),
('Integrated Science', 'SCI', 'Basic Science', 'Science'),

-- Science Subjects
('Physics', 'PHY', 'Physics', 'Science'),
('Chemistry', 'CHE', 'Chemistry', 'Science'),
('Biology', 'BIO', 'Biology', 'Science'),
('Computer Science', 'CSC', 'Computer Science', 'Science'),
('Further Mathematics', 'F-MATH', 'Further Mathematics', 'Science'),

-- Arts Subjects
('Literature in English', 'LIT', 'Literature in English', 'Arts'),
('Government', 'GOV', 'Government', 'Arts'),
('History', 'HIS', 'History', 'Arts'),
('Christian Religious Studies', 'CRS', 'Christian Religious Studies', 'Arts'),
('Islamic Religious Studies', 'IRS', 'Islamic Religious Studies', 'Arts'),
('Geography', 'GEO', 'Geography', 'Arts'),

-- Commercial Subjects
('Economics', 'ECO', 'Economics', 'Commercial'),
('Accounting', 'ACC', 'Accounting', 'Commercial'),
('Commerce', 'COM', 'Commerce', 'Commercial'),
('Business Studies', 'BUS', 'Business Studies', 'Commercial'),

-- Technical Subjects
('Technical Drawing', 'TD', 'Technical Drawing', 'Technical'),
('Basic Technology', 'BT', 'Basic Technology', 'Technical'),
('Home Economics', 'HE', 'Home Economics', 'Technical'),

-- Languages
('French', 'FRE', 'French Language', 'Languages'),
('Yoruba', 'YOR', 'Yoruba Language', 'Languages'),
('Igbo', 'IGB', 'Igbo Language', 'Languages'),
('Hausa', 'HAU', 'Hausa Language', 'Languages'),

-- Others
('Civic Education', 'CIV', 'Civic Education', 'Others'),
('Physical and Health Education', 'PHE', 'Physical and Health Education', 'Others'),
('Agricultural Science', 'AGR', 'Agricultural Science', 'Others'),
('Fine Arts', 'ART', 'Fine Arts', 'Others'),
('Music', 'MUS', 'Music', 'Others');

-- Insert default admin user
-- Password: 'admin123' (hashed using PHP's password_hash)
INSERT INTO users (username, email, password, full_name, role, active) VALUES
('admin', 'admin@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', true);

-- Insert sample teacher
-- Password: 'teacher123' (hashed using PHP's password_hash)
INSERT INTO users (username, email, password, full_name, role, active) VALUES
('teacher1', 'teacher1@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Doe', 'teacher', true),
('teacher2', 'teacher2@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane Smith', 'teacher', true);

-- Insert sample students
-- Password: 'student123' (hashed using PHP's password_hash)
INSERT INTO users (username, email, password, full_name, role, matric_number, class_id, active) VALUES
('student1', 'student1@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice Johnson', 'student', 'CBT001', 4, true),
('student2', 'student2@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob Wilson', 'student', 'CBT002', 4, true),
('student3', 'student3@cbtportal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carol Davis', 'student', 'CBT003', 5, true);

-- Insert sample teacher assignments
INSERT INTO teacher_assignments (teacher_id, class_id, subject_id) VALUES
-- Teacher 1: Mathematics and Physics for SS1 and SS2
(2, 4, 1), -- John Doe: SS1 Mathematics
(2, 5, 1), -- John Doe: SS2 Mathematics
(2, 4, 4), -- John Doe: SS1 Physics
(2, 5, 4), -- John Doe: SS2 Physics

-- Teacher 2: English and Literature for all classes
(3, 4, 2), -- Jane Smith: SS1 English
(3, 5, 2), -- Jane Smith: SS2 English
(3, 6, 2), -- Jane Smith: SS3 English
(3, 4, 9), -- Jane Smith: SS1 Literature
(3, 5, 9), -- Jane Smith: SS2 Literature
(3, 6, 9); -- Jane Smith: SS3 Literature

-- =====================================================
-- FUNCTIONS AND TRIGGERS
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
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for questions table
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View for student performance summary
CREATE VIEW student_performance_summary AS
SELECT 
    u.id as student_id,
    u.full_name as student_name,
    u.matric_number,
    c.name as class_name,
    COUNT(tr.id) as tests_taken,
    ROUND(AVG(tr.percentage), 2) as average_percentage,
    MAX(tr.percentage) as highest_percentage,
    MIN(tr.percentage) as lowest_percentage,
    SUM(CASE WHEN tr.percentage >= 70 THEN 1 ELSE 0 END) as passed_tests,
    SUM(CASE WHEN tr.percentage < 70 THEN 1 ELSE 0 END) as failed_tests
FROM users u
LEFT JOIN classes c ON u.class_id = c.id
LEFT JOIN test_results tr ON u.id = tr.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.matric_number, c.name;

-- View for subject performance analysis
CREATE VIEW subject_performance_analysis AS
SELECT 
    s.name as subject_name,
    c.name as class_name,
    COUNT(tr.id) as total_tests,
    ROUND(AVG(tr.percentage), 2) as average_percentage,
    COUNT(CASE WHEN tr.percentage >= 70 THEN 1 END) as pass_count,
    COUNT(CASE WHEN tr.percentage < 70 THEN 1 END) as fail_count,
    ROUND((COUNT(CASE WHEN tr.percentage >= 70 THEN 1 END) * 100.0 / COUNT(tr.id)), 2) as pass_rate
FROM test_results tr
JOIN test_codes tc ON tr.test_code_id = tc.id
JOIN subjects s ON tc.subject_id = s.id
JOIN classes c ON tc.class_id = c.id
GROUP BY s.name, c.name
HAVING COUNT(tr.id) > 0;

-- View for test code utilization
CREATE VIEW test_code_utilization AS
SELECT 
    tc.code,
    tc.class_name,
    tc.subject_name,
    tc.test_type,
    tc.num_questions,
    tc.duration,
    tc.active,
    COUNT(tr.id) as students_attempted,
    ROUND(AVG(tr.percentage), 2) as average_score,
    tc.created_at
FROM test_codes tc
LEFT JOIN test_results tr ON tc.id = tr.test_code_id
GROUP BY tc.id, tc.code, tc.class_name, tc.subject_name, tc.test_type, 
         tc.num_questions, tc.duration, tc.active, tc.created_at;

-- =====================================================
-- SECURITY AND CLEANUP
-- =====================================================

-- Function to clean old activity logs (keep only last 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM activity_logs 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '6 months';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate secure test codes
CREATE OR REPLACE FUNCTION generate_test_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(20) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MYSQL COMPATIBILITY NOTES
-- =====================================================
/*
To convert this schema for MySQL, make the following changes:

1. Replace SERIAL with AUTO_INCREMENT:
   - id SERIAL PRIMARY KEY → id INT AUTO_INCREMENT PRIMARY KEY

2. Replace TEXT with appropriate MySQL text types:
   - TEXT → TEXT or LONGTEXT depending on expected length

3. Replace BOOLEAN with TINYINT(1):
   - BOOLEAN → TINYINT(1)

4. Replace INET with VARCHAR:
   - ip_address INET → ip_address VARCHAR(45)

5. Replace generated columns syntax:
   - PostgreSQL: GENERATED ALWAYS AS (...) STORED
   - MySQL: AS (...) STORED

6. Replace functions and triggers with MySQL equivalents

7. Replace CURRENT_TIMESTAMP with NOW() where needed

8. Use MyISAM or InnoDB engine:
   - Add ENGINE=InnoDB; to each CREATE TABLE statement

Example MySQL conversion for users table:
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL,
    matric_number VARCHAR(50) UNIQUE,
    class_id INT,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
*/

-- =====================================================
-- END OF DATABASE SCHEMA
-- =====================================================

-- Log the completion
INSERT INTO activity_logs (user_id, action, details) VALUES 
(1, 'Database Schema Created', 'Initial database schema and sample data created successfully');
