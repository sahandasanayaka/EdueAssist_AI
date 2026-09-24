const pool = require('../db/connection');
const aiContextService = require('./aiContextService');
const geminiService = require('./geminiService');

class StudyPlanService {
    /**
     * Validate generation preferences
     */
    validatePreferences(preferences = {}) {
        const { days, dailyMinutes } = preferences;

        if (days !== undefined && days !== null) {
            const parsedDays = Number(days);
            if (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 14) {
                const err = new Error('Study period must be an integer between 1 and 14 days.');
                err.statusCode = 400;
                throw err;
            }
        }

        if (dailyMinutes !== undefined && dailyMinutes !== null) {
            const parsedMinutes = Number(dailyMinutes);
            if (!Number.isInteger(parsedMinutes) || parsedMinutes < 30 || parsedMinutes > 300) {
                const err = new Error('Daily study time must be an integer between 30 and 300 minutes.');
                err.statusCode = 400;
                throw err;
            }
        }

        return {
            days: days ? parseInt(days, 10) : 7,
            dailyMinutes: dailyMinutes ? parseInt(dailyMinutes, 10) : 120
        };
    }

    /**
     * Validate the structured JSON output returned by Gemini or test mock
     */
    validateGeneratedPlan(plan) {
        if (!plan || typeof plan !== 'object') {
            const err = new Error('Generated study plan must be a valid JSON object.');
            err.statusCode = 422;
            throw err;
        }

        if (!plan.tasks || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
            const err = new Error('Generated study plan must contain at least one task.');
            err.statusCode = 422;
            throw err;
        }

        if (plan.tasks.length > 10) {
            const err = new Error('Generated study plan exceeds the maximum limit of 10 tasks.');
            err.statusCode = 422;
            throw err;
        }

        const validPriorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

        for (let i = 0; i < plan.tasks.length; i++) {
            const task = plan.tasks[i];

            if (!task.title || typeof task.title !== 'string' || task.title.trim().length === 0) {
                const err = new Error(`Task #${i + 1} is missing a required title.`);
                err.statusCode = 422;
                throw err;
            }

            if (task.title.length > 255) {
                const err = new Error(`Task #${i + 1} title exceeds 255 characters.`);
                err.statusCode = 422;
                throw err;
            }

            if (!task.priority || !validPriorities.includes(task.priority)) {
                const err = new Error(`Task #${i + 1} has invalid priority '${task.priority}'. Allowed: ${validPriorities.join(', ')}.`);
                err.statusCode = 422;
                throw err;
            }

            const minutes = parseInt(task.estimatedMinutes || task.estimated_minutes, 10);
            if (isNaN(minutes) || minutes < 15 || minutes > 240) {
                const err = new Error(`Task #${i + 1} estimated minutes must be between 15 and 240.`);
                err.statusCode = 422;
                throw err;
            }

            if (task.dueDate && isNaN(Date.parse(task.dueDate))) {
                const err = new Error(`Task #${i + 1} has an invalid dueDate format.`);
                err.statusCode = 422;
                throw err;
            }
        }

        return true;
    }

