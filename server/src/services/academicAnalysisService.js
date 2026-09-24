const pool = require('../db/connection');

class AcademicAnalysisService {
    /**
     * Main entry point: Performs comprehensive deterministic academic analysis for a student.
     * All facts are gathered directly from MySQL with zero fabrication or external AI calls.
     * 
     * @param {number} userId - The authenticated user's ID from req.user.id
     */
    async analyzeStudentAcademicProfile(userId) {
        // 1. Fetch Student Profile
        const [studentRows] = await pool.query(
            `SELECT s.user_id, s.full_name, s.email, s.department, s.academic_year, 
                    s.current_semester, s.gpa, s.academic_risk, s.career_goal, u.reg_number
             FROM students s
             JOIN users u ON s.user_id = u.id
             WHERE s.user_id = ?`,
            [userId]
        );

        if (studentRows.length === 0) {
            const err = new Error('Student profile not found');
            err.statusCode = 404;
            throw err;
        }

        const student = studentRows[0];
        const studentId = student.user_id;

        // 2. Query All Academic Subsystems concurrently via Promise.all
        const [
            courses,
            attendanceRecords,
            examResults,
            assignments,
            studyPlanTasks
        ] = await Promise.all([
            this._fetchEnrolledCourses(studentId),
            this._fetchAttendance(studentId),
            this._fetchExamResults(studentId),
            this._fetchAssignments(studentId),
            this._fetchStudyPlanTasks(studentId)
        ]);

        // 3. Perform Deterministic Component Analyses
        const attendanceAnalysis = this._analyzeAttendance(attendanceRecords);
        const courseAnalysis = this._analyzeCoursePerformance(courses, examResults);
        const gpaAnalysis = this._analyzeGpa(parseFloat(student.gpa), examResults);
        const assignmentAnalysis = this._analyzeAssignments(assignments);
        const studyPlanAnalysis = this._analyzeStudyPlan(studyPlanTasks);

        // 4. Compute Deterministic Academic Risk Score & Level
        const riskAnalysis = this._calculateAcademicRisk({
            currentGpa: parseFloat(student.gpa),
            attendanceAnalysis,
            courseAnalysis,
            assignmentAnalysis,
            studyPlanAnalysis
        });

        // 5. Generate Evidence-Grounded Strengths & Weaknesses
        const { strengths, weaknesses } = this._deriveStrengthsAndWeaknesses({
            gpa: parseFloat(student.gpa),
            attendanceAnalysis,
            courseAnalysis,
            assignmentAnalysis,
            studyPlanAnalysis
        });

        // 6. Generate Actionable Recommendations & Prioritized Actions
        const recommendations = this._generateRecommendations({
            riskAnalysis,
            attendanceAnalysis,
            courseAnalysis,
            assignmentAnalysis,
            studyPlanAnalysis,
            careerGoal: student.career_goal
        });

        const priorityActions = this._generatePriorityActions({
            attendanceAnalysis,
            courseAnalysis,
            assignmentAnalysis,
            studyPlanAnalysis
        });

        return {
            student: {
                id: student.user_id,
                reg_number: student.reg_number,
                fullName: student.full_name,
                email: student.email,
                department: student.department,
                academicYear: student.academic_year,
                currentSemester: student.current_semester,
                careerGoal: student.career_goal
            },
            risk: riskAnalysis,
            gpa: gpaAnalysis,
            attendance: attendanceAnalysis,
            coursePerformance: courseAnalysis,
            assignments: assignmentAnalysis,
            studyPlan: studyPlanAnalysis,
            strengths,
            weaknesses,
            recommendations,
            priorityActions
        };
    }

    // =========================================================================
    // PRIVATE DATA FETCHER HELPERS (Parameterized SQL Queries)
    // =========================================================================

    async _fetchEnrolledCourses(studentId) {
        const [rows] = await pool.query(
            `SELECT c.code, c.title, c.credits, c.department, c.semester,
                    COALESCE(l.full_name, 'Faculty Instructor') as lecturer_name
             FROM enrollments e
             JOIN courses c ON e.course_code = c.code
             LEFT JOIN lecturers l ON c.lecturer_id = l.user_id
             WHERE e.student_id = ? AND e.enrollment_status = 'active'
             ORDER BY c.code ASC`,
            [studentId]
        );
        return rows;
    }

