const adminService = require('../services/adminService');

exports.getAdminDashboard = async (req, res, next) => {
    try {
        const metrics = await adminService.getDashboardMetrics();

        return res.json({
            success: true,
            status: 'success',
            data: metrics,
            metrics: metrics.metrics,
            risk_distribution: metrics.risk_distribution,
            career_analytics: metrics.career_analytics,
            course_analytics: metrics.course_analytics
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdminUsers = async (req, res, next) => {
    try {
        const users = await adminService.getAllUsers(req.query);

        return res.json({
            success: true,
            status: 'success',
            data: users,
            meta: { count: users.length }
        });
    } catch (error) {
        next(error);
    }
};

exports.createAdminUser = async (req, res, next) => {
    try {
        const newUser = await adminService.createUser(req.body);

        return res.status(201).json({
            success: true,
            status: 'success',
            message: 'User created successfully',
            data: newUser
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteAdminUser = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id, 10);
        const result = await adminService.deleteUser(userId, req.user.id);

        return res.json({
            success: true,
            status: 'success',
            message: 'User deleted successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdminCourses = async (req, res, next) => {
    try {
        const courses = await adminService.getAllCourses();

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

exports.createAdminCourse = async (req, res, next) => {
    try {
        const course = await adminService.createCourse(req.body);

        return res.status(201).json({
            success: true,
            status: 'success',
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        next(error);
    }
};

exports.updateAdminCourse = async (req, res, next) => {
    try {
        const courseCode = req.params.code;
        const updated = await adminService.updateCourse(courseCode, req.body);

        return res.json({
            success: true,
            status: 'success',
            message: 'Course updated successfully',
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteAdminCourse = async (req, res, next) => {
    try {
        const courseCode = req.params.code;
        const result = await adminService.deleteCourse(courseCode);

        return res.json({
            success: true,
            status: 'success',
            message: 'Course removed successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdminEnrollments = async (req, res, next) => {
    try {
        const overview = await adminService.getEnrollmentOverview();
        const enrollments = await adminService.getAllEnrollments(req.query);

        return res.json({
            success: true,
            status: 'success',
            data: enrollments,
            enrollments,
            overview
        });
    } catch (error) {
        next(error);
    }
};

exports.createAdminEnrollment = async (req, res, next) => {
    try {
        const result = await adminService.enrollStudent(req.body);

        return res.status(201).json({
            success: true,
            status: 'success',
            message: 'Student enrolled successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteAdminEnrollment = async (req, res, next) => {
    try {
        const { studentId, courseCode } = req.params;
        const result = await adminService.unenrollStudent(studentId, courseCode);

        return res.json({
            success: true,
            status: 'success',
            message: 'Student unenrolled successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdminAnalytics = async (req, res, next) => {
    try {
        const analytics = await adminService.getAdminAnalytics();

        return res.json({
            success: true,
            status: 'success',
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

exports.getAdminSystemHealth = async (req, res, next) => {
    try {
        const health = await adminService.getSystemHealth();

        return res.json({
            success: true,
            status: 'success',
            data: health
        });
    } catch (error) {
        next(error);
    }
};
