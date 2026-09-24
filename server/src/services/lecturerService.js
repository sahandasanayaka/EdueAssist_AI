const pool = require('../db/connection');

class LecturerService {
    /**
     * 1. Get lecturer dashboard metrics, course summaries, and at-risk triage
     */
    async getDashboard(lecturerId) {
        // Lecturer profile
        const [lecturers] = await pool.query(
            `SELECT l.user_id, l.full_name, l.email, l.department, l.title, l.office_location, u.reg_number 
             FROM lecturers l 
             JOIN users u ON l.user_id = u.id 
             WHERE l.user_id = ?`,
            [lecturerId]
        );

        const profile = lecturers[0] || {
            user_id: lecturerId,
            full_name: 'Lecturer',
            department: 'Computer Science',
            title: 'Senior Lecturer',
            office_location: 'Block B, Room 304'
        };

        // Assigned courses
        const [coursesRows] = await pool.query(
            `SELECT c.code, c.title, c.credits, c.semester, c.department, c.description
             FROM courses c
             WHERE c.lecturer_id = ?
             ORDER BY c.code ASC`,
            [lecturerId]
        );

        const courseCodes = coursesRows.map(c => c.code);

        let totalStudents = 0;
        let avgPerformance = 0;
        let avgAttendance = 0;
        let pendingSubmissionsTotal = 0;
        const courses = [];
        const atRiskStudents = [];
        const atRiskStudentIds = new Set();

        if (courseCodes.length > 0) {
            // 1. Total distinct enrolled students (avoiding double-counting)
            const [distinctStudentRows] = await pool.query(
                `SELECT COUNT(DISTINCT student_id) as total_students
                 FROM enrollments
                 WHERE course_code IN (?) AND enrollment_status = 'active'`,
                [courseCodes]
            );
            totalStudents = distinctStudentRows[0]?.total_students || 0;

            // 2. Average performance across lecturer's courses
            const [overallScoreRows] = await pool.query(
                `SELECT ROUND(AVG(score), 1) as avg_score
                 FROM exam_results
                 WHERE course_code IN (?)`,
                [courseCodes]
            );
            avgPerformance = overallScoreRows[0]?.avg_score ? parseFloat(overallScoreRows[0].avg_score) : 0;

            // 3. Average attendance across lecturer's courses
            const [attendanceRows] = await pool.query(
                `SELECT ROUND(AVG((attended_classes / NULLIF(total_classes, 0)) * 100), 1) as avg_attendance
                 FROM attendance_summary
                 WHERE course_code IN (?)`,
                [courseCodes]
            );
            avgAttendance = attendanceRows[0]?.avg_attendance ? parseFloat(attendanceRows[0].avg_attendance) : 0;

            // 4. Per-course metrics
            for (const course of coursesRows) {
                // Enrollment count for this course
                const [enrolledRows] = await pool.query(
                    `SELECT COUNT(DISTINCT student_id) as count
                     FROM enrollments
                     WHERE course_code = ? AND enrollment_status = 'active'`,
                    [course.code]
                );
                const enrolledCount = enrolledRows[0]?.count || 0;

                // Avg score for this course
                const [courseScoreRows] = await pool.query(
                    `SELECT ROUND(AVG(score), 1) as avg_score
                     FROM exam_results
                     WHERE course_code = ?`,
                    [course.code]
                );
                const courseAvgScore = courseScoreRows[0]?.avg_score ? parseFloat(courseScoreRows[0].avg_score) : null;

                // Avg attendance for this course
                const [courseAttRows] = await pool.query(
                    `SELECT ROUND(AVG((attended_classes / NULLIF(total_classes, 0)) * 100), 1) as avg_attendance
                     FROM attendance_summary
                     WHERE course_code = ?`,
                    [course.code]
                );
                const courseAvgAtt = courseAttRows[0]?.avg_attendance ? parseFloat(courseAttRows[0].avg_attendance) : null;

                // Assignments count for this course
                const [assignRows] = await pool.query(
                    `SELECT id, total_marks, due_date FROM assignments WHERE course_code = ? AND status = 'active'`,
                    [course.code]
                );
                const assignmentCount = assignRows.length;

                // Expected submissions = enrolledCount * assignmentCount
                // Submitted = count of assignment_submissions for assignments in this course
                let submittedCount = 0;
                if (assignmentCount > 0) {
                    const assignIds = assignRows.map(a => a.id);
                    const [subRows] = await pool.query(
                        `SELECT COUNT(*) as count FROM assignment_submissions WHERE assignment_id IN (?)`,
                        [assignIds]
                    );
                    submittedCount = subRows[0]?.count || 0;
                }
                const totalExpected = enrolledCount * assignmentCount;
                const coursePendingSubmissions = Math.max(0, totalExpected - submittedCount);
                pendingSubmissionsTotal += coursePendingSubmissions;

                // At-risk students in this course
                const [atRiskCourseRows] = await pool.query(
                    `SELECT DISTINCT 
                        s.user_id,
                        u.reg_number,
                        s.full_name,
                        s.email,
                        s.academic_risk,
                        s.gpa,
                        ROUND((att.attended_classes / NULLIF(att.total_classes, 0)) * 100, 1) as attendance_percentage,
                        er.score as course_score
                     FROM enrollments e
                     JOIN users u ON e.student_id = u.id
                     JOIN students s ON u.id = s.user_id
                     LEFT JOIN attendance_summary att ON att.student_id = s.user_id AND att.course_code = ?
                     LEFT JOIN exam_results er ON er.student_id = s.user_id AND er.course_code = ? AND er.exam_type = 'overall'
                     WHERE e.course_code = ? AND e.enrollment_status = 'active'
                       AND (s.academic_risk = 'High' OR s.gpa < 2.5 OR (att.attended_classes / NULLIF(att.total_classes, 0)) * 100 < 75 OR er.score < 50)
                     ORDER BY s.academic_risk = 'High' DESC, s.full_name ASC`,
                    [course.code, course.code, course.code]
                );

                courses.push({
                    code: course.code,
                    title: course.title,
                    credits: course.credits,
                    semester: course.semester,
                    department: course.department,
                    description: course.description,
                    enrolled_students: enrolledCount,
                    avg_score: courseAvgScore,
                    avg_attendance: courseAvgAtt,
                    assignment_count: assignmentCount,
                    pending_submissions: coursePendingSubmissions,
                    at_risk_count: atRiskCourseRows.length
                });

                // Populate at-risk students with concrete evidence reasons
                for (const student of atRiskCourseRows) {
                    const reasons = [];
                    const att = student.attendance_percentage !== null ? parseFloat(student.attendance_percentage) : null;
                    const score = student.course_score !== null ? parseFloat(student.course_score) : null;
                    const gpa = parseFloat(student.gpa) || 0;

                    if (att !== null && att < 75) {
                        reasons.push(`Attendance is ${att}%, below mandatory 75% threshold`);
                    }
                    if (score !== null && score < 50) {
                        reasons.push(`Current module mark is ${score}%, below 50% passing threshold`);
                    }
                    if (gpa < 2.5) {
                        reasons.push(`Cumulative GPA is ${gpa.toFixed(2)}, indicating academic probation risk`);
                    }
                    if (student.academic_risk === 'High' && reasons.length === 0) {
                        reasons.push('Designated High Risk in departmental academic assessment');
                    }

                    const rLevel = student.academic_risk || (gpa < 2.5 || (att && att < 75) ? 'High' : 'Medium');
                    atRiskStudents.push({
                        user_id: student.user_id,
                        reg_number: student.reg_number,
                        full_name: student.full_name,
                        email: student.email,
                        gpa: gpa,
                        academic_risk: rLevel,
                        risk_level: rLevel.toUpperCase(),
                        course_code: course.code,
                        course_title: course.title,
                        attendance_percentage: att,
                        course_score: score,
                        reasons
                    });
                    atRiskStudentIds.add(student.user_id);
                }
            }
        }

        const summaryMetrics = {
            total_students: totalStudents,
            total_courses: courses.length,
            avg_class_performance: avgPerformance,
            avg_class_attendance: avgAttendance,
            pending_submissions: pendingSubmissionsTotal,
            at_risk_students_count: atRiskStudentIds.size
        };

        return {
            profile,
            lecturer: {
                name: profile.full_name,
                full_name: profile.full_name,
                email: profile.email,
                department: profile.department,
                title: profile.title,
                office_location: profile.office_location
            },
            total_students: totalStudents,
            total_courses: courses.length,
            average_performance: avgPerformance,
            average_attendance: avgAttendance,
            pending_submissions: pendingSubmissionsTotal,
            at_risk_count: atRiskStudentIds.size,
            summary_metrics: summaryMetrics,
            courses,
            at_risk_students: atRiskStudents,
            // Backward compatibility root alias
            students: atRiskStudents
        };
    }

