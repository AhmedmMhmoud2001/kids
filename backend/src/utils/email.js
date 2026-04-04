const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter with SMTP settings
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Generate a 6-digit verification code
 * @returns {string} 6-digit code
 */
const generateVerificationCode = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send email verification code
 * @param {string} to - Recipient email
 * @param {string} code - 6-digit verification code
 * @param {string} userName - User's name for personalization
 */
exports.sendVerificationEmail = async (to, code, userName = 'User') => {
    const transporter = createTransporter();
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Kids & Co" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify Your Email - Kids & Co',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #10b981; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Kids & Co</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; text-align: center;">Verify Your Email</h2>
                                        <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6; text-align: center;">
                                            Hi ${userName},
                                        </p>
                                        <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6; text-align: center;">
                                            Use the verification code below to complete your registration:
                                        </p>
                                        
                                        <!-- Verification Code -->
                                        <div style="text-align: center; padding: 30px; background-color: #f0fdf4; border-radius: 12px; margin: 20px 0;">
                                            <p style="margin: 0 0 10px; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
                                            <p style="margin: 0; font-size: 48px; font-weight: bold; color: #10b981; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
                                        </div>
                                        
                                        <p style="margin: 30px 0 10px; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                                            This code will expire in <strong>15 minutes</strong>.
                                        </p>
                                        <p style="margin: 0 0 20px; color: #999999; font-size: 13px; line-height: 1.6; text-align: center;">
                                            If you didn't create an account, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0; color: #999999; font-size: 13px;">
                                            © ${new Date().getFullYear()} Kids & Co. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
        text: `
            Hi ${userName},
            
            Your verification code is: ${code}
            
            This code will expire in 15 minutes.
            
            If you didn't create an account, you can safely ignore this email.
            
            © ${new Date().getFullYear()} Kids & Co
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Send welcome email after successful verification
 * @param {string} to - Recipient email
 * @param {string} userName - User's name
 */
exports.sendWelcomeEmail = async (to, userName = 'User') => {
    const transporter = createTransporter();
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Kids & Co" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Welcome to Kids & Co! 🎉',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Kids & Co</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #3b82f6; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 32px;">🎉</h1>
                                        <h1 style="margin: 10px 0 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to Kids & Co!</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <p style="margin: 0 0 20px; color: #333333; font-size: 18px; line-height: 1.6;">
                                            Hi ${userName},
                                        </p>
                                        <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                                            Thank you for joining Kids & Co! Your account has been verified and you're all set to start shopping.
                                        </p>
                                        
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td align="center" style="padding: 20px 0;">
                                                    <a href="${frontendUrl}" style="display: inline-block; padding: 16px 40px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                                                        Start Shopping
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0; color: #999999; font-size: 13px;">
                                            © ${new Date().getFullYear()} Kids & Co. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
        text: `
            Hi ${userName},
            
            Welcome to Kids & Co!
            
            Your account has been verified and you're all set to start shopping.
            
            Visit us at: ${frontendUrl}
            
            © ${new Date().getFullYear()} Kids & Co
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Welcome email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't throw - welcome email is not critical
        return { success: false, error: error.message };
    }
};

// Export the generator function
exports.generateVerificationCode = generateVerificationCode;

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetToken - The raw reset token (not hashed)
 * @param {string} userName - User's name for personalization
 */
exports.sendPasswordResetEmail = async (to, resetToken, userName = 'User') => {
    const transporter = createTransporter();
    
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Kids & Co" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Reset Your Password - Kids & Co',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td align="center" style="padding: 40px 0;">
                            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center; background-color: #3b82f6; border-radius: 8px 8px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Kids & Co</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Reset Your Password</h2>
                                        <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                                            Hi ${userName},
                                        </p>
                                        <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                                            We received a request to reset your password. Click the button below to create a new password:
                                        </p>
                                        
                                        <!-- Button -->
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td align="center" style="padding: 20px 0;">
                                                    <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                                                        Reset Password
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 30px 0 10px; color: #666666; font-size: 14px; line-height: 1.6;">
                                            This link will expire in <strong>1 hour</strong>.
                                        </p>
                                        <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6;">
                                            If you didn't request a password reset, you can safely ignore this email.
                                        </p>
                                        
                                        <!-- Fallback Link -->
                                        <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                                            <p style="margin: 0 0 10px; color: #666666; font-size: 13px;">
                                                If the button doesn't work, copy and paste this link into your browser:
                                            </p>
                                            <p style="margin: 0; word-break: break-all;">
                                                <a href="${resetLink}" style="color: #3b82f6; font-size: 13px;">${resetLink}</a>
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                                        <p style="margin: 0; color: #999999; font-size: 13px;">
                                            © ${new Date().getFullYear()} Kids & Co. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
        text: `
            Hi ${userName},
            
            We received a request to reset your password.
            
            Click the link below to create a new password:
            ${resetLink}
            
            This link will expire in 1 hour.
            
            If you didn't request a password reset, you can safely ignore this email.
            
            © ${new Date().getFullYear()} Kids & Co
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};
