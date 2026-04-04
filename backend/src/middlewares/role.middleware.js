/**
 * Middleware to restrict access based on user roles.
 * SYSTEM_ADMIN bypasses this check.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
exports.authorize = (allowedRoles = []) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : (allowedRoles ? [allowedRoles] : []);
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // System Admin bypasses all role checks
        if (req.user.role === 'SYSTEM_ADMIN') {
            return next();
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};
