-- EduAssistAI Database Seed Data
-- Database: eduassist_db
-- Password for all accounts: "password123"
-- Bcrypt hash: $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW

USE eduassist_db;

-- Clear previous data in correct foreign key order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ai_chat_history;
TRUNCATE TABLE study_plan_tasks;
TRUNCATE TABLE course_materials;
TRUNCATE TABLE career_goals;
TRUNCATE TABLE student_skills;
TRUNCATE TABLE career_path_skills;
TRUNCATE TABLE career_paths;
TRUNCATE TABLE assignment_submissions;
TRUNCATE TABLE assignments;
TRUNCATE TABLE exam_results;
TRUNCATE TABLE attendance_summary;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE courses;
TRUNCATE TABLE lecturers;
TRUNCATE TABLE students;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users (1 Admin, 2 Lecturers, 6 Students)
INSERT INTO users (id, reg_number, password_hash, role) VALUES
(1, 'admin01', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin'),
(2, 'Lec001', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'lecturer'),
(3, 'Lec002', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'lecturer'),
(4, '2023CSCA001', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student'),
(5, '2023CSCA002', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student'),
(6, '2023CSCA003', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student'),
(7, '2023CSCA004', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student'),
(8, '2023CSCA005', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student'),
(9, '2023CSCA006', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'student');

-- 2. Lecturers Profiles
INSERT INTO lecturers (user_id, full_name, email, department, title, office_location) VALUES
(2, 'Dr. Sanath Jayasuriya', 'sanath.j@univ.ac.lk', 'Computer Science', 'Associate Professor', 'Faculty Block B, Room 304'),
(3, 'Prof. Amanda Silva', 'amanda.s@univ.ac.lk', 'Software Engineering', 'Senior Lecturer', 'Faculty Block B, Room 212');

-- 3. Students Profiles (Diverse Academic Profiles)
INSERT INTO students (user_id, full_name, email, phone, department, academic_year, current_semester, gpa, academic_risk, career_goal, skills, interests) VALUES
(4, 'Kaveen Senanayake', 'kaveen.s@univ.ac.lk', '+94 77 123 4567', 'Computer Science', 2, 'Year 2 Sem 2', 3.85, 'Low', 'Software Engineer', 'React, Node.js, Python, SQL, Git', 'Cloud Architecture, Microservices'),
(5, 'Kavinda Fernando', 'kavinda.f@univ.ac.lk', '+94 77 234 5678', 'Computer Science', 2, 'Year 2 Sem 2', 3.20, 'Low', 'Data Analyst', 'SQL, Python, Excel, PowerBI', 'Data Mining, Business Intelligence'),
(6, 'Nimal Bandara', 'nimal.b@univ.ac.lk', '+94 77 345 6789', 'Computer Science', 2, 'Year 2 Sem 2', 2.15, 'High', 'Software Engineer', 'Java, HTML, CSS', 'Web Development, Mobile Apps'),
(7, 'Sanduni Jayawardena', 'sanduni.j@univ.ac.lk', '+94 77 456 7890', 'Computer Science', 2, 'Year 2 Sem 2', 1.80, 'High', 'Cybersecurity Analyst', 'Linux Basics, Networking Fundamentals', 'Ethical Hacking, Network Defense'),
(8, 'Kasun Wijesinghe', 'kasun.w@univ.ac.lk', '+94 77 567 8901', 'Computer Science', 2, 'Year 2 Sem 2', 2.85, 'Medium', 'Cloud Engineer', 'Docker Basics, Python, Linux', 'DevOps, CI/CD Pipelines'),
(9, 'Dilani Alwis', 'dilani.a@univ.ac.lk', '+94 77 678 9012', 'Computer Science', 2, 'Year 2 Sem 2', 3.40, 'Low', 'UI/UX Designer', 'Figma, CSS, React, User Research', 'Design Systems, Human-Computer Interaction');

-- 4. Courses / Academic Modules
INSERT INTO courses (code, title, credits, department, semester, lecturer_id, description) VALUES
('CSC202S2', 'Software Engineering Principles', 3, 'Computer Science', 'Year 2 Sem 2', 2, 'Agile methodologies, software design patterns, testing lifecycles, and architectural specifications.'),
('CSC203S2', 'Database Management Systems', 3, 'Computer Science', 'Year 2 Sem 2', 2, 'Relational algebra, SQL normalization (1NF-3NF), query indexing, transactions, and ACID properties.'),
('CSC204S2', 'Computer Networks & Protocols', 3, 'Computer Science', 'Year 2 Sem 2', 3, 'OSI and TCP/IP stack layers, socket programming, routing protocols, subnetting, and network security.'),
('CSC205S2', 'Data Structures & Algorithms', 3, 'Computer Science', 'Year 2 Sem 2', 3, 'Time complexity, tree traversals, graph algorithms, dynamic programming, and heaps.'),
('CSC206S2', 'Artificial Intelligence Fundamentals', 3, 'Computer Science', 'Year 2 Sem 2', 2, 'Heuristic search, knowledge representation, reinforcement learning, and neural network foundations.');

-- 5. Student Enrollments
INSERT INTO enrollments (student_id, course_code, enrollment_status) VALUES
-- Student 001 (Enrolled in 5 modules)
(4, 'CSC202S2', 'active'), (4, 'CSC203S2', 'active'), (4, 'CSC204S2', 'active'), (4, 'CSC205S2', 'active'), (4, 'CSC206S2', 'active'),
-- Student 002
(5, 'CSC202S2', 'active'), (5, 'CSC203S2', 'active'), (5, 'CSC204S2', 'active'), (5, 'CSC205S2', 'active'), (5, 'CSC206S2', 'active'),
-- Student 003 (Needs help)
(6, 'CSC202S2', 'active'), (6, 'CSC203S2', 'active'), (6, 'CSC204S2', 'active'),
-- Student 004 (At risk)
(7, 'CSC202S2', 'active'), (7, 'CSC203S2', 'active'), (7, 'CSC204S2', 'active'),
-- Student 005
(8, 'CSC202S2', 'active'), (8, 'CSC203S2', 'active'), (8, 'CSC204S2', 'active'), (8, 'CSC205S2', 'active'),
-- Student 006
(9, 'CSC202S2', 'active'), (9, 'CSC203S2', 'active'), (9, 'CSC204S2', 'active'), (9, 'CSC205S2', 'active');

-- 6. Attendance Summary
INSERT INTO attendance_summary (student_id, course_code, total_classes, attended_classes) VALUES
-- Student 001 (High Performer: 92-96% attendance)
(4, 'CSC202S2', 24, 23),
(4, 'CSC203S2', 24, 24),
(4, 'CSC204S2', 24, 22),
(4, 'CSC205S2', 24, 23),
(4, 'CSC206S2', 24, 24),
-- Student 002 (Good: ~85%)
(5, 'CSC202S2', 24, 21),
(5, 'CSC203S2', 24, 20),
(5, 'CSC204S2', 24, 19),
(5, 'CSC205S2', 24, 21),
(5, 'CSC206S2', 24, 22),
-- Student 003 (Needs Help: 66% in DB, 92% in SE, 83% in Networks)
(6, 'CSC202S2', 24, 22),
(6, 'CSC203S2', 24, 16),
(6, 'CSC204S2', 24, 20),
-- Student 004 (Critical: <60%)
(7, 'CSC202S2', 24, 14),
(7, 'CSC203S2', 24, 12),
(7, 'CSC204S2', 24, 13),
-- Student 005
(8, 'CSC202S2', 24, 19),
(8, 'CSC203S2', 24, 18),
(8, 'CSC204S2', 24, 20),
(8, 'CSC205S2', 24, 19),
-- Student 006
(9, 'CSC202S2', 24, 22),
(9, 'CSC203S2', 24, 21),
(9, 'CSC204S2', 24, 22),
(9, 'CSC205S2', 24, 21);

-- 7. Exam Results (For deterministic GPA & weak/strong subject analysis)
INSERT INTO exam_results (student_id, course_code, exam_type, score, max_score, grade, grade_point, semester) VALUES
-- Student 001 (High: A / A-)
(4, 'CSC202S2', 'overall', 88.00, 100.00, 'A', 4.00, 'Year 2 Sem 2'),
(4, 'CSC203S2', 'overall', 92.50, 100.00, 'A+', 4.00, 'Year 2 Sem 2'),
(4, 'CSC204S2', 'overall', 84.00, 100.00, 'A-', 3.70, 'Year 2 Sem 2'),
(4, 'CSC205S2', 'overall', 89.00, 100.00, 'A', 4.00, 'Year 2 Sem 2'),
(4, 'CSC206S2', 'overall', 86.50, 100.00, 'A', 4.00, 'Year 2 Sem 2'),
-- Student 002 (B+ / A-)
(5, 'CSC202S2', 'overall', 76.00, 100.00, 'B+', 3.30, 'Year 2 Sem 2'),
(5, 'CSC203S2', 'overall', 82.00, 100.00, 'A-', 3.70, 'Year 2 Sem 2'),
(5, 'CSC204S2', 'overall', 71.00, 100.00, 'B', 3.00, 'Year 2 Sem 2'),
(5, 'CSC205S2', 'overall', 74.00, 100.00, 'B', 3.00, 'Year 2 Sem 2'),
(5, 'CSC206S2', 'overall', 75.00, 100.00, 'B+', 3.30, 'Year 2 Sem 2'),
-- Student 003 (Needs Help: 54% in DB Normalization, C+ overall in DB)
(6, 'CSC202S2', 'overall', 81.00, 100.00, 'A-', 3.70, 'Year 2 Sem 2'),
(6, 'CSC203S2', 'overall', 52.00, 100.00, 'C', 2.00, 'Year 2 Sem 2'),
(6, 'CSC204S2', 'overall', 62.00, 100.00, 'C+', 2.30, 'Year 2 Sem 2'),
-- Student 004 (High Risk: D / F)
(7, 'CSC202S2', 'overall', 48.00, 100.00, 'D', 1.00, 'Year 2 Sem 2'),
(7, 'CSC203S2', 'overall', 42.00, 100.00, 'F', 0.00, 'Year 2 Sem 2'),
(7, 'CSC204S2', 'overall', 51.00, 100.00, 'C-', 1.70, 'Year 2 Sem 2'),
-- Student 005
(8, 'CSC202S2', 'overall', 72.00, 100.00, 'B', 3.00, 'Year 2 Sem 2'),
(8, 'CSC203S2', 'overall', 68.00, 100.00, 'B-', 2.70, 'Year 2 Sem 2'),
(8, 'CSC204S2', 'overall', 70.00, 100.00, 'B', 3.00, 'Year 2 Sem 2'),
-- Student 006
(9, 'CSC202S2', 'overall', 84.00, 100.00, 'A-', 3.70, 'Year 2 Sem 2'),
(9, 'CSC203S2', 'overall', 79.00, 100.00, 'B+', 3.30, 'Year 2 Sem 2'),
(9, 'CSC204S2', 'overall', 78.00, 100.00, 'B+', 3.30, 'Year 2 Sem 2');

-- 8. Assignments
INSERT INTO assignments (id, course_code, title, description, due_date, total_marks, weight, difficulty, status) VALUES
(1, 'CSC203S2', 'Database Normalization & Relational Schema', 'Convert the unnormalized hospital system database into 1NF, 2NF, and 3NF. Include relational diagrams and SQL DDL.', DATE_ADD(NOW(), INTERVAL 1 DAY), 100.00, 15.00, 'hard', 'active'),
(2, 'CSC202S2', 'React Frontend Architecture & State Flow', 'Implement a modular university event booking system with React 19, responsive layout, and clean state handling.', DATE_ADD(NOW(), INTERVAL 5 DAY), 100.00, 20.00, 'medium', 'active'),
(3, 'CSC204S2', 'Network Topology Analysis & Subnetting', 'Configure a three-tier hierarchical campus network topology with VLSM IP subnet allocation and routing tables.', DATE_SUB(NOW(), INTERVAL 7 DAY), 100.00, 15.00, 'medium', 'active'),
(4, 'CSC205S2', 'Binary Search Tree & Heap Optimization', 'Benchmark performance of AVL balanced trees against standard binary search trees under high insertion volumes.', DATE_ADD(NOW(), INTERVAL 12 DAY), 100.00, 20.00, 'hard', 'active');

-- 9. Assignment Submissions
INSERT INTO assignment_submissions (assignment_id, student_id, submitted_at, marks, status, feedback) VALUES
-- Assignment 3 (Graded for Student 001, 002, 003)
(3, 4, DATE_SUB(NOW(), INTERVAL 8 DAY), 95.00, 'graded', 'Exceptional subnet design and complete routing table documentation.'),
(3, 5, DATE_SUB(NOW(), INTERVAL 7 DAY), 85.00, 'graded', 'Well structured. Minor calculation offset in Subnet C broadcast address.'),
(3, 6, DATE_SUB(NOW(), INTERVAL 7 DAY), 78.00, 'graded', 'Satisfactory submission. Review routing protocol convergence metrics.'),
-- Assignment 2 (Submitted for 001, In-progress for 003)
(2, 4, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 'submitted', 'Awaiting lecturer evaluation.'),
-- Assignment 1 (Pending for 003 - causes urgent alert)
(1, 4, NOW(), 98.00, 'graded', 'Flawless 3NF decomposition with functional dependency proofs.');

-- 10. Career Paths (8 Diverse Paths)
INSERT INTO career_paths (id, name, description, required_skills, recommended_courses, roadmap) VALUES
(1, 'Software Engineer', 'Designs, builds, and maintains reliable full-stack applications, scalable systems, and microservices.', 'Java, Python, React, Node.js, REST APIs, SQL, System Design, Git', 'CSC202S2, CSC203S2, CSC205S2', 
JSON_ARRAY(
  JSON_OBJECT('step', 1, 'title', 'Master Core Programming', 'desc', 'Complete Java, Python, and object-oriented fundamentals', 'done', true),
  JSON_OBJECT('step', 2, 'title', 'Learn Frontend & Backend', 'desc', 'Build full-stack CRUD applications with React, Express, and SQL', 'done', true),
  JSON_OBJECT('step', 3, 'title', 'Build a Full-Stack Portfolio', 'desc', 'Develop at least 3 production-quality GitHub repositories', 'done', false),
  JSON_OBJECT('step', 4, 'title', 'Algorithms & Problem Solving', 'desc', 'Complete 50 intermediate algorithm questions on data structures', 'done', false),
  JSON_OBJECT('step', 5, 'title', 'Industry Internship Application', 'desc', 'Refine technical CV and participate in technical screening interviews', 'done', false)
)),
(2, 'Data Analyst', 'Interprets complex datasets to help academic and business organizations make data-informed decisions.', 'SQL, Python, Excel, PowerBI, Tableau, Statistics, Data Cleaning', 'CSC203S2, CSC206S2',
JSON_ARRAY(
  JSON_OBJECT('step', 1, 'title', 'SQL & Relational Querying', 'desc', 'Master complex JOINs, subqueries, and window functions', 'done', true),
  JSON_OBJECT('step', 2, 'title', 'Python for Data Analysis', 'desc', 'Pandas, NumPy, and Matplotlib data manipulation pipelines', 'done', false),
  JSON_OBJECT('step', 3, 'title', 'Business Intelligence Dashboards', 'desc', 'Build interactive reporting dashboards in PowerBI or Tableau', 'done', false)
)),
(3, 'Data Scientist', 'Develops predictive statistical models, machine learning algorithms, and deep analytics pipelines.', 'Python, R, Machine Learning, Deep Learning, Linear Algebra, Probability, Pandas, Scikit-Learn', 'CSC205S2, CSC206S2',
JSON_ARRAY(
  JSON_OBJECT('step', 1, 'title', 'Mathematical Foundations', 'desc', 'Multivariable calculus, linear algebra, and inferential statistics', 'done', true),
  JSON_OBJECT('step', 2, 'title', 'Classical Machine Learning', 'desc', 'Implement regression, decision trees, clustering, and ensemble methods', 'done', false),
  JSON_OBJECT('step', 3, 'title', 'Deep Learning & NLP', 'desc', 'Neural networks, PyTorch, transformers, and model deployment', 'done', false)
)),
(4, 'UI/UX Designer', 'Crafts intuitive, accessible, and human-centered digital experiences and design systems.', 'Figma, Wireframing, User Research, Usability Testing, HTML/CSS, Prototyping, Accessibility (WCAG)', 'CSC202S2',
JSON_ARRAY(
  JSON_OBJECT('step', 1, 'title', 'UX Principles & Research', 'desc', 'User journey mapping, personas, and qualitative user interviews', 'done', true),
  JSON_OBJECT('step', 2, 'title', 'Figma Prototyping & Design Systems', 'desc', 'Create responsive mobile and web component design libraries', 'done', true),
  JSON_OBJECT('step', 3, 'title', 'Usability Testing & Case Studies', 'desc', 'Publish 2 comprehensive product case studies on Behance/Portfolio', 'done', false)
)),
(5, 'Cybersecurity Analyst', 'Protects enterprise networks, systems, and cloud infrastructure from security threats and breaches.', 'Network Security, Linux, Penetration Testing, SIEM, Firewalls, Cryptography, Ethical Hacking', 'CSC204S2',
JSON_ARRAY(
  JSON_OBJECT('step', 1, 'title', 'Networking & Linux Mastery', 'desc', 'Deep packet inspection with Wireshark and Linux bash security hardening', 'done', true),
  JSON_OBJECT('step', 2, 'title', 'Security Standards & Compliance', 'desc', 'SOC2, ISO 27001, and vulnerability scanning with Nmap/Metasploit', 'done', false),
  JSON_OBJECT('step', 3, 'title', 'Security Certifications', 'desc', 'Prepare for CompTIA Security+ or CEH certification exams', 'done', false)
)),
(6, 'Cloud Engineer', 'Architects, deploys, and automates high-availability infrastructure on public cloud providers.', 'AWS, Azure, Docker, Kubernetes, Terraform, CI/CD Pipelines, Linux Administration', 'CSC202S2, CSC204S2',
JSON_ARRAY(
  JSON_OBJECT('step', 1, 'title', 'Cloud Core Services', 'desc', 'AWS EC2, S3, VPC networking, and IAM role security', 'done', true),
  JSON_OBJECT('step', 2, 'title', 'Containerization & Orchestration', 'desc', 'Package applications with Docker and deploy to Kubernetes clusters', 'done', false),
  JSON_OBJECT('step', 3, 'title', 'Infrastructure as Code', 'desc', 'Automate multi-region deployments using Terraform and GitHub Actions', 'done', false)
)),
(7, 'Database Administrator', 'Maintains relational database performance, backup resilience, indexing, and high availability.', 'MySQL, PostgreSQL, Query Optimization, Replication, Clustering, Backup/Recovery, Sharding', 'CSC203S2',
JSON_ARRAY(
  JSON_OBJECT('step', 1, 'title', 'Advanced SQL & Schemas', 'desc', 'Complex schema normalization, stored procedures, and triggers', 'done', true),
  JSON_OBJECT('step', 2, 'title', 'Query Profiling & Indexing', 'desc', 'Explain plans, B-Tree vs Hash indexes, and dead-lock debugging', 'done', false),
  JSON_OBJECT('step', 3, 'title', 'Disaster Recovery & High Availability', 'desc', 'Active-active replication, automated failover, and point-in-time recovery', 'done', false)
)),
(8, 'Product Manager', 'Bridges technology, business, and user experience to drive product strategy and execution.', 'Product Strategy, Agile/Scrum, Roadmapping, Data Analytics, User Stories, A/B Testing', 'CSC202S2',
JSON_ARRAY(
  JSON_OBJECT('step', 1, 'title', 'Agile Product Ownership', 'desc', 'Backlog grooming, sprint planning, and writing actionable user stories', 'done', true),
  JSON_OBJECT('step', 2, 'title', 'Market & Metric Validation', 'desc', 'North star metrics, funnel analysis, and feature hypothesis testing', 'done', false),
  JSON_OBJECT('step', 3, 'title', 'End-to-End Product Launch', 'desc', 'Lead a student venture or open-source product release from inception', 'done', false)
));

-- 11. Student Skills (For Skill Gap Analysis)
INSERT INTO student_skills (student_id, skill_name, current_level, target_level, status) VALUES
-- Student 001 (Aspiring Software Engineer)
(4, 'Core Programming (Java/Python)', 5, 5, 'mastered'),
(4, 'Frontend (React/CSS)', 4, 5, 'proficient'),
(4, 'Backend (Node.js/Express)', 4, 5, 'proficient'),
(4, 'Relational Databases (SQL)', 5, 5, 'mastered'),
(4, 'Cloud Deployment (AWS)', 3, 4, 'in_progress'),
-- Student 003 (Needs Help - Significant Skill Gaps)
(6, 'Core Programming (Java)', 3, 5, 'in_progress'),
(6, 'Frontend (React)', 2, 4, 'needs_improvement'),
(6, 'Relational Databases (SQL Normalization)', 2, 5, 'needs_improvement'),
(6, 'Computer Networks', 3, 4, 'in_progress');

-- 12. Student Career Goals
INSERT INTO career_goals (student_id, career_path_id, target_role, target_timeline, readiness_score) VALUES
(4, 1, 'Software Engineer', '12 months', 85.00),
(5, 2, 'Data Analyst', '12 months', 72.00),
(6, 1, 'Software Engineer', '12 months', 64.00),
(7, 5, 'Cybersecurity Analyst', '18 months', 42.00),
(8, 6, 'Cloud Engineer', '12 months', 68.00),
(9, 4, 'UI/UX Designer', '12 months', 80.00);

-- 13. Course Materials
INSERT INTO course_materials (course_code, title, description, resource_type, resource_url, topic) VALUES
('CSC202S2', 'React 19 University Guide', 'Comprehensive guide covering component lifecycle, hooks, and clean state architectures.', 'video', 'https://www.youtube.com/watch?v=bMknfKXIFA8', 'Frontend Engineering'),
('CSC203S2', 'Database Normalization (1NF to 3NF)', 'Formal definitions, functional dependencies, decomposition algorithms, and practice problem sets.', 'pdf', 'https://cs125.cs.illinois.edu/notes/database-normalization.pdf', 'Relational Theory'),
('CSC204S2', 'TCP/IP Protocol Suite & Wireshark Labs', 'Hands-on socket packet captures and transport layer sliding window protocol analysis.', 'pdf', 'https://www.wireshark.org/docs/wsug_html_chunked/', 'Network Protocols'),
('CSC202S2', 'AWS Cloud & Serverless Deployment Tutorial', 'Deploying containerized Express APIs onto AWS ECS and Fargate.', 'video', 'https://aws.amazon.com/training/', 'Cloud Infrastructure'),
('CSC205S2', 'Algorithm Complexity & Big-O Reference', 'Visual cheat sheet and proof guidelines for dynamic programming and graph traversals.', 'pdf', 'https://www.bigocheatsheet.com/', 'Data Structures');

-- 14. AI Study Plan Tasks
INSERT INTO study_plan_tasks (student_id, title, course_code, reason, deadline, estimated_minutes, priority, status, resource_link) VALUES
-- Student 001 (Extension & Internship)
(4, 'Explore AWS Cloud certifications', 'CSC201S2', 'High performer extension recommendation', DATE_ADD(NOW(), INTERVAL 14 DAY), 90, 'LOW', 'pending', 'https://aws.amazon.com/training/'),
(4, 'Start full-stack React open-source project', 'CSC202S2', 'Target career goal readiness accelerator', DATE_ADD(NOW(), INTERVAL 7 DAY), 120, 'MEDIUM', 'pending', 'https://github.com/topics/ecommerce-platform'),
(4, 'Apply for Summer Software Engineering Internship', NULL, 'Career readiness target achieved at 85%', DATE_ADD(NOW(), INTERVAL 21 DAY), 60, 'HIGH', 'pending', NULL),
-- Student 003 (Remediation & Intervention Tasks)
(6, 'Finish Database Normalization practice set', 'CSC203S2', 'Recovering from low score in CSC203S2 Quiz 1', DATE_ADD(NOW(), INTERVAL 1 DAY), 90, 'URGENT', 'pending', 'https://cs125.cs.illinois.edu/notes/database-normalization.pdf'),
(6, 'Submit React UI Coursework Assignment', 'CSC202S2', 'Due in 2 days to avoid late submission penalty', DATE_ADD(NOW(), INTERVAL 2 DAY), 120, 'HIGH', 'pending', NULL),
(6, 'Attend Consultation with Dr. Robert Smith', 'CSC203S2', 'Attendance in Database Systems dropped to 66%', DATE_ADD(NOW(), INTERVAL 3 DAY), 45, 'HIGH', 'pending', NULL),
(6, 'Review Networking Layer 4 Protocols', 'CSC204S2', 'Identified weak subject from continuous assessments', DATE_ADD(NOW(), INTERVAL 6 DAY), 60, 'MEDIUM', 'pending', NULL),
(6, 'Read Clean Code Chapter 3', 'CSC201S2', 'Foundational software engineering practice', DATE_SUB(NOW(), INTERVAL 2 DAY), 30, 'LOW', 'completed', NULL);

-- 15. AI Chat History
INSERT INTO ai_chat_history (student_id, session_id, message, sender, timestamp) VALUES
(6, 'sess_demo_003', 'Why is my GPA currently low?', 'user', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(6, 'sess_demo_003', 'Based on your latest LMS data, your GPA dropped to 2.15 primarily due to your score (52%) in Database Systems (CSC203S2) and your attendance dropping to 66%. I have placed a Database Normalization tutorial at the top of your AI Study Plan.', 'ai', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(6, 'sess_demo_003', 'What should I do to become ready for a Software Engineer job?', 'user', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(6, 'sess_demo_003', 'Your career readiness is currently 64%. Your primary skill gaps are in Relational Database design and advanced React state management. Completing your pending coursework and building a full-stack project will boost your readiness to 75%.', 'ai', DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- 16. Career Path Skills (Phase 10)
INSERT INTO career_path_skills (career_path_id, skill_name, required_level, importance) VALUES
-- Path 1: Software Engineer
(1, 'Core Programming (Java/Python)', 4, 'HIGH'),
(1, 'Relational Databases (SQL)', 4, 'HIGH'),
(1, 'Backend (Node.js/Express)', 4, 'HIGH'),
(1, 'Frontend (React/CSS)', 3, 'MEDIUM'),
(1, 'Git & Version Control', 4, 'HIGH'),
(1, 'REST APIs & System Design', 3, 'HIGH'),
(1, 'Cloud Deployment (AWS)', 2, 'MEDIUM'),
-- Path 2: Data Analyst
(2, 'Relational Databases (SQL)', 4, 'HIGH'),
(2, 'Python for Data Analysis', 4, 'HIGH'),
(2, 'Business Intelligence (PowerBI/Tableau)', 3, 'HIGH'),
(2, 'Excel & Data Cleaning', 4, 'MEDIUM'),
(2, 'Statistics & Probability', 3, 'HIGH'),
-- Path 3: Data Scientist
(3, 'Python & Machine Learning', 5, 'HIGH'),
(3, 'Statistics & Linear Algebra', 4, 'HIGH'),
(3, 'Relational Databases (SQL)', 4, 'HIGH'),
(3, 'Deep Learning', 3, 'MEDIUM'),
(3, 'Data Visualization', 3, 'MEDIUM'),
-- Path 4: UI/UX Designer
(4, 'Figma & Prototyping', 5, 'HIGH'),
(4, 'User Research & Testing', 4, 'HIGH'),
(4, 'Design Systems & Wireframing', 4, 'HIGH'),
(4, 'HTML/CSS Fundamentals', 3, 'MEDIUM'),
(4, 'Accessibility (WCAG)', 3, 'MEDIUM'),
-- Path 5: Cybersecurity Analyst
(5, 'Network Security', 4, 'HIGH'),
(5, 'Linux Administration', 4, 'HIGH'),
(5, 'Penetration Testing & Ethical Hacking', 3, 'HIGH'),
(5, 'Cryptography & Standards', 3, 'MEDIUM'),
(5, 'Incident Response', 3, 'MEDIUM'),
-- Path 6: Cloud Engineer
(6, 'Cloud Infrastructure (AWS/Azure)', 4, 'HIGH'),
(6, 'Docker & Kubernetes', 4, 'HIGH'),
(6, 'CI/CD Pipelines', 3, 'HIGH'),
(6, 'Linux Administration', 4, 'HIGH'),
(6, 'Infrastructure as Code (Terraform)', 3, 'MEDIUM'),
-- Path 7: Database Administrator
(7, 'Relational Databases (SQL)', 5, 'HIGH'),
(7, 'Query Optimization & Indexing', 5, 'HIGH'),
(7, 'Database Replication & Clustering', 4, 'HIGH'),
(7, 'Backup & Disaster Recovery', 4, 'HIGH'),
(7, 'Linux Administration', 3, 'MEDIUM'),
-- Path 8: Product Manager
(8, 'Product Strategy & Roadmapping', 5, 'HIGH'),
(8, 'Agile & Scrum Methodology', 4, 'HIGH'),
(8, 'Data Analytics & A/B Testing', 3, 'HIGH'),
(8, 'User Stories & Backlog Grooming', 4, 'HIGH'),
(8, 'Stakeholder Communication', 4, 'HIGH');

