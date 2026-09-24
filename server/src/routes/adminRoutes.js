const express = require('express');
const {
    getAdminDashboard,
    getAdminUsers,
    createAdminUser,
    deleteAdminUser,
    getAdminCourses,
    createAdminCourse,
    updateAdminCourse,
    deleteAdminCourse,
    getAdminEnrollments,
    createAdminEnrollment,
    deleteAdminEnrollment,
    getAdminAnalytics,
    getAdminSystemHealth
} = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const { 
    validateUserCreation, 
    validateCourseCreation, 
    validateCourseUpdate 
} = require('../middleware/validationMiddleware');

const router = express.Router();

// Apply auth & strict admin role to all admin routes (supports admin and super_admin)
router.use(authenticateToken);
router.use(requireRole('admin', 'super_admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.post('/users', validateUserCreation, createAdminUser);
router.delete('/users/:id', deleteAdminUser);

router.get('/courses', getAdminCourses);
router.post('/courses', validateCourseCreation, createAdminCourse);
router.put('/courses/:code', validateCourseUpdate, updateAdminCourse);
router.patch('/courses/:code', validateCourseUpdate, updateAdminCourse);
router.delete('/courses/:code', deleteAdminCourse);

router.get('/enrollments', getAdminEnrollments);
router.post('/enrollments', createAdminEnrollment);
router.delete('/enrollments/:studentId/:courseCode', deleteAdminEnrollment);
router.get('/analytics', getAdminAnalytics);
router.get('/health', getAdminSystemHealth);
router.get('/system/health', getAdminSystemHealth);

module.exports = router;