    /**
     * Generate, validate, and persist a personalized study plan for the authenticated student
     * 
     * @param {number} studentId - Authenticated student ID (req.user.id)
     * @param {Object} preferences - Optional study preferences { days, dailyMinutes }
     */
    async generatePlan(studentId, preferences = {}) {
        // 1. Validate input preferences
        const validatedPrefs = this.validatePreferences(preferences);

        // 2. Build authoritative academic context from Phase 7 analysis
        const context = await aiContextService.buildStudentContext(studentId);

        // 3. Request structured study plan from Gemini (or fallback)
        const generatedPlan = await geminiService.generateStudyPlan({
            context,
            preferences: validatedPrefs
        });

        // 4. Validate output before MySQL persistence
        this.validateGeneratedPlan(generatedPlan);

        // 5. Replace previous pending tasks for THIS student only (prevents unbounded duplication)
        // Completed milestone tasks are preserved for student achievement tracking
        await pool.query(
            'DELETE FROM study_plan_tasks WHERE student_id = ? AND status = "pending"',
            [studentId]
        );

        // 6. Insert validated plan tasks into MySQL
        for (const task of generatedPlan.tasks) {
            const minutes = parseInt(task.estimatedMinutes || task.estimated_minutes, 10) || 60;
            const dueDate = task.dueDate || task.deadline || null;
            const courseCode = task.courseCode || task.course_code || null;
            const reason = task.description || task.reason || null;

            await pool.query(
                `INSERT INTO study_plan_tasks 
                 (student_id, title, course_code, reason, deadline, estimated_minutes, priority, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    studentId,
                    task.title.trim(),
                    courseCode,
                    reason,
                    dueDate,
                    minutes,
                    task.priority
                ]
            );
        }

        // 7. Return complete persisted plan with live calculations
        return await this.getStudyPlan(studentId);
    }

    /**
     * Get study plan tasks and live calculated metrics for authenticated student
     */
    async getStudyPlan(studentId) {
        const [rows] = await pool.query(
            `SELECT id, student_id, title, course_code, reason, deadline, estimated_minutes, priority, status, created_at, updated_at
             FROM study_plan_tasks
             WHERE student_id = ?
             ORDER BY (status = 'pending') DESC, FIELD(priority, 'URGENT', 'HIGH', 'MEDIUM', 'LOW'), deadline ASC`,
            [studentId]
        );

        // Transform rows to include both canonical and semantic field aliases
        const tasks = rows.map(r => ({
            id: r.id,
            student_id: r.student_id,
            title: r.title,
            course_code: r.course_code,
            course: r.course_code,
            reason: r.reason,
            description: r.reason,
            deadline: r.deadline,
            due_date: r.deadline,
            estimated_minutes: r.estimated_minutes || 60,
            priority: r.priority,
            status: r.status,
            completed: r.status === 'completed',
            created_at: r.created_at,
            updated_at: r.updated_at
        }));

        // Compute live progress indicators
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
        const remainingMinutes = tasks.filter(t => !t.completed).reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

        return {
            tasks,
            summary: {
                totalTasks,
                completedTasks,
                pendingTasks,
                completionPercentage,
                totalMinutes,
                remainingMinutes
            }
        };
    }

    /**
     * Toggle a study plan task status (pending <-> completed)
     * Strictly IDOR protected via student_id = ?
     */
    async toggleTask(studentId, taskId) {
        const parsedId = parseInt(taskId, 10);
        if (isNaN(parsedId) || parsedId <= 0) {
            const err = new Error('Invalid task ID.');
            err.statusCode = 400;
            throw err;
        }

        // Ownership verification (IDOR protection)
        const [rows] = await pool.query(
            'SELECT id, status FROM study_plan_tasks WHERE id = ? AND student_id = ?',
            [parsedId, studentId]
        );

        if (rows.length === 0) {
            const err = new Error('Study plan task not found or access denied.');
            err.statusCode = 404;
            throw err;
        }

        const currentStatus = rows[0].status;
        const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';

        await pool.query(
            'UPDATE study_plan_tasks SET status = ? WHERE id = ? AND student_id = ?',
            [nextStatus, parsedId, studentId]
        );

        const updatedPlan = await this.getStudyPlan(studentId);
        const updatedTask = updatedPlan.tasks.find(t => t.id === parsedId);

        return {
            task: updatedTask,
            summary: updatedPlan.summary
        };
    }

    /**
     * Delete a study plan task
     * Strictly IDOR protected via student_id = ?
     */
    async deleteTask(studentId, taskId) {
        const parsedId = parseInt(taskId, 10);
        if (isNaN(parsedId) || parsedId <= 0) {
            const err = new Error('Invalid task ID.');
            err.statusCode = 400;
            throw err;
        }

        // Ownership verification (IDOR protection)
        const [rows] = await pool.query(
            'SELECT id FROM study_plan_tasks WHERE id = ? AND student_id = ?',
            [parsedId, studentId]
        );

        if (rows.length === 0) {
            const err = new Error('Study plan task not found or access denied.');
            err.statusCode = 404;
            throw err;
        }

        await pool.query(
            'DELETE FROM study_plan_tasks WHERE id = ? AND student_id = ?',
            [parsedId, studentId]
        );

        const updatedPlan = await this.getStudyPlan(studentId);

        return {
            success: true,
            deletedId: parsedId,
            summary: updatedPlan.summary
        };
    }
}

module.exports = new StudyPlanService();
