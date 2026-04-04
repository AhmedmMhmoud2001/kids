const jwt = require('jsonwebtoken');

/**
 * Extract token from request
 * Priority: 1. Authorization header, 2. Cookie
 */
const extractToken = (req) => {
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    
    // Check cookie
    if (req.cookies?.auth_token) {
        return req.cookies.auth_token;
    }
    
    return null;
};

/**
 * Authentication middleware
 * Verifies JWT token from header or cookie
 */
exports.authenticate = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. No token provided.',
            code: 'AUTH_TOKEN_MISSING'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired. Please log in again.',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid token',
            code: 'TOKEN_INVALID'
        });
    }
};

/**
 * Optional authentication middleware
 * Proceeds without error if no token is provided
 */
exports.authenticateOptional = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return next(); // Proceed without req.user
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // Even if token exists but is invalid, proceed as public
        next();
    }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // SYSTEM_ADMIN has access to everything
        if (req.user.role === 'SYSTEM_ADMIN') {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

/**
 * Audience-based authorization middleware
 * Checks if user has access to specific audience (KIDS, NEXT)
 * @param  {...string} audiences - Allowed audiences
 */
exports.authorizeAudience = (...audiences) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // SYSTEM_ADMIN and 'all' audience have access to everything
        if (req.user.role === 'SYSTEM_ADMIN' || req.user.audience === 'all') {
            return next();
        }

        if (!audiences.includes(req.user.audience)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied for this audience.',
                code: 'AUDIENCE_ACCESS_DENIED'
            });
        }

        next();
    };
};
