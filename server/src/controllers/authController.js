const authService = require('../services/authService');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT with user details
 * @access  Public
 */
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await authService.loginUser(username, password);

        return res.json({
            success: true,
            message: 'Login successful',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get profile of the currently authenticated user
 * @access  Private (JWT required)
 */
exports.getMe = async (req, res, next) => {
    try {
        const currentUser = await authService.getCurrentUser(req.user.id);

        return res.json({
            success: true,
            data: currentUser
        });
    } catch (error) {
        next(error);
    }
};
