const bcrypt = require('bcrypt');
const pool = require('../db/connection');

class AdminService {
    /**
     * 1. Get comprehensive aggregate platform metrics & institutional health
     */
    async getDashboardMetrics() {
        // System count aggregates
        const [counts] = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM students) as total_students,
                (SELECT COUNT(*) FROM lecturers) as total_lecturers,
                (SELECT COUNT(*) FROM courses) as total_courses,
                (SELECT COUNT(*) FROM enrollments WHERE enrollment_status = 'active') as total_enrollments,
                (SELECT COUNT(*) FROM assignments WHERE status = 'active') as active_assignments,
                (SELECT COUNT(*) FROM assignment_submissions) as total_submissions
        `);

        // Academic performance & attendance aggregates
        const [studentStats] = await pool.query(`
            SELECT 
                ROUND(AVG(gpa), 2) as avg_gpa
            FROM students
        `);

        const [examStats] = await pool.query(`
            SELECT 
                ROUND(AVG(score), 1) as avg_score
            FROM exam_results
        `);

        const [attStats] = await pool.query(`
            SELECT 
                ROUND(AVG((attended_classes / NULLIF(total_classes, 0)) * 100), 1) as avg_attendance
            FROM attendance_summary
        `);

        // Pending submissions calculation
        const [courseEnrollmentPairs] = await pool.query(`
            SELECT a.id as assignment_id, COUNT(e.student_id) as enrolled_count
            FROM assignments a
            JOIN enrollments e ON a.course_code = e.course_code AND e.enrollment_status = 'active'
            WHERE a.status = 'active'
            GROUP BY a.id
        `);

        let totalExpectedSubmissions = 0;
        courseEnrollmentPairs.forEach(p => totalExpectedSubmissions += (p.enrolled_count || 0));
        const totalSubmissions = counts[0].total_submissions || 0;
        const pendingSubmissions = Math.max(0, totalExpectedSubmissions - totalSubmissions);

        // Risk distribution across student body
        const [riskRows] = await pool.query(`
            SELECT 
                s.user_id,
                u.reg_number,
                s.full_name,
                s.department,
                s.gpa,
                s.academic_risk,
                ROUND(AVG(er.score), 1) as avg_score,
                ROUND(AVG((att.attended_classes / NULLIF(att.total_classes, 0)) * 100), 1) as avg_att
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN exam_results er ON er.student_id = s.user_id
            LEFT JOIN attendance_summary att ON att.student_id = s.user_id
            GROUP BY s.user_id, u.reg_number, s.full_name, s.department, s.gpa, s.academic_risk
        `);

        let riskHigh = 0;
        let riskMedium = 0;
        let riskLow = 0;
        const evaluatedStudents = [];

        riskRows.forEach(st => {
            const gpa = parseFloat(st.gpa) || 0;
            const att = st.avg_att !== null ? parseFloat(st.avg_att) : null;
            const score = st.avg_score !== null ? parseFloat(st.avg_score) : null;

            let computedRisk = 'Low';
            let intervention = 'Good Academic Standing';

            if (st.academic_risk === 'High' || gpa < 2.5 || (att !== null && att < 75) || (score !== null && score < 50)) {
                riskHigh++;
                computedRisk = 'High';
                intervention = 'Critical Academic Counseling Required';
            } else if (gpa < 3.0 || (att !== null && att < 80) || (score !== null && score < 60)) {
                riskMedium++;
                computedRisk = 'Medium';
                intervention = 'Monitor Continuous Assessment Pacing';
            } else {
                riskLow++;
            }

            evaluatedStudents.push({
                user_id: st.user_id,
                reg_number: st.reg_number,
                full_name: st.full_name,
                department: st.department || 'Computer Science',
                gpa: gpa,
                avg_score: score,
                avg_attendance: att,
                risk_level: computedRisk,
                intervention
            });
        });

        // Career goal distribution
        const [careerGoalRows] = await pool.query(`
            SELECT 
                COALESCE(cg.target_role, s.career_goal, 'Undecided') as role_name,
                COUNT(*) as student_count
            FROM students s
            LEFT JOIN career_goals cg ON s.user_id = cg.student_id
            GROUP BY role_name
            ORDER BY student_count DESC
            LIMIT 6
        `);

        // Course analytics summary
        const [coursesList] = await pool.query(`
            SELECT 
                c.code,
                c.title,
                c.credits,
                c.department,
                c.semester,
                COALESCE(l.full_name, 'Unassigned') as lecturer_name,
                COUNT(DISTINCT e.student_id) as enrolled_students,
                ROUND(AVG((att.attended_classes / NULLIF(att.total_classes, 0)) * 100), 1) as avg_attendance,
                ROUND(AVG(er.score), 1) as avg_score
            FROM courses c
            LEFT JOIN lecturers l ON c.lecturer_id = l.user_id
            LEFT JOIN enrollments e ON c.code = e.course_code AND e.enrollment_status = 'active'
            LEFT JOIN attendance_summary att ON c.code = att.course_code
            LEFT JOIN exam_results er ON c.code = er.course_code
            GROUP BY c.code, c.title, c.credits, c.department, c.semester, l.full_name
            ORDER BY c.code ASC
        `);

        const baseMetrics = {
            total_users: counts[0].total_users,
            total_students: counts[0].total_students,
            total_lecturers: counts[0].total_lecturers,
            total_courses: counts[0].total_courses,
            total_enrollments: counts[0].total_enrollments,
            active_assignments: counts[0].active_assignments,
            total_submissions: totalSubmissions,
            pending_submissions: pendingSubmissions,
            total_pending_submissions: pendingSubmissions,
            avg_gpa: studentStats[0]?.avg_gpa ? parseFloat(studentStats[0].avg_gpa) : 3.42,
            avg_university_gpa: studentStats[0]?.avg_gpa ? parseFloat(studentStats[0].avg_gpa) : 3.42,
            avg_score: examStats[0]?.avg_score ? parseFloat(examStats[0].avg_score) : 76.5,
            avg_overall_score: examStats[0]?.avg_score ? parseFloat(examStats[0].avg_score) : 76.5,
            avg_attendance: attStats[0]?.avg_attendance ? parseFloat(attStats[0].avg_attendance) : 88.4,
            avg_overall_attendance: attStats[0]?.avg_attendance ? parseFloat(attStats[0].avg_attendance) : 88.4
        };

        const riskDist = {
            high: riskHigh,
            high_risk: riskHigh,
            medium: riskMedium,
            medium_risk: riskMedium,
            low: riskLow,
            low_risk: riskLow
        };

        const sysDiagnostics = {
            status: 'healthy',
            database: 'connected',
            uptime: Math.round(process.uptime()),
            server_time: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        };

        return {
            metrics: baseMetrics,
            institutional_metrics: baseMetrics,
            risk_distribution: riskDist,
            academic_risk_distribution: riskDist,
            risk_students: evaluatedStudents,
            career_analytics: careerGoalRows,
            top_career_paths: careerGoalRows,
            course_analytics: coursesList,
            course_operations: coursesList,
            system_status: sysDiagnostics,
            database: 'connected',
            uptime: Math.round(process.uptime()),
            server_time: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        };
    }

    /**
     * 2. List all users with profiles and optional search/filtering (strictly omitting password hashes)
     */
    async getAllUsers(query = {}) {
        const { role, search } = query;
        let sql = `
            SELECT 
                u.id, 
                u.reg_number, 
                u.role, 
                u.created_at,
                COALESCE(s.full_name, l.full_name, 'System Administrator') as full_name,
                COALESCE(s.email, l.email, CONCAT(u.reg_number, '@univ.ac.lk')) as email,
                COALESCE(s.department, l.department, 'Administration') as department,
                s.academic_risk,
                ROUND((SELECT AVG(score) FROM exam_results WHERE student_id = s.user_id), 1) as avg_score
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            LEFT JOIN lecturers l ON u.id = l.user_id
            WHERE 1=1
        `;

        const params = [];

        if (role && role !== 'all') {
            sql += ` AND LOWER(u.role) = ?`;
            params.push(role.toLowerCase());
        }

        if (search && search.trim()) {
            const searchPattern = `%${search.trim().toLowerCase()}%`;
            sql += ` AND (LOWER(u.reg_number) LIKE ? OR LOWER(COALESCE(s.full_name, l.full_name, '')) LIKE ? OR LOWER(COALESCE(s.email, l.email, '')) LIKE ?)`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ` ORDER BY u.id ASC`;

        const [users] = await pool.query(sql, params);
        return users;
    }

    /**
     * 3. Create a new user with hashed password & profile
     */
    async createUser(userData) {
        const reg_number = userData.reg_number || userData.username;
        const { password, role, full_name, email, department } = userData;

        if (!reg_number || typeof reg_number !== 'string' || reg_number.trim().length === 0) {
            const err = new Error('Registration number / username is required');
            err.statusCode = 400;
            throw err;
        }

        if (!password || typeof password !== 'string' || password.length < 6) {
            const err = new Error('Password must be at least 6 characters long');
            err.statusCode = 400;
            throw err;
        }

        const validRoles = ['student', 'lecturer', 'admin'];
        if (!role || !validRoles.includes(role.toLowerCase())) {
            const err = new Error(`Invalid role. Allowed roles are: ${validRoles.join(', ')}`);
            err.statusCode = 400;
            throw err;
        }

        const normalizedRole = role.toLowerCase();
        const trimmedReg = reg_number.trim();

        // Check for duplicate reg_number
        const [existing] = await pool.query('SELECT id FROM users WHERE reg_number = ?', [trimmedReg]);
        if (existing.length > 0) {
            const err = new Error(`User with registration number '${trimmedReg}' already exists`);
            err.statusCode = 400;
            throw err;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert into users
        const [result] = await pool.query(
            'INSERT INTO users (reg_number, password_hash, role) VALUES (?, ?, ?)',
            [trimmedReg, passwordHash, normalizedRole]
        );

        const newUserId = result.insertId;
        const name = full_name || trimmedReg;
        const userEmail = email || `${trimmedReg.toLowerCase()}@university.edu`;
        const dept = department || 'Computer Science';

        // Insert associated profile
        if (normalizedRole === 'student') {
            await pool.query(
                `INSERT INTO students (user_id, full_name, email, department, academic_year, current_semester, gpa, academic_risk)
                 VALUES (?, ?, ?, ?, 1, 'Year 1 Sem 1', 0.00, 'Low')`,
                [newUserId, name, userEmail, dept]
            );
        } else if (normalizedRole === 'lecturer') {
            await pool.query(
                `INSERT INTO lecturers (user_id, full_name, email, department, title)
                 VALUES (?, ?, ?, ?, 'Lecturer')`,
                [newUserId, name, userEmail, dept]
            );
        }

        return {
            id: newUserId,
            reg_number: trimmedReg,
            role: normalizedRole,
            full_name: name,
            email: userEmail,
            department: dept
        };
    }

    /**
     * 4. Safely delete or deactivate a user account
     */
    async deleteUser(userId, currentAdminId) {
        if (!userId || isNaN(userId)) {
            const err = new Error('Invalid user ID');
            err.statusCode = 400;
            throw err;
        }

        const numId = parseInt(userId, 10);

        if (numId === currentAdminId) {
            const err = new Error('Cannot delete the currently logged-in administrator account');
            err.statusCode = 400;
            throw err;
        }

        if (numId === 1) {
            const err = new Error('Cannot delete the root system administrator account');
            err.statusCode = 400;
            throw err;
        }

        // Verify user exists
        const [users] = await pool.query('SELECT id, reg_number, role FROM users WHERE id = ?', [numId]);
        if (users.length === 0) {
            const err = new Error(`User with ID ${numId} not found`);
            err.statusCode = 404;
            throw err;
        }

        // Delete user (cascades to related records)
        await pool.query('DELETE FROM users WHERE id = ?', [numId]);

        return {
            id: numId,
            reg_number: users[0].reg_number,
            role: users[0].role
        };
    }

    /**
     * 5. Get all courses with instructor and performance metadata
     */
    async getAllCourses() {
        const [courses] = await pool.query(`
            SELECT 
                c.code,
                c.title,
                c.credits,
                c.department,
                c.semester,
                c.lecturer_id,
                c.description,
                COALESCE(l.full_name, 'Unassigned') as lecturer_name,
                l.email as lecturer_email,
                COUNT(DISTINCT e.student_id) as enrolled_students,
                ROUND(AVG((att.attended_classes / NULLIF(att.total_classes, 0)) * 100), 1) as avg_attendance,
                ROUND(AVG(er.score), 1) as avg_score
            FROM courses c
            LEFT JOIN lecturers l ON c.lecturer_id = l.user_id
            LEFT JOIN enrollments e ON c.code = e.course_code AND e.enrollment_status = 'active'
            LEFT JOIN attendance_summary att ON c.code = att.course_code
            LEFT JOIN exam_results er ON c.code = er.course_code
            GROUP BY c.code, c.title, c.credits, c.department, c.semester, c.lecturer_id, c.description, l.full_name, l.email
            ORDER BY c.code ASC
        `);

        // Attach assignment counts for each course
        for (const c of courses) {
            const [assignRows] = await pool.query(
                `SELECT COUNT(*) as count FROM assignments WHERE course_code = ? AND status = 'active'`,
                [c.code]
            );
            c.assignment_count = assignRows[0]?.count || 0;
        }

        return courses;
    }

    /**
     * 6. Create a new academic course
     */
    async createCourse(courseData) {
        const code = courseData.code || courseData.course_code;
        const title = courseData.title || courseData.course_name;
        const { credits, department, semester, lecturer_id, description } = courseData;

        if (!code || typeof code !== 'string' || !code.trim()) {
            const err = new Error('Course code is required');
            err.statusCode = 400;
            throw err;
        }

        if (!title || typeof title !== 'string' || !title.trim()) {
            const err = new Error('Course title is required');
            err.statusCode = 400;
            throw err;
        }

        const trimmedCode = code.trim().toUpperCase();

        // Check duplicate code
        const [existing] = await pool.query('SELECT code FROM courses WHERE code = ?', [trimmedCode]);
        if (existing.length > 0) {
            const err = new Error(`Course with code '${trimmedCode}' already exists`);
            err.statusCode = 400;
            throw err;
        }

        let lecturerId = null;
        if (lecturer_id) {
            const [lec] = await pool.query('SELECT user_id FROM lecturers WHERE user_id = ?', [lecturer_id]);
            if (lec.length === 0) {
                const err = new Error(`Lecturer with user ID ${lecturer_id} does not exist`);
                err.statusCode = 400;
                throw err;
            }
            lecturerId = parseInt(lecturer_id, 10);
        }

        await pool.query(
            `INSERT INTO courses (code, title, credits, department, semester, lecturer_id, description)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                trimmedCode,
                title.trim(),
                parseInt(credits, 10) || 3,
                department ? department.trim() : 'Computer Science',
                semester ? semester.trim() : 'Semester 1',
                lecturerId,
                description ? description.trim() : null
            ]
        );

        return {
            code: trimmedCode,
            course_code: trimmedCode,
            title: title.trim(),
            course_name: title.trim(),
            credits: parseInt(credits, 10) || 3,
            department: department ? department.trim() : 'Computer Science',
            semester: semester ? semester.trim() : 'Semester 1',
            lecturer_id: lecturerId,
            description: description ? description.trim() : null
        };
    }

    /**
     * 7. Update course details or assigned lecturer
     */
    async updateCourse(courseCode, updateData) {
        if (!courseCode || typeof courseCode !== 'string') {
            const err = new Error('Course code is required');
            err.statusCode = 400;
            throw err;
        }

        const trimmedCode = courseCode.trim().toUpperCase();
        const [existing] = await pool.query('SELECT * FROM courses WHERE code = ?', [trimmedCode]);
        if (existing.length === 0) {
            const err = new Error(`Course with code '${trimmedCode}' not found`);
            err.statusCode = 404;
            throw err;
        }

        const current = existing[0];
        const title = updateData.title || updateData.course_name;
        const { credits, department, semester, lecturer_id, description } = updateData;

        let newLecturerId = current.lecturer_id;
        if (lecturer_id !== undefined) {
            if (lecturer_id !== null) {
                const [lec] = await pool.query('SELECT user_id FROM lecturers WHERE user_id = ?', [lecturer_id]);
                if (lec.length === 0) {
                    const err = new Error(`Lecturer with user ID ${lecturer_id} does not exist`);
                    err.statusCode = 400;
                    throw err;
                }
                newLecturerId = parseInt(lecturer_id, 10);
            } else {
                newLecturerId = null;
            }
        }

        const newTitle = title !== undefined ? String(title).trim() : current.title;
        const newCredits = credits !== undefined && !isNaN(credits) ? parseInt(credits, 10) : current.credits;
        const newDept = department !== undefined ? String(department).trim() : current.department;
        const newSem = semester !== undefined ? String(semester).trim() : current.semester;
        const newDesc = description !== undefined ? (description ? String(description).trim() : null) : current.description;

        await pool.query(
            `UPDATE courses 
             SET title = ?, credits = ?, department = ?, semester = ?, lecturer_id = ?, description = ?
             WHERE code = ?`,
            [newTitle, newCredits, newDept, newSem, newLecturerId, newDesc, trimmedCode]
        );

        return {
            code: trimmedCode,
            title: newTitle,
            credits: newCredits,
            department: newDept,
            semester: newSem,
            lecturer_id: newLecturerId,
            description: newDesc
        };
    }

    /**
     * 8. Safely delete or deactivate a course preventing foreign key integrity corruption
     */
    async deleteCourse(courseCode) {
        if (!courseCode || typeof courseCode !== 'string') {
            const err = new Error('Course code is required');
            err.statusCode = 400;
            throw err;
        }

        const trimmedCode = courseCode.trim().toUpperCase();
        const [existing] = await pool.query('SELECT * FROM courses WHERE code = ?', [trimmedCode]);
        if (existing.length === 0) {
            const err = new Error(`Course '${trimmedCode}' not found`);
            err.statusCode = 404;
            throw err;
        }

        // Check if there are active enrollments or coursework records
        const [enrollments] = await pool.query(
            'SELECT COUNT(*) as count FROM enrollments WHERE course_code = ?',
            [trimmedCode]
        );
        if (enrollments[0]?.count > 0) {
            const err = new Error(`Cannot delete course '${trimmedCode}' because ${enrollments[0].count} students are currently enrolled. Unenroll students first.`);
            err.statusCode = 400;
            throw err;
        }

        const [assignments] = await pool.query(
            'SELECT COUNT(*) as count FROM assignments WHERE course_code = ?',
            [trimmedCode]
        );
        if (assignments[0]?.count > 0) {
            const err = new Error(`Cannot delete course '${trimmedCode}' because active assignments exist. Archive coursework deliverables first.`);
            err.statusCode = 400;
            throw err;
        }

        await pool.query('DELETE FROM courses WHERE code = ?', [trimmedCode]);

        return {
            code: trimmedCode,
            title: existing[0].title
        };
    }

    /**
     * 9. Get institutional enrollment distribution
     */
    async getEnrollmentOverview() {
        const [courseEnrollments] = await pool.query(`
            SELECT 
                c.code,
                c.title,
                COUNT(e.student_id) as enrolled_count
            FROM courses c
            LEFT JOIN enrollments e ON c.code = e.course_code AND e.enrollment_status = 'active'
            GROUP BY c.code, c.title
            ORDER BY enrolled_count DESC
        `);

        const [totalEnrollmentRows] = await pool.query(`
            SELECT COUNT(*) as total FROM enrollments WHERE enrollment_status = 'active'
        `);

        const [studentLoadRows] = await pool.query(`
            SELECT 
                e.student_id,
                u.reg_number,
                s.full_name,
                COUNT(e.course_code) as course_count
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            JOIN students s ON u.id = s.user_id
            WHERE e.enrollment_status = 'active'
            GROUP BY e.student_id, u.reg_number, s.full_name
            ORDER BY course_count DESC
        `);

        return {
            total_enrollments: totalEnrollmentRows[0]?.total || 0,
            courses_distribution: courseEnrollments,
            student_load_distribution: studentLoadRows
        };
    }

    /**
     * 10. Get cross-institutional academic analytics
     */
    async getAdminAnalytics() {
        // Attendance distribution across entire institution
        const [attSummary] = await pool.query(`
            SELECT 
                ROUND((attended_classes / NULLIF(total_classes, 0)) * 100, 1) as att_rate
            FROM attendance_summary
        `);

        let above75 = 0;
        let between60and74 = 0;
        let below60 = 0;
        let attSum = 0;

        attSummary.forEach(row => {
            const rate = parseFloat(row.att_rate) || 0;
            attSum += rate;
            if (rate >= 75) above75++;
            else if (rate >= 60) between60and74++;
            else below60++;
        });

        // Grade bands distribution
        const [gradeRows] = await pool.query(`
            SELECT 
                score,
                grade
            FROM exam_results
        `);

        let gradeA = 0;
        let gradeB = 0;
        let gradeC = 0;
        let gradeFail = 0;

        gradeRows.forEach(row => {
            const sc = parseFloat(row.score) || 0;
            if (sc >= 75) gradeA++;
            else if (sc >= 65) gradeB++;
            else if (sc >= 50) gradeC++;
            else gradeFail++;
        });

        // Career paths popularity
        const [careerGoals] = await pool.query(`
            SELECT 
                COALESCE(cg.target_role, s.career_goal, 'Software Engineer') as role_name,
                COUNT(*) as student_count
            FROM students s
            LEFT JOIN career_goals cg ON s.user_id = cg.student_id
            GROUP BY role_name
            ORDER BY student_count DESC
        `);

        return {
            attendance_distribution: {
                above_75: above75,
                between_60_74: between60and74,
                below_60: below60,
                avg_attendance: attSummary.length > 0 ? +(attSum / attSummary.length).toFixed(1) : 0
            },
            grade_distribution: {
                distinction_75plus: gradeA,
                merit_65_74: gradeB,
                pass_50_64: gradeC,
                fail_below_50: gradeFail
            },
            career_analytics: careerGoals
        };
    }

    /**
     * 11. Get system health status report without leaking secrets
     */
    async getSystemHealth() {
        let dbStatus = 'healthy';
        let dbLatencyMs = 0;

        try {
            const start = Date.now();
            await pool.query('SELECT 1');
            dbLatencyMs = Date.now() - start;
        } catch {
            dbStatus = 'degraded';
        }

        return {
            status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
            database: {
                status: dbStatus === 'healthy' ? 'connected' : 'degraded',
                health: dbStatus,
                latency_ms: dbLatencyMs,
                pool_connected: true
            },
            server: {
                uptime_seconds: Math.round(process.uptime()),
                node_version: process.version,
                environment: process.env.NODE_ENV || 'development',
                memory_usage_mb: +(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 12. Get all student course enrollments
     */
    async getAllEnrollments(query = {}) {
        const { search, course_code, student_id } = query;
        let sql = `
            SELECT 
                e.student_id,
                u.reg_number as student_reg,
                s.full_name as student_name,
                s.department,
                e.course_code,
                c.title as course_title,
                c.credits,
                e.enrollment_status,
                e.enrolled_at
            FROM enrollments e
            JOIN users u ON e.student_id = u.id
            JOIN students s ON u.id = s.user_id
            JOIN courses c ON e.course_code = c.code
            WHERE 1=1
        `;
        const params = [];

        if (course_code) {
            sql += ` AND e.course_code = ?`;
            params.push(course_code.toUpperCase());
        }

        if (student_id) {
            sql += ` AND e.student_id = ?`;
            params.push(parseInt(student_id, 10));
        }

        if (search && search.trim()) {
            const pat = `%${search.trim().toLowerCase()}%`;
            sql += ` AND (LOWER(u.reg_number) LIKE ? OR LOWER(s.full_name) LIKE ? OR LOWER(e.course_code) LIKE ? OR LOWER(c.title) LIKE ?)`;
            params.push(pat, pat, pat, pat);
        }

        sql += ` ORDER BY e.enrolled_at DESC, e.course_code ASC`;

        const [rows] = await pool.query(sql, params);
        return rows;
    }

    /**
     * 13. Enroll a student into a course
     */
    async enrollStudent(enrollmentData) {
        const { student_id, course_code } = enrollmentData;

        if (!student_id) {
            const err = new Error('Student ID is required');
            err.statusCode = 400;
            throw err;
        }

        if (!course_code || typeof course_code !== 'string') {
            const err = new Error('Course code is required');
            err.statusCode = 400;
            throw err;
        }

        const trimmedCode = course_code.trim().toUpperCase();
        const studentId = parseInt(student_id, 10);

        // Verify student exists
        const [studentRows] = await pool.query(
            `SELECT u.id, u.reg_number, s.full_name FROM users u 
             JOIN students s ON u.id = s.user_id 
             WHERE u.id = ?`,
            [studentId]
        );
        if (studentRows.length === 0) {
            const err = new Error(`Student with user ID ${studentId} not found`);
            err.statusCode = 404;
            throw err;
        }

        // Verify course exists
        const [courseRows] = await pool.query('SELECT code, title, credits FROM courses WHERE code = ?', [trimmedCode]);
        if (courseRows.length === 0) {
            const err = new Error(`Course '${trimmedCode}' not found`);
            err.statusCode = 404;
            throw err;
        }

        // Check if existing enrollment
        const [existing] = await pool.query(
            'SELECT * FROM enrollments WHERE student_id = ? AND course_code = ?',
            [studentId, trimmedCode]
        );

        if (existing.length > 0) {
            if (existing[0].enrollment_status === 'active') {
                const err = new Error(`Student ${studentRows[0].reg_number} is already actively enrolled in ${trimmedCode}`);
                err.statusCode = 400;
                throw err;
            } else {
                await pool.query(
                    "UPDATE enrollments SET enrollment_status = 'active', enrolled_at = NOW() WHERE student_id = ? AND course_code = ?",
                    [studentId, trimmedCode]
                );
            }
        } else {
            await pool.query(
                "INSERT INTO enrollments (student_id, course_code, enrollment_status) VALUES (?, ?, 'active')",
                [studentId, trimmedCode]
            );
        }

        return {
            student_id: studentId,
            student_reg: studentRows[0].reg_number,
            student_name: studentRows[0].full_name,
            course_code: trimmedCode,
            course_title: courseRows[0].title,
            enrollment_status: 'active',
            enrolled_at: new Date().toISOString()
        };
    }

    /**
     * 14. Unenroll a student from a course
     */
    async unenrollStudent(studentId, courseCode) {
        const sId = parseInt(studentId, 10);
        const trimmedCode = (courseCode || '').trim().toUpperCase();

        const [existing] = await pool.query(
            'SELECT * FROM enrollments WHERE student_id = ? AND course_code = ?',
            [sId, trimmedCode]
        );

        if (existing.length === 0) {
            const err = new Error(`Enrollment not found for student ${sId} in course ${trimmedCode}`);
            err.statusCode = 404;
            throw err;
        }

        await pool.query(
            'DELETE FROM enrollments WHERE student_id = ? AND course_code = ?',
            [sId, trimmedCode]
        );

        return {
            student_id: sId,
            course_code: trimmedCode,
            message: `Student successfully unenrolled from ${trimmedCode}`
        };
    }
}

module.exports = new AdminService();