    /**
     * 2. Get courses assigned to the lecturer
     */
    async getCourses(lecturerId) {
        const [courses] = await pool.query(
            `SELECT 
                c.code, 
                c.title, 
                c.credits, 
                c.department, 
                c.semester, 
                c.description,
                COUNT(DISTINCT e.student_id) as enrolled_students,
                ROUND(AVG((att.attended_classes / NULLIF(att.total_classes, 0)) * 100), 1) as avg_attendance,
                ROUND(AVG(er.score), 1) as avg_score
             FROM courses c
             LEFT JOIN enrollments e ON c.code = e.course_code AND e.enrollment_status = 'active'
             LEFT JOIN attendance_summary att ON c.code = att.course_code
             LEFT JOIN exam_results er ON c.code = er.course_code
             WHERE c.lecturer_id = ?
             GROUP BY c.code, c.title, c.credits, c.department, c.semester, c.description
             ORDER BY c.code ASC`,
            [lecturerId]
        );

        // Augment with assignment count & pending submissions
        for (const course of courses) {
            course.course_code = course.code;
            const [assignRows] = await pool.query(
                `SELECT id FROM assignments WHERE course_code = ? AND status = 'active'`,
                [course.code]
            );
            course.assignment_count = assignRows.length;
            
            let submittedCount = 0;
            if (assignRows.length > 0) {
                const assignIds = assignRows.map(a => a.id);
                const [subRows] = await pool.query(
                    `SELECT COUNT(*) as count FROM assignment_submissions WHERE assignment_id IN (?)`,
                    [assignIds]
                );
                submittedCount = subRows[0]?.count || 0;
            }
            const totalExpected = (course.enrolled_students || 0) * assignRows.length;
            course.pending_submissions = Math.max(0, totalExpected - submittedCount);
        }

        return courses;
    }

