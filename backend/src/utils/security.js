/**
 * Security Utilities
 * Handles CSRF tokens, cookie management, and HMAC verification
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// ============================================
// COOKIE CONFIGURATION
// ============================================
// When dashboard/frontend runs on different origin than API (e.g. localhost or different subdomain),
// set ALLOW_CROSS_ORIGIN_AUTH=true in .env so cookies are sent (SameSite=None; Secure).
// SameSite=None requires HTTPS (secure: true).

const useCrossOriginCookies = process.env.ALLOW_CROSS_ORIGIN_AUTH === 'true';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || useCrossOriginCookies,
    sameSite: useCrossOriginCookies ? 'none' : (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    // Optional domain to support cross-subdomain cookies if needed
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {})
};

const REFRESH_COOKIE_OPTIONS = {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Set authentication cookie
 */
const setAuthCookie = (res, token) => {
    res.cookie('auth_token', token, COOKIE_OPTIONS);
};

/**
 * Set refresh token cookie
 */
const setRefreshCookie = (res, refreshToken) => {
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
};

/**
 * Clear authentication cookies
 */
const clearAuthCookies = (res) => {
    res.clearCookie('auth_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('csrf_token', { path: '/' });
};

// ============================================
// CSRF TOKEN MANAGEMENT
// ============================================

const csrfTokens = new Map(); // In production, use Redis

/**
 * Generate CSRF token
 */
const generateCsrfToken = (sessionId) => {
    const token = crypto.randomBytes(32).toString('hex');
    csrfTokens.set(sessionId, {
        token,
        createdAt: Date.now()
    });
    
    // Clean up old tokens (older than 24 hours)
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
        if (now - value.createdAt > 24 * 60 * 60 * 1000) {
            csrfTokens.delete(key);
        }
    }
    
    return token;
};

/**
 * Verify CSRF token
 */
const verifyCsrfToken = (sessionId, token) => {
    const stored = csrfTokens.get(sessionId);
    if (!stored) return false;
    
    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
        Buffer.from(stored.token),
        Buffer.from(token)
    );
    
    return isValid;
};

/**
 * CSRF Protection Middleware
 */
const csrfProtection = (req, res, next) => {
    // Skip for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }
    
    // Skip for webhooks and public APIs
    const skipPaths = [
        '/api/payment/stripe/webhook',
        '/api/payment/paymob/webhook',
        '/api/payment/paymob/callback',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/verify-email',
        '/api/auth/resend-verification',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/auth/google',
        '/api/auth/google/callback',
        '/api/auth/facebook',
        '/api/auth/facebook/callback'
    ];
    
    // Normalize path so /kids/api/... is treated like /api/... for skip list
    const pathForCheck = req.path.replace(/^\/kids/, '') || '/';
    if (skipPaths.some(path => pathForCheck.startsWith(path))) {
        return next();
    }
    
    // Get CSRF token from header
    const csrfToken = req.headers['x-csrf-token'];
    const sessionId = req.cookies?.session_id;
    
    if (!csrfToken || !sessionId) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token missing',
            code: 'CSRF_TOKEN_MISSING'
        });
    }
    
    if (!verifyCsrfToken(sessionId, csrfToken)) {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token',
            code: 'CSRF_TOKEN_INVALID'
        });
    }
    
    next();
};

/**
 * Generate session ID and CSRF token
 */
const initializeSession = (res) => {
    const sessionId = uuidv4();
    const csrfToken = generateCsrfToken(sessionId);
    
    // Set session cookie
    res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || useCrossOriginCookies,
        sameSite: useCrossOriginCookies ? 'none' : (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
        maxAge: 24 * 60 * 60 * 1000
    });
    
    return { sessionId, csrfToken };
};

// ============================================
// PAYMOB HMAC VERIFICATION
// ============================================

/**
 * Generate Paymob HMAC hash
 * @param {Object} data - Paymob callback/webhook data
 * @returns {string} - HMAC hash
 */
