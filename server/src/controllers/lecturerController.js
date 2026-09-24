const lecturerService = require('../services/lecturerService');

exports.getLecturerDashboard = async (req, res, next) => {
    try {
        const lecturerId = req.user.id;
        const dashboard = await lecturerService.getDashboard(lecturerId);

        return res.json({
            success: true,
            status: 'success',
            data: dashboard,
            courses: dashboard.courses,
            students: dashboard.students
        });
    } catch (error) {
        next(error);
    }
};

exports.getLecturerCourses = async (req, res, next) => {
    try {
        const lecturerId = req.user.id;
        const courses = await lecturerService.getCourses(lecturerId);

        return res.json({
            success: true,
            status: 'success',
            data: courses,
            meta: { count: courses.length }
        });
    } catch (error) {
        next(error);
    }
};

exports.getLecturerCourseDetail = async (req, res, next) => {
    try {
        const lecturerId = req.user.id;
        const courseCode = req.params.courseCode;
        const detail = await lecturerService.getCourseDetail(lecturerId, courseCode);

        return res.json({
            success: true,
            status: 'success',
            data: detail,
            course: detail.course,
            performance: detail.performance,
            students: detail.students,
            assignments: detail.assignments
        });
    } catch (error) {
        next(error);
    }
};

exports.getLecturerCourseStudents = async (req, res, next) => {
    try {
        const lecturerId = req.user.id;
        const courseCode = req.params.courseCode;
        const result = await lecturerService.getCourseStudents(lecturerId, courseCode);

        return res.json({
            success: true,
            status: 'success',
            course: result.course,
            data: result.students,
            meta: { count: result.students.length }
        });
    } catch (error) {
        next(error);
    }
};

exports.getLecturerAnalytics = async (req, res, next) => {
    try {
        const lecturerId = req.user.id;
        const analytics = await lecturerService.getAnalytics(lecturerId);

        return res.json({
            success: true,
            status: 'success',
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

exports.getLecturerAssignmentSubmissions = async (req, res, next) => {
    try {
        const lecturerId = req.user.id;
        const assignmentId = parseInt(req.params.id, 10);
        const result = await lecturerService.getAssignmentSubmissions(lecturerId, assignmentId);

        return res.json({
            success: true,
            status: 'success',
            data: {
                assignment: result.assignment,
                course: result.course,
                submissions: result.submissions
            },
            assignment: result.assignment,
            course: result.course,
            submissions: result.submissions,
            meta: { count: result.submissions.length }
        });
    } catch (error) {
        next(error);
    }
};

exports.gradeLecturerSubmission = async (req, res, next) => {
    try {
        const lecturerId = req.user.id;
        const submissionId = parseInt(req.params.id, 10);
        const graded = await lecturerService.gradeSubmission(lecturerId, submissionId, req.body);

        return res.json({
            success: true,
            status: 'success',
            message: 'Submission graded successfully',
            data: graded
        });
    } catch (error) {
        next(error);
    }
};
