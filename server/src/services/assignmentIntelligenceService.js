const pool = require('../db/connection');
const geminiService = require('./geminiService');

class AssignmentIntelligenceService {
    /**
     * Helper to format human-readable countdowns
     */
    getTimeRemainingLabel(hoursRemaining, isOverdue, isSubmitted, marks, maxMarks) {
        if (isSubmitted) {
            if (marks !== null && marks !== undefined) {
                return `Graded: ${marks}/${maxMarks}`;
            }
            return 'Submitted';
        }

        if (isOverdue) {
            const hoursOverdue = Math.abs(hoursRemaining);
            const daysOverdue = Math.max(1, Math.floor(hoursOverdue / 24));
            return daysOverdue === 1 ? 'Overdue by 1 day' : `Overdue by ${daysOverdue} days`;
        }

        if (hoursRemaining <= 1) {
            return 'Due within 1 hour';
        }
        if (hoursRemaining <= 12) {
            return `Due in ${Math.round(hoursRemaining)} hours`;
        }
        if (hoursRemaining <= 24) {
            return 'Due today';
        }
        if (hoursRemaining <= 48) {
            return 'Due tomorrow';
        }

        const daysLeft = Math.ceil(hoursRemaining / 24);
        return `${daysLeft} days left`;
    }

    /**
     * Compute deterministic assignment priority and explainable rationale
     */
    computePriority(params = {}) {
        let { 
            isSubmitted, isGraded, isOverdue, hoursRemaining, isWeakCourse, 
            courseMark, attendance, submission_status, due_date, weight, 
            current_course_mark, course_attendance 
        } = params;

        if (isSubmitted === undefined && submission_status) {
            const s = (submission_status || '').toLowerCase();
            isSubmitted = s === 'submitted' || s === 'graded';
            isGraded = s === 'graded';
            isOverdue = s === 'overdue';
        }

        if (hoursRemaining === undefined && due_date) {
            hoursRemaining = (new Date(due_date).getTime() - Date.now()) / (1000 * 60 * 60);
            if (hoursRemaining <= 0) isOverdue = true;
        }

        if (courseMark === undefined && current_course_mark !== undefined) {
            courseMark = current_course_mark;
        }

        if (attendance === undefined && course_attendance !== undefined) {
            attendance = course_attendance;
        }

        const markVal = courseMark !== null && courseMark !== undefined ? parseFloat(courseMark) : null;
        const attVal = attendance !== null && attendance !== undefined ? parseFloat(attendance) : null;
        const weightVal = weight !== null && weight !== undefined ? parseFloat(weight) : 10;
        const hrs = hoursRemaining !== undefined ? hoursRemaining : 100;

        if (isSubmitted) {
            const reason = isGraded
                ? 'Assignment evaluated and graded by course lecturer.'
                : 'Submission completed on time; awaiting evaluation.';
            return {
                priority: 'LOW',
                priorityReason: reason,
                reason
            };
        }

        if (isOverdue) {
            const reason = 'Assignment deadline has passed and submission is unfulfilled overdue.';
            return {
                priority: 'URGENT',
                priorityReason: reason,
                reason
            };
        }

        // Due within 48 hours
        if (hrs <= 48) {
            const roundedHrs = Math.max(1, Math.round(hrs));
            const reason = `Immediate action required: due within 48 hours (${roundedHrs}h remaining).`;
            return {
                priority: 'URGENT',
                priorityReason: reason,
                reason
            };
        }

        // Academic risk in course (<50% course mark) due within 5 days (120 hours)
        if (markVal !== null && markVal < 50 && hrs <= 120) {
            const reason = `Critical course performance alert: current course mark is ${markVal}%, below the passing threshold.`;
            return {
                priority: 'URGENT',
                priorityReason: reason,
                reason
            };
        }

        // Low attendance (<75%) due within 7 days (168 hours)
        if (attVal !== null && attVal < 75 && hrs <= 168) {
            const reason = `Attendance risk alert: course attendance is ${attVal}%, below the mandatory 75% threshold.`;
            return {
                priority: 'HIGH',
                priorityReason: reason,
                reason
            };
        }

        // High weight (>=20%) due within 7 days (168 hours)
        if (weightVal >= 20 && hrs <= 168) {
            const reason = `Significant grade weight impact (${weightVal}% of module total) due within 7 days.`;
            return {
                priority: 'HIGH',
                priorityReason: reason,
                reason
            };
        }

        // Weak course (<60% mark) due within 7 days
        if (markVal !== null && markVal < 60 && hrs <= 168) {
            const reason = `Academic intervention priority: module average (${markVal}%) is below target standard.`;
            return {
                priority: 'HIGH',
                priorityReason: reason,
                reason
            };
        }

        // Due within 7 days (168 hours)
        if (hrs <= 168) {
            const days = Math.ceil(hrs / 24);
            const reason = `Coursework deadline approaching in ${days} day${days === 1 ? '' : 's'}.`;
            return {
                priority: 'MEDIUM',
                priorityReason: reason,
                reason
            };
        }

        const defaultReason = 'Upcoming assignment with sufficient preparation buffer.';
        return {
            priority: 'LOW',
            priorityReason: defaultReason,
            reason: defaultReason
        };
    }

