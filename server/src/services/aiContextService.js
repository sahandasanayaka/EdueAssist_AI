const pool = require('../db/connection');
const academicAnalysisService = require('./academicAnalysisService');

class AiContextService {
    /**
     * Builds a comprehensive, grounded academic context for Gemini.
     * All facts are gathered directly from MySQL and the Phase 7 Academic Analysis engine.
     * Identity is strictly scoped to req.user.id.
     * 
     * @param {number} studentId - The authenticated student's user_id
     */
    async buildStudentContext(studentId) {
        // 1. Run authoritative Phase 7 Academic Analysis
        const analysis = await academicAnalysisService.analyzeStudentAcademicProfile(studentId);

        // 2. Query skills and career goals from MySQL
        const [skills] = await pool.query(
            `SELECT skill_name, current_level, target_level, status 
             FROM student_skills 
             WHERE student_id = ? 
             ORDER BY current_level DESC`,
            [studentId]
        );

        const [goals] = await pool.query(
            `SELECT cg.target_role, cg.target_timeline, cg.readiness_score, cp.name as path_name
             FROM career_goals cg
             LEFT JOIN career_paths cp ON cg.career_path_id = cp.id
             WHERE cg.student_id = ?`,
            [studentId]
        );

        // 3. Assemble structured context
        const context = {
            student: {
                id: analysis.student.id,
                reg_number: analysis.student.reg_number,
                fullName: analysis.student.fullName,
                department: analysis.student.department,
                academicYear: analysis.student.academicYear,
                currentSemester: analysis.student.currentSemester,
                careerGoal: analysis.student.careerGoal || (goals.length > 0 ? goals[0].target_role : 'Not set')
            },
            academicRisk: {
                level: analysis.risk.level,
                score: analysis.risk.score,
                reasons: analysis.risk.reasons
            },
            gpa: {
                current: analysis.gpa.current,
                trend: analysis.gpa.trend,
                trendDetail: analysis.gpa.trendDetail,
                strongestCourse: analysis.gpa.strongestCourse,
                weakestCourse: analysis.gpa.weakestCourse
            },
            attendance: {
                overall: analysis.attendance.overall,
                totalClasses: analysis.attendance.totalClasses,
                attendedClasses: analysis.attendance.attendedClasses,
                warnings: analysis.attendance.warnings,
                courses: analysis.attendance.courses.map(c => ({
                    code: c.courseCode,
                    title: c.courseTitle,
                    attendance: c.attendance,
                    status: c.status
                }))
            },
            courses: {
                strong: analysis.coursePerformance.strong.map(c => ({ code: c.courseCode, title: c.courseTitle, mark: c.averageMark, grade: c.grade })),
                average: analysis.coursePerformance.average.map(c => ({ code: c.courseCode, title: c.courseTitle, mark: c.averageMark, grade: c.grade })),
                needsAttention: analysis.coursePerformance.needsAttention.map(c => ({ code: c.courseCode, title: c.courseTitle, mark: c.averageMark, grade: c.grade }))
            },
            assignments: {
                total: analysis.assignments.total,
                submitted: analysis.assignments.submitted,
                pending: analysis.assignments.pending,
                overdue: analysis.assignments.overdue,
                completionRate: analysis.assignments.completionRate,
                priorityList: analysis.assignments.priorityList.slice(0, 5).map(a => ({
                    code: a.courseCode,
                    title: a.title,
                    priority: a.priority,
                    dueDate: a.dueDate,
                    isOverdue: a.isOverdue
                }))
            },
            studyPlan: {
                totalTasks: analysis.studyPlan.totalTasks,
                completedTasks: analysis.studyPlan.completedTasks,
                pendingTasks: analysis.studyPlan.pendingTasks,
                completionRate: analysis.studyPlan.completionRate,
                status: analysis.studyPlan.status
            },
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendations: analysis.recommendations,
            priorityActions: analysis.priorityActions,
            career: {
                readinessScore: goals.length > 0 ? parseFloat(goals[0].readiness_score) : null,
                targetTimeline: goals.length > 0 ? goals[0].target_timeline : null,
                skills: skills.map(s => `${s.skill_name} (${s.current_level}/${s.target_level} - ${s.status})`)
            }
        };

        return context;
    }

    /**
     * Converts the structured context into a concise textual brief for the Gemini prompt.
     */
    formatContextForPrompt(ctx) {
        const c = ctx;
        return `
STUDENT PROFILE:
- Name: ${c.student.fullName}
- Registration Number: ${c.student.reg_number}
- Department: ${c.student.department} (${c.student.currentSemester})
- Career Goal: ${c.student.careerGoal}

ACADEMIC STANDING & RISK:
- Cumulative GPA: ${c.gpa.current} / 4.00 (Trend: ${c.gpa.trend} - ${c.gpa.trendDetail})
- Academic Risk Level: ${c.academicRisk.level} (Calculated Penalty Score: ${c.academicRisk.score}/100)
- Risk Factors: ${c.academicRisk.reasons.length > 0 ? c.academicRisk.reasons.join('; ') : 'None, in good standing'}

ATTENDANCE SUMMARY:
- Overall Attendance: ${c.attendance.overall}% (${c.attendance.attendedClasses} / ${c.attendance.totalClasses} classes attended)
- Attendance Warnings (<75%): ${c.attendance.warnings.length > 0 ? c.attendance.warnings.map(w => `${w.courseCode} (${w.attendance}%)`).join(', ') : 'None, all modules above 75%'}
- Module Details: ${c.attendance.courses.map(m => `${m.code}: ${m.attendance}% [${m.status}]`).join(', ')}

COURSE PERFORMANCE:
- Strong Modules (>=75%): ${c.courses.strong.length > 0 ? c.courses.strong.map(m => `${m.code} (${m.mark}%, ${m.grade})`).join(', ') : 'None'}
- Satisfactory Modules (50-74%): ${c.courses.average.length > 0 ? c.courses.average.map(m => `${m.code} (${m.mark}%)`).join(', ') : 'None'}
- Modules Needing Attention (<50%): ${c.courses.needsAttention.length > 0 ? c.courses.needsAttention.map(m => `${m.code} (${m.mark}%)`).join(', ') : 'None'}

ASSIGNMENTS & COURSEWORK:
- Total: ${c.assignments.total}, Submitted: ${c.assignments.submitted}, Pending: ${c.assignments.pending}, Overdue: ${c.assignments.overdue}
- Completion Rate: ${c.assignments.completionRate}%
- Top Priorities: ${c.assignments.priorityList.map(p => `[${p.priority}] ${p.code}: "${p.title}" ${p.isOverdue ? '(OVERDUE)' : ''}`).join('; ')}

STUDY PLAN STATUS:
- Tasks: ${c.studyPlan.completedTasks}/${c.studyPlan.totalTasks} completed (${c.studyPlan.completionRate}%, Status: ${c.studyPlan.status})

TOP RECOMMENDATIONS (Phase 7 Engine):
${c.recommendations.map((r, i) => `${i + 1}. [${r.urgency}] ${r.text}`).join('\n')}

TOP PRIORITY ACTIONS:
${c.priorityActions.map((a, i) => `${i + 1}. [${a.level}] ${a.action} (${a.tag})`).join('\n')}
`.trim();
    }
}

module.exports = new AiContextService();
