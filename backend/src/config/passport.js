const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcrypt');
const prisma = require('./db');
const { generateToken } = require('../utils/jwt');
const { generateSecurePassword } = require('../utils/security');

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Helper function to find or create user from OAuth
const findOrCreateOAuthUser = async (profile, provider) => {
    const email = profile.emails?.[0]?.value;
    
    if (!email) {
        throw new Error('Email not provided by ' + provider);
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        // User exists, update last login info
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                emailVerified: true // OAuth emails are verified
            }
        });
        return user;
    }

    // Create new user with secure random password
    const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
    const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
    const image = profile.photos?.[0]?.value || null;
    
    // Generate a secure random password (user can reset if they want to login with password)
    const randomPassword = generateSecurePassword(32);
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword, // Secure hashed password for OAuth users
            firstName,
            lastName,
            image,
            role: 'CUSTOMER',
            emailVerified: true, // OAuth emails are already verified
            oauthProvider: provider // Track OAuth provider
        }
    });

    return user;
};

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateOAuthUser(profile, 'Google');
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    }));
}

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name', 'displayName', 'photos']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateOAuthUser(profile, 'Facebook');
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    }));
}

module.exports = passport;
