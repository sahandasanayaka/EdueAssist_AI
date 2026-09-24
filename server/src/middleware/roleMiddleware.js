/**
 * Role-Based Authorization Middleware
 * Verifies that the authenticated user possesses one of the explicitly allowed roles.
 * 
 * @param {...string} allowedRoles - List of authorized role names (e.g. 'student', 'lecturer', 'admin')
 */
function requireRole(...allowedRoles) {
    const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required before checking permissions.',
                error: 'Unauthenticated'
            });
        }

        const userRole = String(req.user.role).toLowerCase();

        if (normalizedAllowed.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Forbidden. Role '${req.user.role}' does not have permission to access this resource.`,
            error: 'Forbidden'
        });
    };
}

module.exports = {
    requireRole,
    authorizeRole: requireRole
};
