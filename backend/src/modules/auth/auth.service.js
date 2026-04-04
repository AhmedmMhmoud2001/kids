const prisma = require('../../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail, generateVerificationCode } = require('../../utils/email');
const { syncUserRoleToRbac } = require('../rbac/rbac-sync.service');

const ROLE_REDIRECTS = {
    CUSTOMER: '/',
    ADMIN_KIDS: '/dashboard/kids',
    ADMIN_NEXT: '/dashboard/next',
    SYSTEM_ADMIN: '/dashboard'
};

const AUDIENCE_SCOPES = {
    ADMIN_KIDS: 'kids',
    ADMIN_NEXT: 'next',
    SYSTEM_ADMIN: 'all',
    CUSTOMER: 'public'
};

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

exports.login = async (email, password, ipAddress = null) => {
    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    // 2. Check if account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        const remainingMinutes = Math.ceil((user.lockoutUntil - new Date()) / 60000);
        throw new Error(`Account temporarily locked. Try again in ${remainingMinutes} minutes.`);
    }

    // 3. Check if email is verified (for customers only)
    if (user.role === 'CUSTOMER' && !user.emailVerified) {
        throw new Error('Please verify your email before logging in');
    }

    // 4. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        // Increment failed attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updateData = { failedLoginAttempts: failedAttempts };
        
        // Lock account if max attempts reached
        if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
            updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION);
            updateData.failedLoginAttempts = 0;
        }
        
        await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
            throw new Error('Too many failed attempts. Account locked for 15 minutes.');
        }
        
        throw new Error('Invalid credentials');
    }

    // 5. Reset failed attempts and update last login
    await prisma.user.update({
        where: { id: user.id },
        data: {
            failedLoginAttempts: 0,
            lockoutUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress
        }
    });

    // 6. Determine Redirect Path & Scope
    const redirectPath = ROLE_REDIRECTS[user.role] || '/';
    const audienceScope = AUDIENCE_SCOPES[user.role] || 'public';
    await syncUserRoleToRbac(user.id, user.role, user.id);

    // 7. Generate Access Token (short-lived)
    const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        audience: audienceScope
    };
    
    const token = generateToken(tokenPayload);
    
    // 8. Generate Refresh Token (long-lived)
    const refreshToken = generateRefreshToken({ id: user.id });

    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            role: user.role,
            phone: user.phone,
            address: user.address,
            city: user.city,
            country: user.country,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt
        },
        token,
        refreshToken,
        redirectPath
    };
};

exports.getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            image: true,
            role: true,
            createdAt: true
        }
    });

    if (!user) throw new Error('User not found');
    return user;
};

exports.updateProfile = async (userId, data) => {
    const { firstName, lastName, phone, address, city, country, image, password } = data;

    let updateData = {
        firstName,
        lastName,
        phone,
        address,
        city,
        country,
        image
    };

    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    // Filter out undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            image: true,
            role: true,
            createdAt: true
        }
    });

    return user;
};

/**
 * Register - Step 1: Create pending user and send verification code
 * @param {object} data - { email, password, firstName, lastName }
 * @param {boolean} skipVerification - Skip email verification (for testing)
 */
exports.register = async (data, skipVerification = false) => {
    // 1. Check if user exists
    const existing = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (existing) {
        // If user exists but not verified, resend code
        if (!existing.emailVerified) {
            return await exports.resendVerificationCode(data.email);
        }
        throw new Error('Email already exists');
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 12); // Increased rounds for security

    // 3. Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 4. Hash the verification code for storage
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    // 5. Create User (Not verified yet)
    const user = await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            role: 'CUSTOMER',
            emailVerified: skipVerification,
            verificationCode: hashedCode,
            verificationCodeExpiry: verificationExpiry
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            emailVerified: true
        }
    });

    // 6. Send verification email (unless skipping)
    if (!skipVerification) {
        const userName = data.firstName || data.email.split('@')[0];
        await sendVerificationEmail(data.email, verificationCode, userName);

        return {
            success: true,
            message: 'Verification code sent to your email',
            email: user.email,
            requiresVerification: true
        };
    }

    // 7. If skipping verification, return token directly
    const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        audience: 'public'
    });

    return {
        user,
        token,
        redirectPath: '/'
    };
};

/**
 * Verify Email - Complete registration
 * @param {string} email 
 * @param {string} code - 6-digit verification code
 */
