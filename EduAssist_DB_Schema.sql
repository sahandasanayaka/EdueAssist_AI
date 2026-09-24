-- EduAssist AI Database Schema
-- This script outlines the core relational structure of the platform.

CREATE DATABASE IF NOT EXISTS eduassist_db;
USE eduassist_db;

-- 1. USERS TABLE (Handles Students, Lecturers, and Admins)
CREATE TABLE Users (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role ENUM('student', 'lecturer', 'admin') NOT NULL,
    department VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. COURSES TABLE
CREATE TABLE Courses (
    course_code VARCHAR(20) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    lecturer_id VARCHAR(20),
    credits INT NOT NULL,
    FOREIGN KEY (lecturer_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- 3. ENROLLMENTS TABLE (Many-to-Many between Users and Courses)
CREATE TABLE Enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    course_code VARCHAR(20),
    current_grade FLOAT DEFAULT 0.0,
    attendance_percentage INT DEFAULT 100,
    FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_code) REFERENCES Courses(course_code) ON DELETE CASCADE
);

-- 4. ASSIGNMENTS TABLE
CREATE TABLE Assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20),
    title VARCHAR(200) NOT NULL,
    due_date DATETIME NOT NULL,
    FOREIGN KEY (course_code) REFERENCES Courses(course_code) ON DELETE CASCADE
);

-- 5. AI_INTERVENTIONS TABLE (Stores AI generated drafts for lecturers)
CREATE TABLE AI_Interventions (
    intervention_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    course_code VARCHAR(20),
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH'),
    ai_draft_message TEXT,
    status ENUM('pending', 'approved_and_sent', 'dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Users(id),
    FOREIGN KEY (course_code) REFERENCES Courses(course_code)
);