const generatePaymobHmac = (data) => {
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    
    if (!hmacSecret) {
        throw new Error('PAYMOB_HMAC_SECRET is not configured');
    }
    
    // Paymob HMAC fields in specific order
    const hmacFields = [
        'amount_cents',
        'created_at',
        'currency',
        'error_occured',
        'has_parent_transaction',
        'id',
        'integration_id',
        'is_3d_secure',
        'is_auth',
        'is_capture',
        'is_refunded',
        'is_standalone_payment',
        'is_voided',
        'order',
        'owner',
        'pending',
        'source_data.pan',
        'source_data.sub_type',
        'source_data.type',
        'success'
    ];
    
    // Build concatenated string
    let concatenatedString = '';
    
    for (const field of hmacFields) {
        let value;
        
        if (field.includes('.')) {
            // Handle nested fields like source_data.pan
            const parts = field.split('.');
            value = data[parts[0]]?.[parts[1]];
        } else {
            value = data[field];
        }
        
        // Convert boolean to lowercase string
        if (typeof value === 'boolean') {
            value = value.toString().toLowerCase();
        }
        
        // Append value (empty string if undefined)
        concatenatedString += (value !== undefined && value !== null) ? value : '';
    }
    
    // Generate HMAC-SHA512
    const hmac = crypto.createHmac('sha512', hmacSecret);
    hmac.update(concatenatedString);
    
    return hmac.digest('hex');
};

/**
 * Verify Paymob HMAC
 * @param {Object} data - Paymob callback/webhook data
 * @param {string} receivedHmac - HMAC from request
 * @returns {boolean}
 */
const verifyPaymobHmac = (data, receivedHmac) => {
    try {
        const calculatedHmac = generatePaymobHmac(data);
        
        // Constant-time comparison
        const isValid = crypto.timingSafeEqual(
            Buffer.from(calculatedHmac),
            Buffer.from(receivedHmac)
        );
        
        return isValid;
    } catch (error) {
        console.error('HMAC verification error:', error);
        return false;
    }
};

/**
 * Paymob HMAC Verification Middleware
 */
const verifyPaymobHmacMiddleware = (req, res, next) => {
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    
    // Skip verification if HMAC secret is not configured (development)
    if (!hmacSecret) {
        console.warn('⚠️ Paymob HMAC verification skipped - PAYMOB_HMAC_SECRET not configured');
        return next();
    }
    
    // Get HMAC from query params or body
    const receivedHmac = req.query.hmac || req.body.hmac;
    
    if (!receivedHmac) {
        console.error('Paymob webhook received without HMAC');
        return res.status(400).json({
            success: false,
            message: 'HMAC signature missing'
        });
    }
    
    // Get transaction data
    const transactionData = req.body.obj || req.body;
    
    if (!verifyPaymobHmac(transactionData, receivedHmac)) {
        console.error('Paymob HMAC verification failed');
        return res.status(401).json({
            success: false,
            message: 'Invalid HMAC signature'
        });
    }
    
    console.log('✅ Paymob HMAC verification successful');
    next();
};

// ============================================
// PASSWORD GENERATION
// ============================================

/**
 * Generate secure random password
 * @param {number} length - Password length
 * @returns {string}
 */
const generateSecurePassword = (length = 32) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
    }
    
    return password;
};

// ============================================
// OAuth State Token (Prevent CSRF in OAuth flow)
// ============================================

const oauthStates = new Map();

/**
 * Generate OAuth state token
 */
const generateOAuthState = () => {
    const state = crypto.randomBytes(32).toString('hex');
    oauthStates.set(state, {
        createdAt: Date.now()
    });
    
    // Clean up old states (older than 10 minutes)
    const now = Date.now();
    for (const [key, value] of oauthStates.entries()) {
        if (now - value.createdAt > 10 * 60 * 1000) {
            oauthStates.delete(key);
        }
    }
    
    return state;
};

/**
 * Verify OAuth state token
 */
const verifyOAuthState = (state) => {
    if (!state || !oauthStates.has(state)) {
        return false;
    }
    
    const stateData = oauthStates.get(state);
    const isExpired = Date.now() - stateData.createdAt > 10 * 60 * 1000;
    
    // Delete state after verification (one-time use)
    oauthStates.delete(state);
    
    return !isExpired;
};

module.exports = {
    // Cookie management
    COOKIE_OPTIONS,
    REFRESH_COOKIE_OPTIONS,
    setAuthCookie,
    setRefreshCookie,
    clearAuthCookies,
    
    // CSRF
    generateCsrfToken,
    verifyCsrfToken,
    csrfProtection,
    initializeSession,
    
    // Paymob HMAC
    generatePaymobHmac,
    verifyPaymobHmac,
    verifyPaymobHmacMiddleware,
    
    // Password
    generateSecurePassword,
    
    // OAuth State
    generateOAuthState,
    verifyOAuthState
};