exports.verifyEmail = async (email, code) => {
    // 1. Hash the provided code
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // 2. Find user with matching code that hasn't expired
    const user = await prisma.user.findFirst({
        where: {
            email,
            verificationCode: hashedCode,
            verificationCodeExpiry: {
                gt: new Date()
            }
        }
    });

    if (!user) {
        throw new Error('Invalid or expired verification code');
    }

    if (user.emailVerified) {
        throw new Error('Email already verified');
    }

    // 3. Mark user as verified
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            verificationCode: null,
            verificationCodeExpiry: null
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
        }
    });

    // 4. Generate access token
    const token = generateToken({
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        audience: 'public'
    });
    
    // 5. Generate refresh token
    const refreshToken = generateRefreshToken({ id: updatedUser.id });

    // 6. Send welcome email (non-blocking)
    const userName = updatedUser.firstName || updatedUser.email.split('@')[0];
    sendWelcomeEmail(updatedUser.email, userName).catch(console.error);

    return {
        user: updatedUser,
        token,
        refreshToken,
        redirectPath: '/'
    };
};

/**
 * Resend verification code
 * @param {string} email 
 */
exports.resendVerificationCode = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        // Don't reveal if email exists
        return {
            success: true,
            message: 'If an account exists, a verification code will be sent'
        };
    }

    if (user.emailVerified) {
        throw new Error('Email already verified. Please login.');
    }

    // Rate limiting: Check if code was sent recently (within 1 minute)
    if (user.verificationCodeExpiry) {
        const timeSinceLastCode = Date.now() - (user.verificationCodeExpiry.getTime() - 15 * 60 * 1000);
        if (timeSinceLastCode < 60 * 1000) {
            throw new Error('Please wait before requesting another code');
        }
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    // Update user
    await prisma.user.update({
        where: { id: user.id },
        data: {
            verificationCode: hashedCode,
            verificationCodeExpiry: verificationExpiry
        }
    });

    // Send email
    const userName = user.firstName || email.split('@')[0];
    await sendVerificationEmail(email, verificationCode, userName);

    return {
        success: true,
        message: 'Verification code sent to your email',
        email
    };
};

/**
 * Refresh Token - Get new access token using refresh token
 * @param {string} refreshTokenValue - The refresh token
 */
exports.refreshToken = async (refreshTokenValue) => {
    // 1. Verify refresh token
    const decoded = verifyRefreshToken(refreshTokenValue);
    
    // 2. Find user
    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true,
            emailVerified: true
        }
    });
    
    if (!user) {
        throw new Error('User not found');
    }
    
    // 3. Check if user is still valid (not locked, email verified for customers)
    if (user.role === 'CUSTOMER' && !user.emailVerified) {
        throw new Error('Email not verified');
    }
    
    // 4. Generate new access token
    const audienceScope = AUDIENCE_SCOPES[user.role] || 'public';
    await syncUserRoleToRbac(user.id, user.role, user.id);
    
    const newToken = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        audience: audienceScope
    });
    
    // 5. Generate new refresh token (rotate refresh tokens for security)
    const newRefreshToken = generateRefreshToken({ id: user.id });
    
    return {
        token: newToken,
        refreshToken: newRefreshToken,
        user
    };
};

/**
 * Forgot Password - Generate reset token and send email
 * Security: Always return same message whether email exists or not
 */
exports.forgotPassword = async (email) => {
    // 1. Find user (don't reveal if email exists)
    const user = await prisma.user.findUnique({
        where: { email }
    });

    // If user doesn't exist, return success anyway (security best practice)
    if (!user) {
        return { message: 'If an account exists with this email, a reset link has been sent.' };
    }

    // 2. Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 3. Hash token for storage (store hash, send raw token in email)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // 4. Set expiry (1 hour from now)
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // 5. Save hashed token and expiry to database
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: hashedToken,
            resetTokenExpiry
        }
    });

    // 6. Send email with raw token
    const userName = user.firstName || user.email.split('@')[0];
    await sendPasswordResetEmail(user.email, resetToken, userName);

    return { message: 'If an account exists with this email, a reset link has been sent.' };
};

/**
 * Reset Password - Verify token and update password
 */
exports.resetPassword = async (token, newPassword) => {
    // 1. Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find user with valid token that hasn't expired
    const user = await prisma.user.findFirst({
        where: {
            resetToken: hashedToken,
            resetTokenExpiry: {
                gt: new Date() // Token must not be expired
            }
        }
    });

    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password and clear reset token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        }
    });

    return { message: 'Password has been reset successfully' };
};
