const academicAnalysisService = require('../services/academicAnalysisService');

/**
 * @route   GET /api/students/academic-analysis
 * @desc    Generate personalized, deterministic academic insights from real MySQL records
 * @access  Private (Student role required, derived strictly from req.user.id)
 */
exports.getAcademicAnalysis = async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const analysis = await academicAnalysisService.analyzeStudentAcademicProfile(studentId);

        return res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        next(error);
    }
};
