-- EduAssistAI Database Schema
-- Database: eduassist_db
-- Target: MySQL 8.0+ / MariaDB 10.4+

CREATE DATABASE IF NOT EXISTS eduassist_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE eduassist_db;

-- 1. Users Table (Authentication & Primary Credentials)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reg_number VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'lecturer', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_reg (reg_number),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Students Profile Table
CREATE TABLE IF NOT EXISTS students (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(25),
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science',
    academic_year INT NOT NULL DEFAULT 2,
    current_semester VARCHAR(20) DEFAULT 'Year 2 Sem 2',
    gpa DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    academic_risk ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
    career_goal VARCHAR(100) DEFAULT 'Software Engineer',
    skills TEXT,
    interests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_dept (department),
    INDEX idx_student_risk (academic_risk)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Lecturers Profile Table
CREATE TABLE IF NOT EXISTS lecturers (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science',
    title VARCHAR(50) DEFAULT 'Senior Lecturer',
    office_location VARCHAR(100) DEFAULT 'Block B, Room 304',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Courses / Academic Modules Table
CREATE TABLE IF NOT EXISTS courses (
    code VARCHAR(20) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    department VARCHAR(100) NOT NULL DEFAULT 'Computer Science',
    semester VARCHAR(20) DEFAULT 'Year 2 Sem 2',
    lecturer_id INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_course_lecturer (lecturer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Student Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    student_id INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    enrollment_status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, course_code),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_code) REFERENCES courses(code) ON DELETE CASCADE,
    INDEX idx_enrollment_student (student_id),
    INDEX idx_enrollment_course (course_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Attendance Summary Table (Per Student Per Course)
CREATE TABLE IF NOT EXISTS attendance_summary (
    student_id INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    total_classes INT NOT NULL DEFAULT 0,
    attended_classes INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, course_code),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_code) REFERENCES courses(code) ON DELETE CASCADE,
    INDEX idx_att_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Exam Results & Continuous Assessments Table
CREATE TABLE IF NOT EXISTS exam_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    exam_type ENUM('quiz', 'midterm', 'final', 'assignment', 'overall') DEFAULT 'overall',
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    grade VARCHAR(5) DEFAULT NULL,
    grade_point DECIMAL(3,2) DEFAULT NULL,
    semester VARCHAR(20) DEFAULT 'Year 2 Sem 2',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_code) REFERENCES courses(code) ON DELETE CASCADE,
    INDEX idx_exam_student (student_id),
    INDEX idx_exam_course (course_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Assignments Table (Coursework Deliverables)
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATETIME NOT NULL,
    total_marks DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    weight DECIMAL(4,2) NOT NULL DEFAULT 10.00,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    status ENUM('active', 'archived', 'draft') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_code) REFERENCES courses(code) ON DELETE CASCADE,
    INDEX idx_assignment_course (course_code),
    INDEX idx_assignment_due (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Assignment Submissions Table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marks DECIMAL(5,2) DEFAULT NULL,
    status ENUM('pending', 'submitted', 'graded', 'late', 'resubmitted') DEFAULT 'submitted',
    feedback TEXT,
    submission_file VARCHAR(500) DEFAULT NULL,
    submission_text TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_assignment_student (assignment_id, student_id),
    INDEX idx_sub_student (student_id),
    INDEX idx_sub_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Career Paths Reference Table
CREATE TABLE IF NOT EXISTS career_paths (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    required_skills TEXT,
    recommended_courses TEXT,
    roadmap JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_career_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Student Verified Skills Table
CREATE TABLE IF NOT EXISTS student_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    current_level INT NOT NULL DEFAULT 1,
    target_level INT NOT NULL DEFAULT 5,
    status ENUM('needs_improvement', 'in_progress', 'proficient', 'mastered') DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_student_skill (student_id, skill_name),
    INDEX idx_skill_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Student Career Goals Table
CREATE TABLE IF NOT EXISTS career_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    career_path_id INT,
    target_role VARCHAR(100) NOT NULL,
    target_timeline VARCHAR(50) DEFAULT '12 months',
    readiness_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (career_path_id) REFERENCES career_paths(id) ON DELETE SET NULL,
    INDEX idx_goal_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Course Materials & Learning Resources Table
CREATE TABLE IF NOT EXISTS course_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type ENUM('video', 'pdf', 'slides', 'code', 'link') NOT NULL DEFAULT 'pdf',
    resource_url VARCHAR(500) NOT NULL,
    topic VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_code) REFERENCES courses(code) ON DELETE CASCADE,
    INDEX idx_material_course (course_code),
    INDEX idx_material_topic (topic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. AI Study Plan Tasks Table
CREATE TABLE IF NOT EXISTS study_plan_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) DEFAULT NULL,
    reason TEXT,
    deadline DATE,
    estimated_minutes INT DEFAULT 60,
    priority ENUM('URGENT', 'HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
    status ENUM('pending', 'completed') DEFAULT 'pending',
    resource_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_student (student_id),
    INDEX idx_task_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. AI Chat History Table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id VARCHAR(100) DEFAULT 'default',
    message TEXT NOT NULL,
    sender ENUM('user', 'ai') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_chat_student (student_id),
    INDEX idx_chat_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Career Path Skills Reference Table (Phase 10)
CREATE TABLE IF NOT EXISTS career_path_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    career_path_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    required_level INT NOT NULL DEFAULT 3,
    importance ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'HIGH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (career_path_id) REFERENCES career_paths(id) ON DELETE CASCADE,
    UNIQUE KEY uq_career_skill (career_path_id, skill_name),
    INDEX idx_cps_career (career_path_id),
    INDEX idx_cps_skill (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
