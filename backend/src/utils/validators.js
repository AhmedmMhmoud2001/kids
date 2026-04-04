/**
 * Input Validators with Regex
 * Comprehensive validation for all user inputs
 */

// =============================================
// EMAIL VALIDATION
// =============================================

/**
 * Advanced Email Regex
 * - Validates format: local@domain.tld
 * - Allows subdomains: user@mail.example.com
 * - Allows + addressing: user+tag@example.com
 * - Max 254 characters (RFC 5321)
 */
const EMAIL_REGEX = /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/;

/**
 * Validate email format
 * @param {string} email 
 * @returns {object} { isValid, error }
 */
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required' };
    }

    const trimmed = email.trim().toLowerCase();

    if (trimmed.length < 5) {
        return { isValid: false, error: 'Email is too short' };
    }

    if (trimmed.length > 254) {
        return { isValid: false, error: 'Email is too long (max 254 characters)' };
    }

    if (!EMAIL_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Invalid email format' };
    }

    // Check for consecutive dots
    if (trimmed.includes('..')) {
        return { isValid: false, error: 'Invalid email format (consecutive dots)' };
    }

    return { isValid: true, value: trimmed };
};

// =============================================
// PASSWORD VALIDATION
// =============================================

/**
 * Password Strength Regex
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const PASSWORD_STRONG_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_=])[A-Za-z\d@$!%*?&#+\-_=]{8,128}$/;
const PASSWORD_MEDIUM_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d@$!%*?&#+\-_=]{6,128}$/;

/**
 * Validate password strength
 * @param {string} password 
 * @param {string} strength - 'strong' | 'medium' | 'basic'
 * @returns {object} { isValid, error, strength }
 */
const validatePassword = (password, requiredStrength = 'medium') => {
    if (!password || typeof password !== 'string') {
        return { isValid: false, error: 'Password is required' };
    }

    if (password.length < 6) {
        return { isValid: false, error: 'Password must be at least 6 characters' };
    }

    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long (max 128 characters)' };
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123', 'password123'];
    if (weakPasswords.includes(password.toLowerCase())) {
        return { isValid: false, error: 'Password is too common. Please choose a stronger password.' };
    }

    // Determine password strength
    let strength = 'weak';
    if (PASSWORD_STRONG_REGEX.test(password)) {
        strength = 'strong';
    } else if (PASSWORD_MEDIUM_REGEX.test(password)) {
        strength = 'medium';
    }

    if (requiredStrength === 'strong' && strength !== 'strong') {
        return { 
            isValid: false, 
            error: 'Password must contain at least: 8 characters, uppercase, lowercase, number, and special character',
            strength 
        };
    }

    if (requiredStrength === 'medium' && strength === 'weak') {
        return { 
            isValid: false, 
            error: 'Password must contain at least 6 characters with letters and numbers',
            strength 
        };
    }

    return { isValid: true, strength };
};

// =============================================
// PHONE VALIDATION
// =============================================

/**
 * Egyptian Phone Number Regex
 * - Starts with +20, 0020, or 0
 * - Followed by 10, 11, 12, or 15 (carrier codes)
 * - Then 8 digits
 */
const EGYPT_PHONE_REGEX = /^(?:\+20|0020|0)?(1[0125])\d{8}$/;

/**
 * International Phone Regex (E.164 format)
 */
const INTL_PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

/**
 * Validate phone number
 * @param {string} phone 
 * @param {string} country - 'EG' for Egypt, 'INTL' for international
 * @returns {object} { isValid, error, normalized }
 */
const validatePhone = (phone, country = 'EG') => {
    if (!phone || typeof phone !== 'string') {
        return { isValid: false, error: 'Phone number is required' };
    }

    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    if (country === 'EG') {
        if (!EGYPT_PHONE_REGEX.test(cleaned)) {
            return { isValid: false, error: 'Invalid Egyptian phone number. Format: 01xxxxxxxxx' };
        }
        // Normalize to +20 format
        let normalized = cleaned;
        if (cleaned.startsWith('0020')) {
            normalized = '+20' + cleaned.slice(4);
        } else if (cleaned.startsWith('0')) {
            normalized = '+20' + cleaned.slice(1);
        } else if (!cleaned.startsWith('+')) {
            normalized = '+20' + cleaned;
        }
        return { isValid: true, normalized };
    }

    if (!INTL_PHONE_REGEX.test(cleaned)) {
        return { isValid: false, error: 'Invalid phone number format' };
    }

    return { isValid: true, normalized: cleaned.startsWith('+') ? cleaned : '+' + cleaned };
};

// =============================================
// NAME VALIDATION
// =============================================

/**
 * Name Regex
 * - Arabic and English letters
 * - Spaces, hyphens, apostrophes allowed
 * - 2-50 characters
 */
const NAME_REGEX = /^[\u0600-\u06FFa-zA-Z\s'\-]{2,50}$/;

/**
 * Validate name (first name or last name)
 * @param {string} name 
 * @returns {object} { isValid, error, sanitized }
 */
const validateName = (name) => {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Name is required' };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
        return { isValid: false, error: 'Name must be at least 2 characters' };
    }

    if (trimmed.length > 50) {
        return { isValid: false, error: 'Name is too long (max 50 characters)' };
    }

    if (!NAME_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    // Sanitize: remove extra spaces
    const sanitized = trimmed.replace(/\s+/g, ' ');

    return { isValid: true, sanitized };
};

// =============================================
// INPUT SANITIZATION
// =============================================

/**
 * Sanitize string input to prevent XSS
 * @param {string} input 
 * @returns {string} sanitized string
 */
const sanitizeString = (input) => {
    if (!input || typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

/**
 * Sanitize object - sanitize all string values
 * @param {object} obj 
 * @returns {object} sanitized object
 */
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return {};
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

// =============================================
// COUPON CODE VALIDATION
// =============================================

const COUPON_REGEX = /^[A-Z0-9]{3,20}$/;

const validateCouponCode = (code) => {
    if (!code || typeof code !== 'string') {
        return { isValid: false, error: 'Coupon code is required' };
    }

    const normalized = code.trim().toUpperCase();

    if (!COUPON_REGEX.test(normalized)) {
        return { isValid: false, error: 'Invalid coupon code format (3-20 alphanumeric characters)' };
    }

    return { isValid: true, normalized };
};

// =============================================
// URL VALIDATION
// =============================================

const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

const validateURL = (url) => {
    if (!url || typeof url !== 'string') {
        return { isValid: false, error: 'URL is required' };
    }

    const trimmed = url.trim();

    if (!URL_REGEX.test(trimmed)) {
        return { isValid: false, error: 'Invalid URL format' };
    }

    return { isValid: true, value: trimmed };
};

// =============================================
// EXPORTS
// =============================================

module.exports = {
    // Regex patterns (for frontend use)
    patterns: {
        EMAIL: EMAIL_REGEX.source,
        PASSWORD_STRONG: PASSWORD_STRONG_REGEX.source,
        PASSWORD_MEDIUM: PASSWORD_MEDIUM_REGEX.source,
        PHONE_EGYPT: EGYPT_PHONE_REGEX.source,
        PHONE_INTL: INTL_PHONE_REGEX.source,
        NAME: NAME_REGEX.source,
        COUPON: COUPON_REGEX.source,
        URL: URL_REGEX.source
    },
    // Validators
    validateEmail,
    validatePassword,
    validatePhone,
    validateName,
    validateCouponCode,
    validateURL,
    // Sanitizers
    sanitizeString,
    sanitizeObject
};