    /**
     * 3. Get detailed course information with student roster and performance breakdown (with IDOR check)
     */
    async getCourseDetail(lecturerId, courseCode) {
        if (!courseCode || typeof courseCode !== 'string') {
            const err = new Error('Course code is required');
            err.statusCode = 400;
            throw err;
        }

        const [courseRows] = await pool.query(
            `SELECT c.code, c.title, c.credits, c.department, c.semester, c.description, c.lecturer_id, l.full_name as lecturer_name
             FROM courses c
             LEFT JOIN lecturers l ON c.lecturer_id = l.user_id
             WHERE c.code = ?`,
            [courseCode]
        );

        if (courseRows.length === 0) {
            const err = new Error(`Course '${courseCode}' not found`);
            err.statusCode = 404;
            throw err;
        }

        const course = courseRows[0];
        if (course.lecturer_id !== lecturerId) {
            const err = new Error('Forbidden. You are not the assigned lecturer for this course.');
            err.statusCode = 403;
            throw err;
        }

        // Performance aggregates
        const [perfRows] = await pool.query(
            `SELECT 
                ROUND(AVG(score), 1) as avg_score,
                MAX(score) as highest_score,
                MIN(score) as lowest_score
             FROM exam_results
             WHERE course_code = ?`,
            [courseCode]
        );

        // Attendance aggregate
        const [attRows] = await pool.query(
            `SELECT ROUND(AVG((attended_classes / NULLIF(total_classes, 0)) * 100), 1) as avg_attendance
             FROM attendance_summary
             WHERE course_code = ?`,
            [courseCode]
        );

        // Course assignments
        const [assignments] = await pool.query(
            `SELECT id, title, description, due_date, total_marks, weight, difficulty, status
             FROM assignments
             WHERE course_code = ?
             ORDER BY due_date ASC`,
            [courseCode]
        );

        // Compute completion stats for each assignment
        const [enrolledCountRows] = await pool.query(
            `SELECT COUNT(DISTINCT student_id) as count FROM enrollments WHERE course_code = ? AND enrollment_status = 'active'`,
            [courseCode]
        );
        const totalEnrolled = enrolledCountRows[0]?.count || 0;

        for (const a of assignments) {
            const [subStats] = await pool.query(
                `SELECT 
                    COUNT(*) as submitted,
                    SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded,
                    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
                 FROM assignment_submissions
                 WHERE assignment_id = ?`,
                [a.id]
            );
            a.total_expected = totalEnrolled;
            a.submitted = subStats[0]?.submitted || 0;
            a.graded = subStats[0]?.graded || 0;
            a.late = subStats[0]?.late || 0;
            a.pending = Math.max(0, totalEnrolled - a.submitted);
            a.completion_rate = totalEnrolled > 0 ? Math.round((a.submitted / totalEnrolled) * 100) : 0;
        }

        // Student roster
        const [students] = await pool.query(
            `SELECT 
                s.user_id,
                u.reg_number,
                s.full_name,
                s.email,
                s.academic_year,
                s.current_semester,
                s.gpa,
                s.academic_risk,
                er.score as overall_score,
                er.grade,
                att.total_classes,
                att.attended_classes,
                ROUND((att.attended_classes / NULLIF(att.total_classes, 0)) * 100, 1) as attendance_percentage
             FROM enrollments e
             JOIN users u ON e.student_id = u.id
             JOIN students s ON u.id = s.user_id
             LEFT JOIN exam_results er ON er.student_id = s.user_id AND er.course_code = ? AND er.exam_type = 'overall'
             LEFT JOIN attendance_summary att ON att.student_id = s.user_id AND att.course_code = ?
             WHERE e.course_code = ? AND e.enrollment_status = 'active'
             ORDER BY s.full_name ASC`,
            [courseCode, courseCode, courseCode]
        );

        // Add risk badge & completed assignments count for each student
        for (const student of students) {
            const att = student.attendance_percentage !== null ? parseFloat(student.attendance_percentage) : null;
            const score = student.overall_score !== null ? parseFloat(student.overall_score) : null;
            const gpa = parseFloat(student.gpa) || 0;

            let riskLevel = 'LOW';
            if (student.academic_risk === 'High' || gpa < 2.5 || (att !== null && att < 75) || (score !== null && score < 50)) {
                riskLevel = 'HIGH';
            } else if (gpa < 3.0 || (att !== null && att < 80) || (score !== null && score < 60)) {
                riskLevel = 'MEDIUM';
            }
            student.risk_level = riskLevel;

            // Check how many assignments student submitted for this course
            if (assignments.length > 0) {
                const aIds = assignments.map(a => a.id);
                const [sSubs] = await pool.query(
                    `SELECT COUNT(*) as count FROM assignment_submissions WHERE student_id = ? AND assignment_id IN (?)`,
                    [student.user_id, aIds]
                );
                student.completed_assignments = sSubs[0]?.count || 0;
            } else {
                student.completed_assignments = 0;
            }
            student.total_assignments = assignments.length;
        }

        const overallCompletionRate = assignments.length > 0 && totalEnrolled > 0
            ? Math.round((assignments.reduce((acc, a) => acc + a.submitted, 0) / (assignments.length * totalEnrolled)) * 100)
            : 100;

        const perfObj = {
            total_enrolled: totalEnrolled,
            avg_score: perfRows[0]?.avg_score ? parseFloat(perfRows[0].avg_score) : null,
            highest_score: perfRows[0]?.highest_score ? parseFloat(perfRows[0].highest_score) : null,
            lowest_score: perfRows[0]?.lowest_score ? parseFloat(perfRows[0].lowest_score) : null,
            avg_attendance: attRows[0]?.avg_attendance ? parseFloat(attRows[0].avg_attendance) : null,
            assignment_completion_rate: overallCompletionRate
        };

        return {
            course: {
                code: course.code,
                course_code: course.code,
                title: course.title,
                credits: course.credits,
                department: course.department,
                semester: course.semester,
                description: course.description,
                lecturer_name: course.lecturer_name
            },
            performance: perfObj,
            score_stats: {
                avg_score: perfObj.avg_score,
                highest_score: perfObj.highest_score,
                lowest_score: perfObj.lowest_score
            },
            attendance: {
                avg_attendance: perfObj.avg_attendance
            },
            assignments,
            students,
            roster: students
        };
    }

