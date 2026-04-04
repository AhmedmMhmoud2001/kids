const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '15m';  // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d';  // Long-lived refresh token

/**
 * Generate Access Token (short-lived)
 * Used for API authentication
 */
exports.generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { 
        expiresIn: ACCESS_TOKEN_EXPIRY 
    });
};

/**
 * Generate Refresh Token (long-lived)
 * Used to obtain new access tokens
 */
exports.generateRefreshToken = (payload) => {
    // Use a different secret for refresh tokens
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
    
    return jwt.sign(
        { 
            id: payload.id, 
            type: 'refresh',
            // Add a unique identifier for this refresh token
            jti: crypto.randomBytes(16).toString('hex')
        }, 
        refreshSecret, 
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};

/**
 * Verify Access Token
 */
exports.verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify Refresh Token
 */
exports.verifyRefreshToken = (token) => {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
    const decoded = jwt.verify(token, refreshSecret);
    
    if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
    }
    
    return decoded;
};

/**
 * Decode token without verification (for debugging)
 */
exports.decodeToken = (token) => {
    return jwt.decode(token);
};

// Export expiry times for reference
exports.ACCESS_TOKEN_EXPIRY = ACCESS_TOKEN_EXPIRY;
exports.REFRESH_TOKEN_EXPIRY = REFRESH_TOKEN_EXPIRY;
