const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('./auth.controller');
const { generateToken } = require('../../utils/jwt');
const { 
    setAuthCookie, 
    clearAuthCookies, 
    initializeSession,
    generateOAuthState,
    verifyOAuthState
} = require('../../utils/security');

const { authenticate } = require('../../middlewares/auth.middleware');
const { 
    validateRegistration, 
    validateLogin,
    validateVerificationCode,
    validateForgotPassword,
    validateResetPassword,
    validateProfileUpdate 
} = require('../../middlewares/validation.middleware');

// Frontend URL for redirects
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication operations
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         headers:
 *           Set-Cookie:
 *             description: Contains auth_token and refresh_token
 *             schema:
 *               type: string
 */
router.post('/login', validateLogin, authController.login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registered successfully
 */
router.post('/register', validateRegistration, authController.register);

// Email Verification Routes
router.post('/verify-email', validateVerificationCode, authController.verifyEmail);
router.post('/resend-verification', validateForgotPassword, authController.resendVerificationCode);

// Password Reset Routes
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// Token Refresh Route
router.post('/refresh', authController.refreshToken);

// ============================================
// Logout Route (Clear cookies)
// ============================================
router.post('/logout', (req, res) => {
    clearAuthCookies(res);
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ============================================
// Get CSRF Token
// ============================================
router.get('/csrf-token', (req, res) => {
    const { csrfToken } = initializeSession(res);
    res.json({
        success: true,
        data: { csrfToken }
    });
});

// ============================================
// Google OAuth Routes
// ============================================
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(501).json({
            success: false,
            message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env'
        });
    }
    
    // Generate state token to prevent CSRF
    const state = generateOAuthState();
    
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false,
        state
    })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect(`${FRONTEND_URL}/signin?error=google_not_configured`);
    }
    
    // Verify state token
    const state = req.query.state;
    if (!verifyOAuthState(state)) {
        console.error('Invalid OAuth state token');
        return res.redirect(`${FRONTEND_URL}/signin?error=invalid_state`);
    }
    
    passport.authenticate('google', { 
        failureRedirect: `${FRONTEND_URL}/signin?error=google_auth_failed`,
        session: false 
    })(req, res, () => {
        // Generate JWT token for the user
        const token = generateToken({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            image: req.user.image,
            audience: req.user.role === 'CUSTOMER' ? 'public' : 'all'
        });
        
        // Set httpOnly cookie instead of URL parameter
        setAuthCookie(res, token);
        
        // Redirect to frontend (token is in secure cookie, not URL)
        res.redirect(`${FRONTEND_URL}/oauth-callback?success=true`);
    });
});

// ============================================
// Facebook OAuth Routes
// ============================================
router.get('/facebook', (req, res, next) => {
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
        return res.status(501).json({
            success: false,
            message: 'Facebook OAuth is not configured. Please add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to .env'
        });
    }
    
    // Generate state token to prevent CSRF
    const state = generateOAuthState();
    
    passport.authenticate('facebook', { 
        scope: ['email'],
        session: false,
        state
    })(req, res, next);
});

router.get('/facebook/callback', (req, res, next) => {
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
        return res.redirect(`${FRONTEND_URL}/signin?error=facebook_not_configured`);
    }
    
    // Verify state token
    const state = req.query.state;
    if (!verifyOAuthState(state)) {
        console.error('Invalid OAuth state token');
        return res.redirect(`${FRONTEND_URL}/signin?error=invalid_state`);
    }
    
    passport.authenticate('facebook', { 
        failureRedirect: `${FRONTEND_URL}/signin?error=facebook_auth_failed`,
        session: false 
    })(req, res, () => {
        // Generate JWT token for the user
        const token = generateToken({
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            image: req.user.image,
            audience: req.user.role === 'CUSTOMER' ? 'public' : 'all'
        });
        
        // Set httpOnly cookie instead of URL parameter
        setAuthCookie(res, token);
        
        // Redirect to frontend (token is in secure cookie, not URL)
        res.redirect(`${FRONTEND_URL}/oauth-callback?success=true`);
    });
});

// ============================================
// Protected Routes
// ============================================
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, validateProfileUpdate, authController.updateMe);

// Validation utilities
const validationRoutes = require('./validation.routes');
router.use('/', validationRoutes);

module.exports = router;