    /**
     * Fetch all assignments for enrolled courses with intelligence analysis
     */
    async getAssignments(studentId) {
        // 1. Fetch Student Profile
        const [studentRows] = await pool.query(
            `SELECT s.user_id, s.full_name, s.email, s.department, s.current_semester, 
                    s.gpa, s.academic_risk, u.reg_number
             FROM students s
             JOIN users u ON s.user_id = u.id
             WHERE s.user_id = ?`,
            [studentId]
        );

        const student = studentRows.length > 0 ? studentRows[0] : null;

        // 2. Fetch Assignments for active enrollments
        const [rows] = await pool.query(
            `SELECT 
                a.id,
                a.course_code,
                c.title as course_name,
                a.title,
                a.description,
                a.due_date,
                a.total_marks as max_marks,
                a.total_marks,
                a.weight,
                a.difficulty,
                sub.id as submission_id,
                sub.submitted_at,
                sub.marks,
                sub.feedback,
                sub.status as raw_sub_status,
                sub.submission_file,
                sub.submission_text
             FROM enrollments e
             JOIN courses c ON e.course_code = c.code
             JOIN assignments a ON e.course_code = a.course_code AND a.status = 'active'
             LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
             WHERE e.student_id = ? AND e.enrollment_status = 'active'
             ORDER BY a.due_date ASC`,
            [studentId, studentId]
        );

        // 3. Fetch Course Exam Results & Attendance for context
        const [marksRows] = await pool.query(
            `SELECT course_code, ROUND(AVG(score), 1) as course_mark
             FROM exam_results
             WHERE student_id = ?
             GROUP BY course_code`,
            [studentId]
        );
        const marksMap = new Map(marksRows.map(m => [m.course_code, parseFloat(m.course_mark)]));

        const [attRows] = await pool.query(
            `SELECT course_code, 
                    ROUND((attended_classes / NULLIF(total_classes, 0)) * 100, 1) as attendance_percentage
             FROM attendance_summary
             WHERE student_id = ?`,
            [studentId]
        );
        const attMap = new Map(attRows.map(a => [a.course_code, parseFloat(a.attendance_percentage)]));

        // 4. Transform & Analyze Each Assignment
        const now = new Date();
        const assignments = rows.map(a => {
            const dueDate = new Date(a.due_date);
            const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            const hasSubmission = !!a.submission_id;

            let submissionStatus = 'PENDING';
            if (hasSubmission) {
                if (a.raw_sub_status === 'graded' || (a.marks !== null && a.marks !== undefined)) {
                    submissionStatus = 'GRADED';
                } else if (a.raw_sub_status === 'late' || (a.submitted_at && new Date(a.submitted_at) > dueDate)) {
                    submissionStatus = 'LATE';
                } else {
                    submissionStatus = 'SUBMITTED';
                }
            } else {
                if (now > dueDate) {
                    submissionStatus = 'OVERDUE';
                } else {
                    submissionStatus = 'PENDING';
                }
            }

            const isSubmitted = ['SUBMITTED', 'GRADED', 'LATE'].includes(submissionStatus);
            const isGraded = submissionStatus === 'GRADED';
            const isOverdue = submissionStatus === 'OVERDUE';

            const courseMark = marksMap.has(a.course_code) ? marksMap.get(a.course_code) : null;
            const attendance = attMap.has(a.course_code) ? attMap.get(a.course_code) : null;
            const isWeakCourse = (courseMark !== null && courseMark < 60) || (attendance !== null && attendance < 75);

            const { priority, priorityReason } = this.computePriority({
                isSubmitted,
                isGraded,
                isOverdue,
                hoursRemaining,
                isWeakCourse,
                courseMark,
                attendance
            });

            const maxMarks = parseFloat(a.max_marks || a.total_marks || 100);
            const marks = a.marks !== null && a.marks !== undefined ? parseFloat(a.marks) : null;
            const timeRemainingLabel = this.getTimeRemainingLabel(hoursRemaining, isOverdue, isSubmitted, marks, maxMarks);

            return {
                id: a.id,
                course_code: a.course_code,
                course_name: a.course_name,
                course_title: a.course_name,
                title: a.title,
                description: a.description,
                due_date: a.due_date,
                max_marks: maxMarks,
                total_marks: maxMarks,
                weight: parseFloat(a.weight || 10),
                difficulty: a.difficulty || 'medium',
                submission_status: submissionStatus,
                status: submissionStatus.toLowerCase(), // Backward compatibility with Phase 4
                priority,
                priority_reason: priorityReason,
                course_mark: courseMark,
                current_course_mark: courseMark,
                attendance: attendance,
                course_attendance: attendance,
                is_overdue: isOverdue,
                hours_remaining: Math.round(hoursRemaining * 10) / 10,
                time_remaining_label: timeRemainingLabel,
                submission_id: a.submission_id || null,
                submitted_at: a.submitted_at || null,
                marks: marks,
                feedback: a.feedback || null,
                submission_file: a.submission_file || null,
                submission_text: a.submission_text || null
            };
        });

        // 5. Compute Aggregate Summary Analytics
        const total = assignments.length;
        const submitted = assignments.filter(a => ['SUBMITTED', 'GRADED', 'LATE'].includes(a.submission_status)).length;
        const pending = assignments.filter(a => a.submission_status === 'PENDING').length;
        const overdue = assignments.filter(a => a.submission_status === 'OVERDUE').length;
        const graded = assignments.filter(a => a.submission_status === 'GRADED').length;
        const late = assignments.filter(a => a.submission_status === 'LATE').length;
        const dueSoon = assignments.filter(a => a.submission_status === 'PENDING' && a.hours_remaining <= 48 && a.hours_remaining > 0).length;

        const urgent = assignments.filter(a => a.priority === 'URGENT').length;
        const high = assignments.filter(a => a.priority === 'HIGH').length;
        const medium = assignments.filter(a => a.priority === 'MEDIUM').length;
        const low = assignments.filter(a => a.priority === 'LOW').length;

        const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;
        const gradedItems = assignments.filter(a => a.marks !== null && !isNaN(a.marks));
        const averageMarks = gradedItems.length > 0 
            ? +(gradedItems.reduce((acc, a) => acc + a.marks, 0) / gradedItems.length).toFixed(1)
            : null;

        const summary = {
            total,
            pending,
            overdue,
            submitted,
            graded,
            late,
            due_soon: dueSoon,
            urgent,
            high,
            medium,
            low,
            urgent_count: urgent,
            high_count: high,
            medium_count: medium,
            low_count: low,
            completion_rate: completionRate,
            average_marks: averageMarks
        };

        // 6. Formulate Top Priority Actions
        const unsubmitted = assignments.filter(a => !['SUBMITTED', 'GRADED', 'LATE'].includes(a.submission_status));
        const priorityOrder = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
        unsubmitted.sort((x, y) => (priorityOrder[x.priority] - priorityOrder[y.priority]) || (x.hours_remaining - y.hours_remaining));

        const priorityActions = unsubmitted.slice(0, 3).map((a, idx) => ({
            step: idx + 1,
            assignment_id: a.id,
            course_code: a.course_code,
            title: a.title,
            priority: a.priority,
            estimated_minutes: a.priority === 'URGENT' ? 90 : (a.priority === 'HIGH' ? 60 : 45),
            action: `Complete ${a.course_code} "${a.title}" — ${a.priority_reason}`,
            time_label: a.time_remaining_label
        }));

        // 7. Invoke Gemini AI Advisor with Fallback
        const aiAdvisor = await geminiService.generateAssignmentAnalysis({
            student,
            summary,
            assignments,
            priorityActions
        });

        return {
            assignments,
            summary,
            priority_actions: priorityActions,
            ai_advisor: aiAdvisor
        };
    }