    /**
     * 4. Get students enrolled in a lecturer's specific course (with IDOR check)
     */
    async getCourseStudents(lecturerId, courseCode) {
        if (!courseCode || typeof courseCode !== 'string') {
            const err = new Error('Course code is required');
            err.statusCode = 400;
            throw err;
        }

        // Verify course belongs to this lecturer (IDOR protection)
        const [courseRows] = await pool.query(
            'SELECT code, title, lecturer_id FROM courses WHERE code = ?',
            [courseCode]
        );

        if (courseRows.length === 0) {
            const err = new Error(`Course '${courseCode}' not found`);
            err.statusCode = 404;
            throw err;
        }

        const course = courseRows[0];
        if (course.lecturer_id !== lecturerId) {
            const err = new Error('Forbidden. You are not the assigned lecturer for this course.');
            err.statusCode = 403;
            throw err;
        }

        // Fetch enrolled students with academic standing and attendance
        const [students] = await pool.query(
            `SELECT 
                s.user_id,
                u.reg_number,
                s.full_name,
                s.email,
                s.department,
                s.academic_year,
                s.current_semester,
                s.gpa,
                s.academic_risk,
                er.score as overall_score,
                er.grade,
                att.total_classes,
                att.attended_classes,
                ROUND((att.attended_classes / NULLIF(att.total_classes, 0)) * 100, 1) as attendance_percentage
             FROM enrollments e
             JOIN users u ON e.student_id = u.id
             JOIN students s ON u.id = s.user_id
             LEFT JOIN exam_results er ON er.student_id = s.user_id AND er.course_code = ? AND er.exam_type = 'overall'
             LEFT JOIN attendance_summary att ON att.student_id = s.user_id AND att.course_code = ?
             WHERE e.course_code = ? AND e.enrollment_status = 'active'
             ORDER BY s.academic_risk = 'High' DESC, s.full_name ASC`,
            [courseCode, courseCode, courseCode]
        );

        for (const s of students) {
            const gpa = parseFloat(s.gpa) || 0;
            const att = s.attendance_percentage !== null ? parseFloat(s.attendance_percentage) : null;
            const score = s.overall_score !== null ? parseFloat(s.overall_score) : null;
            s.risk_level = (s.academic_risk === 'High' || gpa < 2.5 || (att !== null && att < 75) || (score !== null && score < 50))
                ? 'HIGH'
                : (gpa < 3.0 || (att !== null && att < 80)) ? 'MEDIUM' : 'LOW';
        }

        return {
            course: {
                code: course.code,
                title: course.title
            },
            students
        };
    }

