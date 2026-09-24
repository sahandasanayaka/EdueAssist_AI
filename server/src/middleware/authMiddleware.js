const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * JWT Authentication Middleware
 * Validates the Bearer token from the Authorization header and attaches the decoded user to req.user.
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No authentication token provided.',
            error: 'Access denied. No authentication token provided.'
        });
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) {
            const isExpired = err.name === 'TokenExpiredError';
            return res.status(401).json({
                success: false,
                message: isExpired ? 'Authentication token has expired. Please log in again.' : 'Invalid authentication token.',
                error: isExpired ? 'Token expired' : 'Invalid token'
            });
        }

        req.user = decoded;
        next();
    });
}

module.exports = {
    authenticateToken
};
