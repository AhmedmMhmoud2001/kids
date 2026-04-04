const express = require('express');
const router = express.Router();
const { patterns } = require('../../utils/validators');
const { checkEmailDomain } = require('../../utils/disposableEmails');
const { validateEmail } = require('../../utils/validators');

/**
 * GET /api/auth/validation-rules
 * Returns validation patterns for frontend use
 */
router.get('/validation-rules', (req, res) => {
    res.json({
        success: true,
        data: {
            patterns,
            rules: {
                email: {
                    minLength: 5,
                    maxLength: 254
                },
                password: {
                    minLength: 6,
                    maxLength: 128,
                    requirements: {
                        medium: 'At least 6 characters with letters and numbers',
                        strong: 'At least 8 characters with uppercase, lowercase, number, and special character'
                    }
                },
                name: {
                    minLength: 2,
                    maxLength: 50
                },
                phone: {
                    egypt: {
                        format: '01XXXXXXXXX',
                        example: '01012345678'
                    }
                }
            }
        }
    });
});

/**
 * POST /api/auth/check-email
 * Check if email is valid and not disposable
 */
router.post('/check-email', (req, res) => {
    const { email } = req.body;

    // Validate format
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
        return res.json({
            success: false,
            isValid: false,
            error: emailResult.error
        });
    }

    // Check domain
    const domainCheck = checkEmailDomain(emailResult.value);

    res.json({
        success: true,
        isValid: !domainCheck.isDisposable,
        email: emailResult.value,
        domain: domainCheck.domain,
        isDisposable: domainCheck.isDisposable,
        isFreeEmail: domainCheck.isFreeEmail,
        warning: domainCheck.isSuspicious ? 'This email domain looks suspicious' : null
    });
});

module.exports = router;