    /**
     * 5. Get comprehensive cohort analytics across lecturer's courses
     */
    async getAnalytics(lecturerId) {
        const [courses] = await pool.query(
            `SELECT code, title FROM courses WHERE lecturer_id = ? ORDER BY code ASC`,
            [lecturerId]
        );

        if (courses.length === 0) {
            return {
                course_performance: [],
                attendance_distribution: { above_75: 0, between_60_74: 0, below_60: 0, avg_attendance: 0 },
                assignment_analytics: { total_assignments: 0, expected_submissions: 0, submitted: 0, pending: 0, late: 0, graded: 0, completion_rate: 0, average_assignment_mark: 0 },
                risk_distribution: { high: 0, medium: 0, low: 0 },
                student_performance: { excellent: 0, good: 0, satisfactory: 0, needs_attention: 0 }
            };
        }

        const courseCodes = courses.map(c => c.code);

        // 1. Course performance breakdown
        const [coursePerfRows] = await pool.query(
            `SELECT 
                c.code, 
                c.title,
                ROUND(AVG(er.score), 1) as avg_score,
                MAX(er.score) as highest_score,
                MIN(er.score) as lowest_score,
                COUNT(DISTINCT e.student_id) as enrolled_count
             FROM courses c
             LEFT JOIN enrollments e ON c.code = e.course_code AND e.enrollment_status = 'active'
             LEFT JOIN exam_results er ON c.code = er.course_code
             WHERE c.lecturer_id = ?
             GROUP BY c.code, c.title
             ORDER BY c.code ASC`,
            [lecturerId]
        );

        // 2. Attendance distribution bands
        const [attSummaryRows] = await pool.query(
            `SELECT 
                student_id,
                course_code,
                ROUND((attended_classes / NULLIF(total_classes, 0)) * 100, 1) as att_rate
             FROM attendance_summary
             WHERE course_code IN (?)`,
            [courseCodes]
        );

        let attAbove75 = 0;
        let att60to74 = 0;
        let attBelow60 = 0;
        let attSum = 0;

        attSummaryRows.forEach(row => {
            const rate = parseFloat(row.att_rate) || 0;
            attSum += rate;
            if (rate >= 75) attAbove75++;
            else if (rate >= 60) att60to74++;
            else attBelow60++;
        });

        const avgAttendance = attSummaryRows.length > 0 ? +(attSum / attSummaryRows.length).toFixed(1) : 0;

        // 3. Assignment analytics
        const [assignRows] = await pool.query(
            `SELECT id, course_code FROM assignments WHERE course_code IN (?) AND status = 'active'`,
            [courseCodes]
        );

        let expectedSubmissions = 0;
        let submittedSubmissions = 0;
        let pendingSubmissions = 0;
        let lateSubmissions = 0;
        let gradedSubmissions = 0;
        let marksSum = 0;
        let marksCount = 0;

        for (const c of coursePerfRows) {
            const cAssigns = assignRows.filter(a => a.course_code === c.code);
            expectedSubmissions += (c.enrolled_count || 0) * cAssigns.length;
        }

        if (assignRows.length > 0) {
            const aIds = assignRows.map(a => a.id);
            const [subRows] = await pool.query(
                `SELECT status, marks FROM assignment_submissions WHERE assignment_id IN (?)`,
                [aIds]
            );

            submittedSubmissions = subRows.length;
            subRows.forEach(s => {
                if (s.status === 'graded') gradedSubmissions++;
                if (s.status === 'late') lateSubmissions++;
                if (s.marks !== null && !isNaN(s.marks)) {
                    marksSum += parseFloat(s.marks);
                    marksCount++;
                }
            });
        }

        pendingSubmissions = Math.max(0, expectedSubmissions - submittedSubmissions);
        const completionRate = expectedSubmissions > 0 ? Math.round((submittedSubmissions / expectedSubmissions) * 100) : 100;
        const avgAssignMark = marksCount > 0 ? +(marksSum / marksCount).toFixed(1) : 0;

        // 4. Risk distribution & Performance tiers across enrolled students
        const [enrolledStudents] = await pool.query(
            `SELECT DISTINCT 
                s.user_id,
                s.gpa,
                s.academic_risk,
                ROUND(AVG(er.score), 1) as avg_score,
                ROUND(AVG((att.attended_classes / NULLIF(att.total_classes, 0)) * 100), 1) as avg_att
             FROM enrollments e
             JOIN students s ON e.student_id = s.user_id
             LEFT JOIN exam_results er ON er.student_id = s.user_id AND er.course_code IN (?)
             LEFT JOIN attendance_summary att ON att.student_id = s.user_id AND att.course_code IN (?)
             WHERE e.course_code IN (?) AND e.enrollment_status = 'active'
             GROUP BY s.user_id, s.gpa, s.academic_risk`,
            [courseCodes, courseCodes, courseCodes]
        );

        let riskHigh = 0;
        let riskMedium = 0;
        let riskLow = 0;

        let perfExcellent = 0;
        let perfGood = 0;
        let perfSatisfactory = 0;
        let perfNeedsAttention = 0;

        enrolledStudents.forEach(st => {
            const gpa = parseFloat(st.gpa) || 0;
            const att = st.avg_att !== null ? parseFloat(st.avg_att) : null;
            const score = st.avg_score !== null ? parseFloat(st.avg_score) : null;

            if (st.academic_risk === 'High' || gpa < 2.5 || (att !== null && att < 75) || (score !== null && score < 50)) {
                riskHigh++;
            } else if (gpa < 3.0 || (att !== null && att < 80) || (score !== null && score < 60)) {
                riskMedium++;
            } else {
                riskLow++;
            }

            if (score !== null) {
                if (score >= 80) perfExcellent++;
                else if (score >= 65) perfGood++;
                else if (score >= 50) perfSatisfactory++;
                else perfNeedsAttention++;
            } else {
                if (gpa >= 3.5) perfExcellent++;
                else if (gpa >= 3.0) perfGood++;
                else if (gpa >= 2.5) perfSatisfactory++;
                else perfNeedsAttention++;
            }
        });

        const attDist = {
            above_75: attAbove75,
            between_60_74: att60to74,
            below_60: attBelow60,
            healthy_gte_75: attAbove75,
            warning_60_to_74: att60to74,
            critical_lt_60: attBelow60,
            avg_attendance: avgAttendance
        };

        const assignAnalytics = {
            total_assignments: assignRows.length,
            expected_submissions: expectedSubmissions,
            submitted: submittedSubmissions,
            submitted_submissions: submittedSubmissions,
            pending: pendingSubmissions,
            pending_submissions: pendingSubmissions,
            late: lateSubmissions,
            late_submissions: lateSubmissions,
            graded: gradedSubmissions,
            graded_submissions: gradedSubmissions,
            completion_rate: completionRate,
            average_assignment_mark: avgAssignMark
        };

        const perfBrackets = {
            excellent: perfExcellent,
            good: perfGood,
            satisfactory: perfSatisfactory,
            needs_attention: perfNeedsAttention,
            distinction_gte_75: perfExcellent,
            credit_60_to_74: perfGood,
            pass_50_to_59: perfSatisfactory,
            fail_lt_50: perfNeedsAttention
        };

        const riskDist = {
            high: riskHigh,
            medium: riskMedium,
            low: riskLow
        };

        return {
            course_performance: coursePerfRows,
            course_performance_comparison: coursePerfRows,
            attendance_distribution: attDist,
            attendance_compliance_distribution: attDist,
            assignment_analytics: assignAnalytics,
            assignment_completion_metrics: assignAnalytics,
            risk_distribution: riskDist,
            student_performance: perfBrackets,
            performance_brackets: perfBrackets
        };
    }