    /**
     * Get detailed assignment record for a single assignment with IDOR protection
     */
    async getAssignmentDetail(studentId, assignmentId) {
        if (!assignmentId || isNaN(assignmentId)) {
            const err = new Error('Invalid assignment ID');
            err.statusCode = 400;
            throw err;
        }

        // Verify assignment exists and student is actively enrolled
        const [rows] = await pool.query(
            `SELECT 
                a.id,
                a.course_code,
                c.title as course_name,
                a.title,
                a.description,
                a.due_date,
                a.total_marks as max_marks,
                a.total_marks,
                a.weight,
                a.difficulty,
                sub.id as submission_id,
                sub.submitted_at,
                sub.marks,
                sub.feedback,
                sub.status as raw_sub_status,
                sub.submission_file,
                sub.submission_text
             FROM assignments a
             JOIN courses c ON a.course_code = c.code
             LEFT JOIN enrollments e ON a.course_code = e.course_code AND e.student_id = ? AND e.enrollment_status = 'active'
             LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
             WHERE a.id = ?`,
            [studentId, studentId, assignmentId]
        );

        if (rows.length === 0) {
            const err = new Error('Assignment not found');
            err.statusCode = 404;
            throw err;
        }

        const raw = rows[0];

        // Check if student is actively enrolled in this course
        const [enrollmentCheck] = await pool.query(
            `SELECT 1 FROM enrollments WHERE student_id = ? AND course_code = ? AND enrollment_status = 'active'`,
            [studentId, raw.course_code]
        );

        if (enrollmentCheck.length === 0) {
            const err = new Error('You are not enrolled in the course for this assignment');
            err.statusCode = 403;
            throw err;
        }

        // Fetch course performance and attendance context
        const [markRows] = await pool.query(
            `SELECT ROUND(AVG(score), 1) as course_mark FROM exam_results WHERE student_id = ? AND course_code = ?`,
            [studentId, raw.course_code]
        );
        const courseMark = markRows.length > 0 && markRows[0].course_mark !== null ? parseFloat(markRows[0].course_mark) : null;

        const [attRows] = await pool.query(
            `SELECT ROUND((attended_classes / NULLIF(total_classes, 0)) * 100, 1) as attendance_percentage 
             FROM attendance_summary WHERE student_id = ? AND course_code = ?`,
            [studentId, raw.course_code]
        );
        const attendance = attRows.length > 0 && attRows[0].attendance_percentage !== null ? parseFloat(attRows[0].attendance_percentage) : null;

        const now = new Date();
        const dueDate = new Date(raw.due_date);
        const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const hasSubmission = !!raw.submission_id;

        let submissionStatus = 'PENDING';
        if (hasSubmission) {
            if (raw.raw_sub_status === 'graded' || (raw.marks !== null && raw.marks !== undefined)) {
                submissionStatus = 'GRADED';
            } else if (raw.raw_sub_status === 'late' || (raw.submitted_at && new Date(raw.submitted_at) > dueDate)) {
                submissionStatus = 'LATE';
            } else {
                submissionStatus = 'SUBMITTED';
            }
        } else {
            if (now > dueDate) {
                submissionStatus = 'OVERDUE';
            } else {
                submissionStatus = 'PENDING';
            }
        }

        const isSubmitted = ['SUBMITTED', 'GRADED', 'LATE'].includes(submissionStatus);
        const isGraded = submissionStatus === 'GRADED';
        const isOverdue = submissionStatus === 'OVERDUE';
        const isWeakCourse = (courseMark !== null && courseMark < 60) || (attendance !== null && attendance < 75);

        const { priority, priorityReason } = this.computePriority({
            isSubmitted,
            isGraded,
            isOverdue,
            hoursRemaining,
            isWeakCourse,
            courseMark,
            attendance
        });

        const maxMarks = parseFloat(raw.max_marks || raw.total_marks || 100);
        const marks = raw.marks !== null && raw.marks !== undefined ? parseFloat(raw.marks) : null;
        const timeRemainingLabel = this.getTimeRemainingLabel(hoursRemaining, isOverdue, isSubmitted, marks, maxMarks);

        return {
            id: raw.id,
            course_code: raw.course_code,
            course_name: raw.course_name,
            course_title: raw.course_name,
            title: raw.title,
            description: raw.description,
            due_date: raw.due_date,
            max_marks: maxMarks,
            total_marks: maxMarks,
            weight: parseFloat(raw.weight || 10),
            difficulty: raw.difficulty || 'medium',
            submission_status: submissionStatus,
            status: submissionStatus.toLowerCase(),
            priority,
            priority_reason: priorityReason,
            course_mark: courseMark,
            current_course_mark: courseMark,
            attendance: attendance,
            course_attendance: attendance,
            is_overdue: isOverdue,
            hours_remaining: Math.round(hoursRemaining * 10) / 10,
            time_remaining_label: timeRemainingLabel,
            submission_id: raw.submission_id || null,
            submitted_at: raw.submitted_at || null,
            marks: marks,
            feedback: raw.feedback || null,
            submission_file: raw.submission_file || null,
            submission_text: raw.submission_text || null
        };
    }

