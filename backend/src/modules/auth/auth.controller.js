const authService = require('./auth.service');
const { setAuthCookie, setRefreshCookie, clearAuthCookies, initializeSession } = require('../../utils/security');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get client IP
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                         req.connection?.remoteAddress || 
                         req.ip;

        const result = await authService.login(email, password, ipAddress);
        
        // Set httpOnly cookies for tokens
        if (result.token) {
            setAuthCookie(res, result.token);
        }
        if (result.refreshToken) {
            setRefreshCookie(res, result.refreshToken);
        }
        
        // Initialize CSRF session
        const { csrfToken } = initializeSession(res);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: result.user,
                redirectPath: result.redirectPath,
                csrfToken, // Send CSRF token to client
                // Don't send tokens in response body - they're in httpOnly cookies
                expiresIn: '15m' // Tell client when to refresh
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.id);
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const user = await authService.updateProfile(req.user.id, req.body);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Register - Step 1
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Skip verification in development if flag is set
        const skipVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true';

        const result = await authService.register(
            { email, password, firstName, lastName },
            skipVerification
        );

        res.status(201).json({
            success: true,
            message: result.message || 'Registration successful',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Verify Email - Step 2
 * POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        const result = await authService.verifyEmail(email, code);

        // Set httpOnly cookies for tokens
        if (result.token) {
            setAuthCookie(res, result.token);
        }
        if (result.refreshToken) {
            setRefreshCookie(res, result.refreshToken);
        }
        
        // Initialize CSRF session
        const { csrfToken } = initializeSession(res);

        res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                user: result.user,
                redirectPath: result.redirectPath,
                csrfToken,
                expiresIn: '15m'
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Refresh Token - Get new access token
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res) => {
    try {
        // Get refresh token from cookie
        const refreshTokenValue = req.cookies?.refresh_token;
        
        if (!refreshTokenValue) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided',
                code: 'REFRESH_TOKEN_MISSING'
            });
        }

        const result = await authService.refreshToken(refreshTokenValue);

        // Set new httpOnly cookies
        setAuthCookie(res, result.token);
        setRefreshCookie(res, result.refreshToken);
        
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                user: result.user,
                expiresIn: '15m'
            }
        });
    } catch (error) {
        // Clear cookies on refresh failure
        clearAuthCookies(res);
        
        res.status(401).json({
            success: false,
            message: error.message || 'Token refresh failed',
            code: 'REFRESH_TOKEN_INVALID'
        });
    }
};

/**
 * Resend Verification Code
 * POST /api/auth/resend-verification
 */
exports.resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await authService.resendVerificationCode(email);

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Forgot Password - Request password reset
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const result = await authService.forgotPassword(email);
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        // Always return success to prevent email enumeration
        console.error('Forgot password error:', error);
        res.json({
            success: true,
            message: 'If an account exists with this email, a reset link has been sent.'
        });
    }
};

/**
 * Reset Password - Set new password with token
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const result = await authService.resetPassword(token, password);
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to reset password'
        });
    }
};