    /**
     * 6. Get assignment submissions with IDOR protection (assignment must belong to lecturer's course)
     */
    async getAssignmentSubmissions(lecturerId, assignmentId) {
        if (!assignmentId || isNaN(assignmentId)) {
            const err = new Error('Invalid assignment ID');
            err.statusCode = 400;
            throw err;
        }

        const numId = parseInt(assignmentId, 10);

        // Fetch assignment & check course ownership
        const [assignRows] = await pool.query(
            `SELECT a.id, a.course_code, a.title, a.description, a.due_date, a.total_marks, a.weight, a.difficulty,
                    c.title as course_title, c.lecturer_id
             FROM assignments a
             JOIN courses c ON a.course_code = c.code
             WHERE a.id = ?`,
            [numId]
        );

        if (assignRows.length === 0) {
            const err = new Error(`Assignment with ID ${numId} not found`);
            err.statusCode = 404;
            throw err;
        }

        const assignment = assignRows[0];
        if (assignment.lecturer_id !== lecturerId) {
            const err = new Error('Forbidden. You do not have permission to access submissions for this course.');
            err.statusCode = 403;
            throw err;
        }

        // Fetch enrolled students and their submission status
        const [submissions] = await pool.query(
            `SELECT 
                sub.id as submission_id,
                e.student_id,
                u.reg_number,
                s.full_name as student_name,
                s.email,
                sub.submitted_at,
                COALESCE(sub.status, 'pending') as status,
                sub.marks,
                sub.feedback,
                sub.submission_file,
                sub.submission_text
             FROM enrollments e
             JOIN users u ON e.student_id = u.id
             JOIN students s ON u.id = s.user_id
             LEFT JOIN assignment_submissions sub ON sub.assignment_id = ? AND sub.student_id = e.student_id
             WHERE e.course_code = ? AND e.enrollment_status = 'active'
             ORDER BY sub.submitted_at DESC, s.full_name ASC`,
            [numId, assignment.course_code]
        );

        return {
            assignment: {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                course_code: assignment.course_code,
                due_date: assignment.due_date,
                total_marks: parseFloat(assignment.total_marks || 100),
                weight: parseFloat(assignment.weight || 10),
                difficulty: assignment.difficulty
            },
            course: {
                code: assignment.course_code,
                title: assignment.course_title
            },
            submissions
        };
    }