    async _fetchAttendance(studentId) {
        const [rows] = await pool.query(
            `SELECT att.course_code, c.title as course_title, c.credits,
                    att.total_classes, att.attended_classes,
                    ROUND((att.attended_classes / NULLIF(att.total_classes, 0)) * 100, 1) as percentage
             FROM attendance_summary att
             JOIN courses c ON att.course_code = c.code
             WHERE att.student_id = ?
             ORDER BY att.course_code ASC`,
            [studentId]
        );
        return rows;
    }

    async _fetchExamResults(studentId) {
        const [rows] = await pool.query(
            `SELECT er.course_code, c.title as course_title, er.exam_type,
                    er.score, er.max_score, er.grade, er.grade_point, er.semester,
                    ROUND((er.score / NULLIF(er.max_score, 0)) * 100, 1) as percentage
             FROM exam_results er
             JOIN courses c ON er.course_code = c.code
             WHERE er.student_id = ?
             ORDER BY er.id ASC`,
            [studentId]
        );
        return rows;
    }

    async _fetchAssignments(studentId) {
        const [rows] = await pool.query(
            `SELECT a.id, a.course_code, c.title as course_title, a.title, 
                    a.description, a.due_date, a.total_marks, a.weight, a.difficulty,
                    sub.submitted_at, sub.marks as score,
                    COALESCE(sub.status, 'pending') as submission_status,
                    CASE 
                        WHEN sub.id IS NULL AND a.due_date < NOW() THEN 1 
                        ELSE 0 
                    END as is_overdue
             FROM enrollments e
             JOIN assignments a ON e.course_code = a.course_code AND a.status = 'active'
             JOIN courses c ON a.course_code = c.code
             LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
             WHERE e.student_id = ? AND e.enrollment_status = 'active'
             ORDER BY a.due_date ASC`,
            [studentId, studentId]
        );
        return rows;
    }

    async _fetchStudyPlanTasks(studentId) {
        const [rows] = await pool.query(
            `SELECT id, title, reason, deadline, priority, status, resource_link,
                    CASE WHEN status = 'pending' AND deadline < CURDATE() THEN 1 ELSE 0 END as is_overdue
             FROM study_plan_tasks
             WHERE student_id = ?
             ORDER BY (status = 'pending') DESC, (priority = 'HIGH') DESC, deadline ASC`,
            [studentId]
        );
        return rows;
    }

    // =========================================================================
    // PRIVATE ANALYSIS ENGINES (Deterministic, Rule-Based, Documented)
    // =========================================================================

    /**
     * 1. Attendance Analysis:
     * Evaluates course by course attendance vs university 75% statutory threshold.
     */
    _analyzeAttendance(records) {
        let totalClasses = 0;
        let attendedClasses = 0;
        const courses = [];
        const warnings = [];

        records.forEach(r => {
            const total = r.total_classes || 0;
            const attended = r.attended_classes || 0;
            const pct = r.percentage !== null ? parseFloat(r.percentage) : (total > 0 ? Math.round((attended / total) * 100) : 0);

            totalClasses += total;
            attendedClasses += attended;

            let status = 'GOOD';
            let reason = 'Attendance meets statutory examination eligibility standards.';

            if (pct < 60) {
                status = 'CRITICAL';
                reason = `Critical attendance deficit (${pct}%). Student is severely below minimum university requirements.`;
                warnings.push({
                    courseCode: r.course_code,
                    courseTitle: r.course_title,
                    attendance: pct,
                    severity: 'CRITICAL',
                    message: `Critical attendance in ${r.course_code} (${pct}%). Immediate attendance required to avoid exam debarment.`
                });
            } else if (pct < 75) {
                status = 'WARNING';
                reason = `Attendance (${pct}%) is below the 75% threshold required for sitting semester exams.`;
                warnings.push({
                    courseCode: r.course_code,
                    courseTitle: r.course_title,
                    attendance: pct,
                    severity: 'WARNING',
                    message: `Attendance in ${r.course_code} (${pct}%) is below the required 75% threshold.`
                });
            }

            courses.push({
                courseCode: r.course_code,
                courseTitle: r.course_title,
                credits: r.credits,
                totalClasses: total,
                attendedClasses: attended,
                attendance: pct,
                status,
                reason
            });
        });

        const overall = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 1000) / 10 : 0;

