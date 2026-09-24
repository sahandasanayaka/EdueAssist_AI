const express = require('express');
const { getAcademicAnalysis } = require('../controllers/academicAnalysisController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Enforce JWT authentication and Student role
router.use(authenticateToken);
router.use(requireRole('student'));

// GET /api/students/academic-analysis
router.get('/', getAcademicAnalysis);

module.exports = router;
