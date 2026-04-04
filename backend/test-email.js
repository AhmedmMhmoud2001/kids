/**
 * Test Email Sending
 * Run: node test-email.js your-email@example.com
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    const testTo = process.argv[2];
    
    if (!testTo) {
        console.log('Usage: node test-email.js your-email@example.com');
        process.exit(1);
    }

    console.log('📧 Email Configuration:');
    console.log('   SMTP Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('   SMTP Port:', process.env.SMTP_PORT || 587);
    console.log('   Email User:', process.env.EMAIL_USER);
    console.log('   Email Pass:', process.env.EMAIL_PASS ? '****' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
    console.log('');

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    console.log('🔄 Testing connection...');
    
    try {
        await transporter.verify();
        console.log('✅ SMTP Connection successful!\n');
    } catch (error) {
        console.error('❌ SMTP Connection failed:', error.message);
        console.log('\n📌 Troubleshooting:');
        console.log('   1. Make sure 2-Step Verification is enabled in Google Account');
        console.log('   2. Generate an App Password: https://myaccount.google.com/apppasswords');
        console.log('   3. Use the App Password (16 characters) instead of your regular password');
        process.exit(1);
    }

    console.log(`📤 Sending test email to: ${testTo}`);
    
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || `"Kids & Co" <${process.env.EMAIL_USER}>`,
            to: testTo,
            subject: 'Test Email from Kids & Co',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #10b981;">✅ Email Test Successful!</h1>
                    <p>This is a test email from your Kids & Co backend.</p>
                    <p>If you received this email, your SMTP configuration is working correctly.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 12px;">
                        Sent at: ${new Date().toISOString()}<br>
                        From: ${process.env.EMAIL_USER}
                    </p>
                </div>
            `,
            text: `Test Email - This is a test from Kids & Co backend. Sent at: ${new Date().toISOString()}`
        });

        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('\n📬 Check your inbox (and spam folder)!');
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        
        if (error.code === 'EAUTH') {
            console.log('\n📌 Authentication Error:');
            console.log('   Your email credentials are incorrect.');
            console.log('   For Gmail, you need an App Password, not your regular password.');
            console.log('   Generate one here: https://myaccount.google.com/apppasswords');
        }
    }
};

testEmail();
