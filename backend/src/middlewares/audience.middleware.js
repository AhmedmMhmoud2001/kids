/**
 * Middleware to restrict access based on audience scope.
 * SYSTEM_ADMIN (scope 'all') bypasses this check.
 * @param {string} requiredAudience - The required audience scope (e.g., 'kids', 'next')
 */
exports.checkAudience = (requiredAudience) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const { role, audience } = req.user;

        // SYSTEM_ADMIN or audience 'all' bypasses specific scope checks
        if (role === 'SYSTEM_ADMIN' || audience === 'all') {
            return next();
        }

        if (audience !== requiredAudience) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Scope '${requiredAudience}' required.`
            });
        }

        next();
    };
};