        return {
            overall,
            totalClasses,
            attendedClasses,
            courses,
            warnings,
            hasWarnings: warnings.length > 0
        };
    }

    /**
     * 2. Course Performance Analysis:
     * Groups courses into STRONG (>=75%), AVERAGE (50-74%), NEEDS_ATTENTION (<50%), or INSUFFICIENT_DATA.
     */
    _analyzeCoursePerformance(courses, examResults) {
        const strong = [];
        const average = [];
        const needsAttention = [];
        const all = [];

        courses.forEach(c => {
            const results = examResults.filter(er => er.course_code === c.code);
            if (results.length === 0) {
                const item = {
                    courseCode: c.code,
                    courseTitle: c.title,
                    credits: c.credits,
                    averageMark: null,
                    grade: null,
                    status: 'INSUFFICIENT_DATA',
                    reason: 'No continuous assessment or examination marks recorded yet.'
                };
                all.push(item);
                return;
            }

            // Calculate average percentage score across assessments
            const totalScore = results.reduce((acc, r) => acc + (parseFloat(r.percentage) || 0), 0);
            const avg = Math.round((totalScore / results.length) * 10) / 10;
            const latest = results[results.length - 1];

            let status = 'AVERAGE';
            let reason = 'Satisfactory performance across continuous assessments.';

            if (avg >= 75) {
                status = 'STRONG';
                reason = `High academic mastery with an average mark of ${avg}% (${latest.grade || 'A'}).`;
            } else if (avg < 50) {
                status = 'NEEDS_ATTENTION';
                reason = `Performance is below passing grade with an average of ${avg}% (${latest.grade || 'F'}). Academic support advised.`;
            }

            const item = {
                courseCode: c.code,
                courseTitle: c.title,
                credits: c.credits,
                averageMark: avg,
                grade: latest.grade,
                status,
                reason
            };

            all.push(item);
            if (status === 'STRONG') strong.push(item);
            else if (status === 'AVERAGE') average.push(item);
            else if (status === 'NEEDS_ATTENTION') needsAttention.push(item);
        });

        return {
            all,
            strong,
            average,
            needsAttention,
            strongCount: strong.length,
            attentionCount: needsAttention.length
        };
    }

    /**
     * 3. GPA Analysis:
     * Analyzes current GPA, identifies strongest/weakest modules, and establishes trend.
     */
    _analyzeGpa(currentGpa, examResults) {
        let trend = 'INSUFFICIENT_DATA';
        let trendDetail = 'Single-semester baseline established.';

        if (examResults.length >= 2) {
            const gradesWithPoints = examResults.filter(er => er.grade_point !== null);
            if (gradesWithPoints.length >= 2) {
                const firstHalf = gradesWithPoints.slice(0, Math.floor(gradesWithPoints.length / 2));
                const secondHalf = gradesWithPoints.slice(Math.floor(gradesWithPoints.length / 2));

                const avg1 = firstHalf.reduce((acc, r) => acc + parseFloat(r.grade_point), 0) / firstHalf.length;
                const avg2 = secondHalf.reduce((acc, r) => acc + parseFloat(r.grade_point), 0) / secondHalf.length;

                const diff = avg2 - avg1;
                if (diff > 0.15) {
                    trend = 'IMPROVING';
                    trendDetail = 'Recent assessment results reflect an upward trajectory.';
                } else if (diff < -0.15) {
                    trend = 'DECLINING';
                    trendDetail = 'Recent assessment results indicate a downward trend requiring focus.';
                } else {
                    trend = 'STABLE';
                    trendDetail = 'Academic performance remains steady across modules.';
                }
            } else {
                trend = currentGpa >= 3.0 ? 'STABLE' : 'NEEDS_ATTENTION';
            }
        } else {
            trend = 'INSUFFICIENT_DATA';
            trendDetail = 'Insufficient historical data to determine a multi-term trajectory.';
        }

        // Identify strongest and weakest courses
        let strongestCourse = null;
        let weakestCourse = null;

        if (examResults.length > 0) {
            const sorted = [...examResults].sort((a, b) => (parseFloat(b.percentage) || 0) - (parseFloat(a.percentage) || 0));
            const top = sorted[0];
            const bottom = sorted[sorted.length - 1];

            strongestCourse = {
                courseCode: top.course_code,
                courseTitle: top.course_title,
                score: parseFloat(top.percentage),
                grade: top.grade
            };

            if (sorted.length > 1 && top.course_code !== bottom.course_code) {
                weakestCourse = {
                    courseCode: bottom.course_code,
                    courseTitle: bottom.course_title,
                    score: parseFloat(bottom.percentage),
                    grade: bottom.grade
                };
            }
        }

        return {
            current: currentGpa,
            trend,
            trendDetail,
            strongestCourse,
            weakestCourse
        };
    }

    /**
     * 4. Assignment Analysis:
     * Calculates completion rates, identifies overdue coursework, and classifies priority.
     */
    _analyzeAssignments(assignments) {
        const total = assignments.length;
        let submitted = 0;
        let graded = 0;
        let overdue = 0;
        let pending = 0;

        const priorityList = [];

        assignments.forEach(a => {
            const isSubmitted = a.submission_status === 'submitted' || a.submission_status === 'graded';
            if (isSubmitted) {
                submitted++;
                if (a.submission_status === 'graded') graded++;
            } else {
                pending++;
                if (a.is_overdue) overdue++;
            }

            // Assign priority:
            // URGENT: Overdue
            // HIGH: Pending and due within 48 hours
            // MEDIUM: Pending and due within 7 days
            // LOW: Due > 7 days or already submitted
            let priority = 'LOW';
            const now = new Date();
            const dueDate = new Date(a.due_date);
            const hoursRemaining = (dueDate - now) / (1000 * 60 * 60);

            if (!isSubmitted && a.is_overdue) {
                priority = 'URGENT';
            } else if (!isSubmitted && hoursRemaining <= 48 && hoursRemaining > 0) {
                priority = 'HIGH';
            } else if (!isSubmitted && hoursRemaining <= 168 && hoursRemaining > 48) {
                priority = 'MEDIUM';
            }

            priorityList.push({
                id: a.id,
                courseCode: a.course_code,
                courseTitle: a.course_title,
                title: a.title,
                dueDate: a.due_date,
                status: a.submission_status,
                isOverdue: Boolean(a.is_overdue),
                priority,
                score: a.score !== null ? parseFloat(a.score) : null
            });
        });

        // Sort priority list: URGENT -> HIGH -> MEDIUM -> LOW, then by due date
        const priorityWeights = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        priorityList.sort((a, b) => {
            if (priorityWeights[b.priority] !== priorityWeights[a.priority]) {
                return priorityWeights[b.priority] - priorityWeights[a.priority];
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 100;

        return {
            total,
            submitted,
            graded,
            pending,
            overdue,
            completionRate,
            priorityList
        };
    }

    /**
     * 5. Study Plan Analysis:
     * Evaluates task completion velocity and overdue tasks.
     */
    _analyzeStudyPlan(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = total - completed;
        const overdue = tasks.filter(t => t.is_overdue).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;

        let status = 'ON_TRACK';
        if (overdue > 0 || (total >= 3 && completionRate < 40)) {
            status = 'BEHIND';
        } else if (total >= 3 && completionRate < 70) {
            status = 'NEEDS_ATTENTION';
        }

        return {
            totalTasks: total,
            completedTasks: completed,
            pendingTasks: pending,
            overdueTasks: overdue,
            completionRate,
            status
        };
    }

    /**
     * 6. Academic Risk Engine:
     * Mathematically calculates a deterministic 100-point risk score based on 4 criteria:
     * - GPA Component: 0 to 40 points
     * - Attendance Component: 0 to 30 points
     * - Course Performance Component: 0 to 20 points
     * - Assignment Component: 0 to 10 points
     */
    _calculateAcademicRisk({ currentGpa, attendanceAnalysis, courseAnalysis, assignmentAnalysis, studyPlanAnalysis }) {
        let score = 0;
        const reasons = [];

        // --- A. GPA Component (Up to 40 pts) ---
        if (currentGpa < 2.00) {
            score += 40;
            reasons.push(`Cumulative GPA of ${currentGpa.toFixed(2)} is below the minimum graduation threshold of 2.00.`);
        } else if (currentGpa < 2.50) {
            score += 30;
            reasons.push(`Cumulative GPA of ${currentGpa.toFixed(2)} is below the recommended 2.50 threshold.`);
        } else if (currentGpa < 3.00) {
            score += 15;
            reasons.push(`Cumulative GPA of ${currentGpa.toFixed(2)} is in the satisfactory range but requires monitoring.`);
        } else {
            // GPA >= 3.00 -> 0 pts
        }

        // --- B. Attendance Component (Up to 30 pts) ---
        const criticalCourses = attendanceAnalysis.courses.filter(c => c.status === 'CRITICAL');
        const warningCourses = attendanceAnalysis.courses.filter(c => c.status === 'WARNING');

        if (criticalCourses.length > 0) {
            score += 30;
            reasons.push(`Critical attendance (<60%) detected in ${criticalCourses.map(c => `${c.courseCode} (${c.attendance}%)`).join(', ')}.`);
        } else if (warningCourses.length > 0) {
            score += 20;
            reasons.push(`Low attendance (<75%) in ${warningCourses.map(c => `${c.courseCode} (${c.attendance}%)`).join(', ')} threatens examination eligibility.`);
        } else if (attendanceAnalysis.overall < 75 && attendanceAnalysis.courses.length > 0) {
            score += 10;
            reasons.push(`Overall attendance of ${attendanceAnalysis.overall}% is below the university 75% standard.`);
        }

        // --- C. Course Performance Component (Up to 20 pts) ---
        const failingCourses = courseAnalysis.needsAttention;
        if (failingCourses.length > 0) {
            score += 20;
            reasons.push(`Academic attention needed in ${failingCourses.map(c => `${c.courseCode} (${c.averageMark}%)`).join(', ')}.`);
        } else if (courseAnalysis.average.some(c => c.averageMark < 60)) {
            score += 10;
            reasons.push('Some enrolled courses have continuous assessment marks between 50% and 60%.');
        }

        // --- D. Assignment Component (Up to 10 pts) ---
        if (assignmentAnalysis.overdue >= 2) {
            score += 10;
            reasons.push(`${assignmentAnalysis.overdue} coursework assignments are currently overdue.`);
        } else if (assignmentAnalysis.overdue === 1) {
            score += 6;
            reasons.push('1 coursework assignment is currently past its submission deadline.');
        } else if (assignmentAnalysis.total > 0 && assignmentAnalysis.completionRate < 50) {
            score += 4;
            reasons.push(`Coursework completion rate is currently low at ${assignmentAnalysis.completionRate}%.`);
        }

        // Cap score at 100
        score = Math.min(score, 100);

        // Map score to explainable categorical Risk Level:
        // HIGH: score >= 65 OR GPA < 2.00 OR any course < 60%
        // MEDIUM: score 35 - 64
        // LOW: score < 35
        let level = 'LOW';
        if (score >= 65 || currentGpa < 2.00 || criticalCourses.length > 0) {
            level = 'HIGH';
        } else if (score >= 35 || warningCourses.length > 0 || failingCourses.length > 0 || currentGpa < 3.00) {
            level = 'MEDIUM';
        }

        if (reasons.length === 0) {
            reasons.push('All core indicators (GPA, attendance, coursework, and assessments) are in good standing.');
        }

        return {
            level,
            score,
            reasons
        };
    }

    /**
     * 7. Strengths and Weaknesses Generator:
     * Generates evidence-backed statements directly mapped to student records.
     */
    _deriveStrengthsAndWeaknesses({ gpa, attendanceAnalysis, courseAnalysis, assignmentAnalysis, studyPlanAnalysis }) {
        const strengths = [];
        const weaknesses = [];

        // Strengths
        if (gpa >= 3.50) {
            strengths.push({
                title: 'Exceptional Academic Standing',
                detail: `Cumulative GPA of ${gpa.toFixed(2)} places you in the top tier of your degree program.`,
                evidence: `GPA: ${gpa.toFixed(2)} / 4.00`
            });
        } else if (gpa >= 3.00) {
            strengths.push({
                title: 'Solid Grade Point Average',
                detail: `Maintaining a healthy ${gpa.toFixed(2)} GPA meets all prerequisite requirements for advanced electives.`,
                evidence: `GPA: ${gpa.toFixed(2)}`
            });
        }

        if (attendanceAnalysis.overall >= 85) {
            strengths.push({
                title: 'Exemplary Lecture Attendance',
                detail: `Overall attendance of ${attendanceAnalysis.overall}% demonstrates consistent engagement across faculty lectures.`,
                evidence: `${attendanceAnalysis.attendedClasses} of ${attendanceAnalysis.totalClasses} classes attended`
            });
        }

        courseAnalysis.strong.forEach(c => {
            strengths.push({
                title: `Subject Mastery in ${c.courseCode}`,
                detail: `Strong command of ${c.courseTitle} with an average mark of ${c.averageMark}% (${c.grade || 'A'}).`,
                evidence: `${c.courseCode}: ${c.averageMark}%`
            });
        });

        if (assignmentAnalysis.total > 0 && assignmentAnalysis.completionRate >= 80 && assignmentAnalysis.overdue === 0) {
            strengths.push({
                title: 'Disciplined Coursework Submission',
                detail: 'No overdue assignments with high on-time delivery across degree modules.',
                evidence: `${assignmentAnalysis.completionRate}% coursework completion rate`
            });
        }

        // Weaknesses
        if (gpa < 2.50) {
            weaknesses.push({
                title: 'Vulnerable Grade Point Average',
                detail: `Cumulative GPA of ${gpa.toFixed(2)} is below the recommended 2.50 minimum.`,
                evidence: `GPA: ${gpa.toFixed(2)}`
            });
        }

        attendanceAnalysis.warnings.forEach(w => {
            weaknesses.push({
                title: `Attendance Deficit in ${w.courseCode}`,
                detail: `Attendance has dropped to ${w.attendance}%, below the 75% examination eligibility limit.`,
                evidence: `${w.courseCode}: ${w.attendance}%`
            });
        });

        courseAnalysis.needsAttention.forEach(c => {
            weaknesses.push({
                title: `Academic Difficulty in ${c.courseCode}`,
                detail: `Assessment score of ${c.averageMark}% (${c.grade || 'D/F'}) in ${c.courseTitle} requires remediation.`,
                evidence: `${c.courseCode}: ${c.averageMark}%`
            });
        });

        if (assignmentAnalysis.overdue > 0) {
            weaknesses.push({
                title: 'Unsubmitted Overdue Coursework',
                detail: `${assignmentAnalysis.overdue} assignment(s) have passed their due dates without submission.`,
                evidence: `${assignmentAnalysis.overdue} overdue assignment(s)`
            });
        }

        if (studyPlanAnalysis.status === 'BEHIND') {
            weaknesses.push({
                title: 'Lagging Study Plan Milestones',
                detail: `${studyPlanAnalysis.overdueTasks} study task(s) are past their planned completion dates.`,
                evidence: `${studyPlanAnalysis.completionRate}% task completion rate`
            });
        }

        return { strengths, weaknesses };
    }

    /**
     * 8. Actionable Recommendations Generator:
     * Produces targeted, contextual academic guidance based on identified vulnerabilities.
     */
    _generateRecommendations({ riskAnalysis, attendanceAnalysis, courseAnalysis, assignmentAnalysis, studyPlanAnalysis, careerGoal }) {
        const recommendations = [];

        // Attendance recommendations
        attendanceAnalysis.warnings.forEach(w => {
            recommendations.push({
                category: 'ATTENDANCE',
                urgency: w.severity === 'CRITICAL' ? 'URGENT' : 'HIGH',
                text: `Prioritize attending upcoming ${w.courseCode} lectures to elevate your attendance above the mandatory 75% threshold.`
            });
        });

        // Assignment recommendations
        const overdueAssignments = assignmentAnalysis.priorityList.filter(a => a.isOverdue);
        if (overdueAssignments.length > 0) {
            const first = overdueAssignments[0];
            recommendations.push({
                category: 'ASSIGNMENT',
                urgency: 'URGENT',
                text: `Complete and submit the overdue assignment for ${first.courseTitle} (${first.courseCode}) to avoid further grade deduction.`
            });
        }

        const urgentDue = assignmentAnalysis.priorityList.filter(a => a.priority === 'HIGH');
        if (urgentDue.length > 0) {
            const first = urgentDue[0];
            recommendations.push({
                category: 'ASSIGNMENT',
                urgency: 'HIGH',
                text: `Prepare submission for "${first.title}" in ${first.courseCode} due within the next 48 hours.`
            });
        }

        // Subject remediation recommendations
        courseAnalysis.needsAttention.forEach(c => {
            recommendations.push({
                category: 'ACADEMIC_STUDY',
                urgency: 'HIGH',
                text: `Schedule a consultation with your ${c.courseCode} instructor and allocate dedicated revision sessions for ${c.courseTitle}.`
            });
        });

        // High-performer extension
        if (riskAnalysis.level === 'LOW' && recommendations.length === 0) {
            recommendations.push({
                category: 'CAREER_ACCELERATION',
                urgency: 'MEDIUM',
                text: `Your academic profile is strong. Advance your target career goal as a ${careerGoal || 'Software Professional'} by tackling industry portfolio projects.`
            });
        }

        return recommendations;
    }

    /**
     * 9. Priority Actions Generator:
     * Generates a ranked checklist sorted strictly by urgency.
     */
    _generatePriorityActions({ attendanceAnalysis, courseAnalysis, assignmentAnalysis, studyPlanAnalysis }) {
        const actions = [];

        // 1. URGENT: Overdue assignments
        assignmentAnalysis.priorityList.filter(a => a.isOverdue).forEach(a => {
            actions.push({
                level: 'URGENT',
                action: `Submit overdue coursework for ${a.courseCode}: "${a.title}".`,
                tag: 'Coursework'
            });
        });

        // 2. URGENT / HIGH: Critical attendance
        attendanceAnalysis.courses.filter(c => c.status === 'CRITICAL').forEach(c => {
            actions.push({
                level: 'URGENT',
                action: `Attend all scheduled ${c.courseCode} lectures (attendance currently critical at ${c.attendance}%).`,
                tag: 'Attendance'
            });
        });

        // 3. HIGH: Warnings in attendance
        attendanceAnalysis.courses.filter(c => c.status === 'WARNING').forEach(c => {
            actions.push({
                level: 'HIGH',
                action: `Improve attendance in ${c.courseCode} from ${c.attendance}% to at least 75%.`,
                tag: 'Attendance'
            });
        });

        // 4. HIGH: Near-due assignments
        assignmentAnalysis.priorityList.filter(a => a.priority === 'HIGH').forEach(a => {
            actions.push({
                level: 'HIGH',
                action: `Finalize "${a.title}" (${a.courseCode}) due in less than 48 hours.`,
                tag: 'Coursework'
            });
        });

        // 5. MEDIUM: Courses needing attention
        courseAnalysis.needsAttention.forEach(c => {
            actions.push({
                level: 'MEDIUM',
                action: `Review lecture notes and practice problem sets for ${c.courseCode} (${c.courseTitle}).`,
                tag: 'Revision'
            });
        });

        // 6. LOW: Study plan tasks
        studyPlanAnalysis.pendingTasks > 0 && actions.push({
            level: 'LOW',
            action: 'Check off pending milestones in your AI Study Plan.',
            tag: 'Study Plan'
        });

        return actions;
    }
}

module.exports = new AcademicAnalysisService();