    /**
     * Submit an assignment with defensive validation and idempotency
     */
    async submitAssignment(studentId, assignmentId, data = {}) {
        if (!assignmentId || isNaN(assignmentId)) {
            const err = new Error('Invalid assignment ID');
            err.statusCode = 400;
            throw err;
        }

        const numericId = parseInt(assignmentId, 10);

        // 1. Verify assignment exists
        const [assignments] = await pool.query(
            'SELECT id, course_code, due_date, status FROM assignments WHERE id = ?',
            [numericId]
        );

        if (assignments.length === 0) {
            const err = new Error('Assignment not found');
            err.statusCode = 404;
            throw err;
        }

        const assignment = assignments[0];

        // 2. Verify student is actively enrolled in the assignment course
        const [enrollments] = await pool.query(
            'SELECT 1 FROM enrollments WHERE student_id = ? AND course_code = ? AND enrollment_status = "active"',
            [studentId, assignment.course_code]
        );

        if (enrollments.length === 0) {
            const err = new Error('You are not enrolled in the course for this assignment');
            err.statusCode = 403;
            throw err;
        }

        // 3. Validate submission content
        const submissionText = data.submission_text !== undefined ? data.submission_text : data.text;
        const submissionFile = data.submission_file !== undefined ? data.submission_file : data.file;

        if (submissionText !== undefined && submissionText !== null) {
            if (typeof submissionText !== 'string') {
                const err = new Error('Submission text must be a string');
                err.statusCode = 400;
                throw err;
            }
            if (submissionText.trim().length === 0) {
                const err = new Error('Submission text cannot be empty');
                err.statusCode = 400;
                throw err;
            }
            if (submissionText.length > 50000) {
                const err = new Error('Submission text exceeds maximum length of 50,000 characters');
                err.statusCode = 400;
                throw err;
            }
        }

        // If neither file nor text is provided, or both are empty
        const finalFile = submissionFile ? String(submissionFile).trim() : null;
        const finalText = submissionText ? String(submissionText).trim() : null;

        if (!finalFile && !finalText) {
            // For backward compatibility: if empty body was sent in Phase 4 tests, let's check
            // In Phase 4 tests: { submission_file: 'student_solution.pdf' } had finalFile.
            // When empty body was sent in Phase 4 tests:
            // line 180: const dupSubmitRes = await request('POST', `/api/students/assignments/${assignmentToSubmit.id}/submit`, {}, studentToken);
            // It asserted 400!
            const err = new Error('Submission content (submission text or file) is required');
            err.statusCode = 400;
            throw err;
        }

        // 4. Check duplicate submission prevention
        const [existing] = await pool.query(
            'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
            [numericId, studentId]
        );

        if (existing.length > 0) {
            const err = new Error('Assignment has already been submitted');
            err.statusCode = 400;
            throw err;
        }

        // 5. Determine whether submission is on time or late
        const now = new Date();
        const dueDate = new Date(assignment.due_date);
        const isLate = now > dueDate;
        const status = isLate ? 'late' : 'submitted';

        // 6. Insert into assignment_submissions
        const [result] = await pool.query(
            `INSERT INTO assignment_submissions (assignment_id, student_id, submitted_at, status, submission_file, submission_text)
             VALUES (?, ?, NOW(), ?, ?, ?)`,
            [numericId, studentId, status, finalFile || 'online_text_submission.pdf', finalText]
        );

        return {
            submission_id: result.insertId,
            assignment_id: numericId,
            course_code: assignment.course_code,
            status,
            submission_status: status.toUpperCase(),
            submitted_at: now.toISOString(),
            is_late: isLate
        };
    }
}

module.exports = new AssignmentIntelligenceService();
