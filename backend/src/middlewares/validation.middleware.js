/**
 * Validation Middleware
 * Uses validators to check and sanitize request data
 */

const { 
    validateEmail, 
    validatePassword, 
    validatePhone, 
    validateName,
    sanitizeObject 
} = require('../utils/validators');
const { shouldBlockEmail } = require('../utils/disposableEmails');

/**
 * Validate registration data
 */
const validateRegistration = (req, res, next) => {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate email
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
        return res.status(400).json({
            success: false,
            field: 'email',
            message: emailResult.error
        });
    }

    // Check for disposable email
    const emailCheck = shouldBlockEmail(emailResult.value);
    if (emailCheck.shouldBlock) {
        return res.status(400).json({
            success: false,
            field: 'email',
            message: emailCheck.reason
        });
    }

    // Validate password
    const passwordResult = validatePassword(password, 'medium');
    if (!passwordResult.isValid) {
        return res.status(400).json({
            success: false,
            field: 'password',
            message: passwordResult.error
        });
    }

    // Validate first name (if provided)
    if (firstName) {
        const firstNameResult = validateName(firstName);
        if (!firstNameResult.isValid) {
            return res.status(400).json({
                success: false,
                field: 'firstName',
                message: firstNameResult.error
            });
        }
        req.body.firstName = firstNameResult.sanitized;
    }

    // Validate last name (if provided)
    if (lastName) {
        const lastNameResult = validateName(lastName);
        if (!lastNameResult.isValid) {
            return res.status(400).json({
                success: false,
                field: 'lastName',
                message: lastNameResult.error
            });
        }
        req.body.lastName = lastNameResult.sanitized;
    }

    // Validate phone (if provided)
    if (phone) {
        const phoneResult = validatePhone(phone, 'EG');
        if (!phoneResult.isValid) {
            return res.status(400).json({
                success: false,
                field: 'phone',
                message: phoneResult.error
            });
        }
        req.body.phone = phoneResult.normalized;
    }

    // Normalize email
    req.body.email = emailResult.value;

    next();
};

/**
 * Validate login data
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    // Basic presence check
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    // Validate email format
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
        return res.status(400).json({
            success: false,
            field: 'email',
            message: emailResult.error
        });
    }

    // Normalize email
    req.body.email = emailResult.value;

    next();
};

/**
 * Validate email verification code
 */
const validateVerificationCode = (req, res, next) => {
    const { email, code } = req.body;

    // Validate email
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
        return res.status(400).json({
            success: false,
            field: 'email',
            message: emailResult.error
        });
    }

    // Validate code format (6 digits)
    if (!code || !/^\d{6}$/.test(code)) {
        return res.status(400).json({
            success: false,
            field: 'code',
            message: 'Invalid verification code format (must be 6 digits)'
        });
    }

    req.body.email = emailResult.value;
    next();
};

/**
 * Validate password reset request
 */
const validateForgotPassword = (req, res, next) => {
    const { email } = req.body;

    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
        return res.status(400).json({
            success: false,
            field: 'email',
            message: emailResult.error
        });
    }

    req.body.email = emailResult.value;
    next();
};

/**
 * Validate new password
 */
const validateResetPassword = (req, res, next) => {
    const { token, password } = req.body;

    if (!token) {
        return res.status(400).json({
            success: false,
            field: 'token',
            message: 'Reset token is required'
        });
    }

    const passwordResult = validatePassword(password, 'medium');
    if (!passwordResult.isValid) {
        return res.status(400).json({
            success: false,
            field: 'password',
            message: passwordResult.error
        });
    }

    next();
};

/**
 * Validate profile update data
 */
const validateProfileUpdate = (req, res, next) => {
    const { firstName, lastName, phone, password } = req.body;

    // Validate first name (if provided)
    if (firstName !== undefined) {
        const result = validateName(firstName);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                field: 'firstName',
                message: result.error
            });
        }
        req.body.firstName = result.sanitized;
    }

    // Validate last name (if provided)
    if (lastName !== undefined) {
        const result = validateName(lastName);
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                field: 'lastName',
                message: result.error
            });
        }
        req.body.lastName = result.sanitized;
    }

    // Validate phone (if provided)
    if (phone !== undefined && phone !== '') {
        const result = validatePhone(phone, 'EG');
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                field: 'phone',
                message: result.error
            });
        }
        req.body.phone = result.normalized;
    }

    // Validate new password (if provided)
    if (password) {
        const result = validatePassword(password, 'medium');
        if (!result.isValid) {
            return res.status(400).json({
                success: false,
                field: 'password',
                message: result.error
            });
        }
    }

    // Sanitize other string fields
    req.body = sanitizeObject(req.body);

    next();
};

/**
 * General input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateVerificationCode,
    validateForgotPassword,
    validateResetPassword,
    validateProfileUpdate,
    sanitizeInput
};
