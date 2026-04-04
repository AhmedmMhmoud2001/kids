const rbacService = require('../modules/rbac/rbac.service');

const normalizeInput = (value) => String(value || '').trim().toLowerCase();

exports.requirePermission = (...requiredPermissions) => {
    const required = requiredPermissions.map(normalizeInput).filter(Boolean);

    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            // Keep backward compatibility for existing high-privilege role.
            if (req.user.role === 'SYSTEM_ADMIN') {
                return next();
            }

            if (!required.length) return next();

            const user = await rbacService.getUserWithRbac(req.user.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const effectivePermissions = rbacService.getEffectivePermissionSet(user);
            const hasPermission = required.some((key) => effectivePermissions.has(key));

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Missing required permission.',
                    code: 'PERMISSION_DENIED',
                    requiredPermissions: required
                });
            }

            req.userPermissions = Array.from(effectivePermissions);
            return next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Permission check failed',
                code: 'PERMISSION_CHECK_FAILED'
            });
        }
    };
};

exports.requireAllPermissions = (...requiredPermissions) => {
    const required = requiredPermissions.map(normalizeInput).filter(Boolean);

    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }
            if (req.user.role === 'SYSTEM_ADMIN') return next();
            if (!required.length) return next();

            const user = await rbacService.getUserWithRbac(req.user.id);
            const effectivePermissions = rbacService.getEffectivePermissionSet(user);
            const hasAll = required.every((key) => effectivePermissions.has(key));

            if (!hasAll) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Missing one or more required permissions.',
                    code: 'PERMISSION_DENIED',
                    requiredPermissions: required
                });
            }

            req.userPermissions = Array.from(effectivePermissions);
            return next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Permission check failed',
                code: 'PERMISSION_CHECK_FAILED'
            });
        }
    };
};

exports.requireCrudPermission = (moduleName, action) => {
    const key = `${String(moduleName || '').trim().toLowerCase()}.${String(action || '').trim().toLowerCase()}`;
    return exports.requirePermission(key);
};
