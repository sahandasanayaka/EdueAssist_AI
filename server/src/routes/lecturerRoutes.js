const express = require('express');
const {
    getLecturerDashboard,
    getLecturerCourses,
    getLecturerCourseDetail,
    getLecturerCourseStudents,
    getLecturerAnalytics,
    getLecturerAssignmentSubmissions,
    gradeLecturerSubmission
} = require('../controllers/lecturerController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const { validateGrading } = require('../middleware/validationMiddleware');

const router = express.Router();

// Apply auth & strict lecturer role to all lecturer routes
router.use(authenticateToken);
router.use(requireRole('lecturer'));

router.get('/dashboard', getLecturerDashboard);
router.get('/courses', getLecturerCourses);
router.get('/courses/:courseCode', getLecturerCourseDetail);
router.get('/courses/:courseCode/students', getLecturerCourseStudents);
router.get('/analytics', getLecturerAnalytics);
router.get('/assignments/:id/submissions', getLecturerAssignmentSubmissions);
router.patch('/submissions/:id', validateGrading, gradeLecturerSubmission);
router.put('/submissions/:id', validateGrading, gradeLecturerSubmission);

module.exports = router;