    /**
     * 7. Grade submission with defensive validation and course ownership IDOR protection
     */
    async gradeSubmission(lecturerId, submissionId, data = {}) {
        if (!submissionId || isNaN(submissionId)) {
            const err = new Error('Invalid submission ID');
            err.statusCode = 400;
            throw err;
        }

        const numId = parseInt(submissionId, 10);
        const { marks, feedback } = data;

        if (marks === undefined || marks === null || isNaN(marks)) {
            const err = new Error('Valid marks score is required for grading');
            err.statusCode = 400;
            throw err;
        }

        const parsedMarks = parseFloat(marks);
        if (parsedMarks < 0) {
            const err = new Error('Marks cannot be negative');
            err.statusCode = 400;
            throw err;
        }

        // Fetch submission, assignment, and course ownership
        const [subRows] = await pool.query(
            `SELECT sub.id, sub.assignment_id, sub.student_id, a.course_code, a.total_marks, c.lecturer_id, a.title as assignment_title
             FROM assignment_submissions sub
             JOIN assignments a ON sub.assignment_id = a.id
             JOIN courses c ON a.course_code = c.code
             WHERE sub.id = ?`,
            [numId]
        );

        if (subRows.length === 0) {
            const err = new Error(`Submission with ID ${numId} not found`);
            err.statusCode = 404;
            throw err;
        }

        const sub = subRows[0];
        if (sub.lecturer_id !== lecturerId) {
            const err = new Error('Forbidden. You are not authorized to grade assignments for this course.');
            err.statusCode = 403;
            throw err;
        }

        const maxMarks = parseFloat(sub.total_marks || 100);
        if (parsedMarks > maxMarks) {
            const err = new Error(`Marks cannot exceed the maximum assignment marks (${maxMarks})`);
            err.statusCode = 400;
            throw err;
        }

        const trimmedFeedback = feedback !== undefined && feedback !== null ? String(feedback).trim() : null;

        // Update submission in MySQL
        await pool.query(
            `UPDATE assignment_submissions 
             SET marks = ?, feedback = ?, status = 'graded', updated_at = NOW()
             WHERE id = ?`,
            [parsedMarks, trimmedFeedback, numId]
        );

        return {
            id: numId,
            assignment_id: sub.assignment_id,
            student_id: sub.student_id,
            marks: parsedMarks,
            max_marks: maxMarks,
            feedback: trimmedFeedback,
            status: 'graded'
        };
    }
}

module.exports = new LecturerService();
