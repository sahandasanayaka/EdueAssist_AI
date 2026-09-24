const express = require('express');
const {
    getStudentDashboard,
    getStudentCourses,
    getStudentAttendance,
    getStudentAssignments,
    getStudentAssignmentDetail,
    submitAssignment,
    getStudentGrowth,
    getStudyPlan,
    generateStudyPlan,
    toggleStudyPlanTask,
    deleteStudyPlanTask,
    getCareerPaths,
    getCareerHub,
    updateCareerGoal,
    getCourseMaterials,
    chatWithAi,
    getChatHistory
} = require('../controllers/studentController');
const { getAcademicAnalysis } = require('../controllers/academicAnalysisController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { aiChatLimiter, studyPlanLimiter } = require('../middleware/rateLimitMiddleware');
const { validateChatMessage, validateCareerGoal } = require('../middleware/validationMiddleware');

const router = express.Router();

// Secure all student endpoints with JWT authentication and strict student role
router.use(authenticateToken);
router.use(requireRole('student'));

// 0. AI Academic Analysis Engine (Phase 7)
router.get('/academic-analysis', getAcademicAnalysis);

// 1. Dashboard
router.get('/dashboard', getStudentDashboard);

// 2. Courses
router.get('/courses', getStudentCourses);

// 3. Attendance
router.get('/attendance', getStudentAttendance);

// 4. Assignments
router.get('/assignments', getStudentAssignments);
router.get('/assignments/:id', getStudentAssignmentDetail);
router.post('/assignments/:id/submit', submitAssignment);

// 5. Growth & Performance
router.get('/growth', getStudentGrowth);

// 6. Study Plan (Phase 9)
router.get('/study-plan', getStudyPlan);
router.post('/study-plan/generate', studyPlanLimiter, generateStudyPlan);
router.patch('/study-plan/:id/toggle', toggleStudyPlanTask);
router.put('/study-plan/:id/toggle', toggleStudyPlanTask);
router.delete('/study-plan/:id', deleteStudyPlanTask);

// 7. Career Hub & Goals
router.get('/career-paths', getCareerPaths);
router.get('/career-hub', getCareerHub);
router.put('/career-goal', validateCareerGoal, updateCareerGoal);

// 8. Learning Resources
router.get('/resources', getCourseMaterials);

// 9. AI Chat & History
router.post('/chat', validateChatMessage, chatWithAi);
router.get('/chat/history', getChatHistory);
router.get('/chat-history', getChatHistory);

module.exports = router;
