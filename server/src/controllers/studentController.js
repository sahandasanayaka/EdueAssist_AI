const studentService = require('../services/studentService');

/**
 * Helper to determine authenticated student ID
 */
function getStudentId(req) {
    if (req.user && req.user.id) {
        return req.user.id;
    }
    // Backward compatibility fallback for demo/legacy requests
    if (req.headers['x-user-id']) {
        return parseInt(req.headers['x-user-id'], 10);
    }
    // Default demo student Alex Perera (id 4)
    return 4;
}

exports.getStudentDashboard = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const dashboard = await studentService.getDashboard(studentId);

        // Include both { success: true, data: dashboard } and root keys for full frontend backward compatibility
        return res.json({
            success: true,
            data: dashboard,
            ...dashboard
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudentCourses = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const courses = await studentService.getCourses(studentId);

        return res.json({
            success: true,
            data: courses,
            meta: { count: courses.length }
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudentAttendance = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const attendance = await studentService.getAttendance(studentId);

        return res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudentAssignments = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const result = await studentService.getAssignments(studentId);

        return res.json({
            success: true,
            status: 'success',
            data: result.assignments,
            assignments: result.assignments,
            summary: result.summary,
            priority_actions: result.priority_actions,
            ai_advisor: result.ai_advisor,
            meta: { count: result.assignments.length }
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudentAssignmentDetail = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const assignmentId = parseInt(req.params.id, 10);
        const assignment = await studentService.getAssignmentDetail(studentId, assignmentId);

        return res.json({
            success: true,
            status: 'success',
            data: assignment
        });
    } catch (error) {
        next(error);
    }
};

exports.submitAssignment = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const assignmentId = parseInt(req.params.id, 10);
        const result = await studentService.submitAssignment(studentId, assignmentId, req.body);

        return res.status(201).json({
            success: true,
            status: 'success',
            message: 'Assignment submitted successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudentGrowth = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const growth = await studentService.getGrowth(studentId);

        return res.json({
            success: true,
            data: growth
        });
    } catch (error) {
        next(error);
    }
};

exports.getStudyPlan = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const result = await studentService.getStudyPlan(studentId);

        return res.json({
            success: true,
            data: result.tasks,
            summary: result.summary,
            meta: { count: result.tasks.length }
        });
    } catch (error) {
        next(error);
    }
};

exports.generateStudyPlan = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const result = await studentService.generateStudyPlan(studentId, req.body);

        return res.json({
            success: true,
            message: 'Personalized study plan generated successfully',
            data: result.tasks,
            summary: result.summary,
            meta: { count: result.tasks.length }
        });
    } catch (error) {
        next(error);
    }
};

exports.toggleStudyPlanTask = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const taskId = parseInt(req.params.id, 10);
        const result = await studentService.toggleStudyPlanTask(studentId, taskId);

        return res.json({
            success: true,
            message: 'Study plan task updated successfully',
            data: result.task,
            summary: result.summary
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteStudyPlanTask = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const taskId = parseInt(req.params.id, 10);
        const result = await studentService.deleteStudyPlanTask(studentId, taskId);

        return res.json({
            success: true,
            message: 'Study plan task deleted successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getCareerPaths = async (req, res, next) => {
    try {
        const paths = await studentService.getCareerPaths();
        return res.json({
            success: true,
            data: paths
        });
    } catch (error) {
        next(error);
    }
};

exports.getCareerHub = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const careerHub = await studentService.getCareerHub(studentId);

        return res.json({
            success: true,
            data: careerHub
        });
    } catch (error) {
        next(error);
    }
};

exports.updateCareerGoal = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const result = await studentService.updateCareerGoal(studentId, req.body);

        return res.json({
            success: true,
            message: 'Career goal updated successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getCourseMaterials = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const materials = await studentService.getCourseMaterials(studentId);

        return res.json({
            success: true,
            data: materials,
            meta: { count: materials.length }
        });
    } catch (error) {
        next(error);
    }
};

exports.chatWithAi = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const { message, session_id } = req.body;
        const result = await studentService.chatWithAi(studentId, message, session_id);

        return res.json({
            success: true,
            data: {
                message: result.reply,
                reply: result.reply
            },
            reply: result.reply,
            message: result.reply
        });
    } catch (error) {
        next(error);
    }
};

exports.getChatHistory = async (req, res, next) => {
    try {
        const studentId = getStudentId(req);
        const history = await studentService.getChatHistory(studentId, req.query.session_id);

        return res.json({
            success: true,
            data: history,
            meta: { count: history.length }
        });
    } catch (error) {
        next(error);
    }
};
