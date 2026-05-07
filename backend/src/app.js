const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const routes = require('./routes');
const AppError = require('./utils/AppError');
const categoryService = require('./modules/categories/categories.service');
const productService = require('./modules/products/products.service');
const { csrfProtection } = require('./utils/security');

const app = express();

// Trust proxy (required for Heroku, Vercel, Nginx, etc.)
app.set('trust proxy', 1);

// ========================================
// Security Middlewares
// ========================================

// Helmet - Set security HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from other domains
    contentSecurityPolicy: false // Disable CSP for API
}));

// CORS Configuration
// Production: Dashboard https://fullstack-kids.vercel.app | Frontend https://kids-co-backlog.vercel.app
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean).length
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
        'https://tovo-b.developteam.site',
        'https://kids-mu-nine.vercel.app',
        'https://kidsfrontend.vercel.app'
    ];

const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? allowedOrigins
        : (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    credentials: true,
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));
// Ensure caches are aware of varying origins for CORS responses
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

// Rate Limiting (optional). Set RATE_LIMIT_DISABLED=true for no global API cap per IP.
// AUTH_RATE_LIMIT_DISABLED=true removes the tighter cap on POST /auth/login only.
const parsePositiveInt = (value, fallback) => {
    const n = parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
};
const rateLimitDisabled =
    process.env.RATE_LIMIT_DISABLED === 'true' ||
    process.env.RATE_LIMIT_DISABLED === '1';
const authRateLimitDisabled =
    process.env.AUTH_RATE_LIMIT_DISABLED === 'true' ||
    process.env.AUTH_RATE_LIMIT_DISABLED === '1';

const rateLimitWindowMs = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const rateLimitMax = parsePositiveInt(process.env.RATE_LIMIT_MAX, 1000);

const limiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health check
        return req.path === '/api/health' || req.path === '/kids/api/health';
    }
});
if (!rateLimitDisabled) {
    app.use('/api', limiter);
    app.use('/kids/api', limiter);
}

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutes
    max: 10, // 10 attempts per 3 minutes
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 3 minutes.',
        code: 'AUTH_RATE_LIMIT'
    }
});
if (!authRateLimitDisabled) {
    app.use('/api/auth/login', authLimiter);
    app.use('/kids/api/auth/login', authLimiter);
}

// ========================================
// Performance Middlewares
// ========================================

// Compression - Gzip responses
app.use(compression({
    level: 6, // Compression level (1-9)
    threshold: 1024, // Only compress if size > 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// ========================================
// Logging
// ========================================

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // Custom production format
    app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));
}

// ========================================
// Body Parsers
// ========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// Cookie Parser
// ========================================

app.use(cookieParser(process.env.COOKIE_SECRET || 'your-cookie-secret'));

// ========================================
// CSRF Protection (for state-changing operations)
// ========================================

// Enable CSRF protection in production
if (process.env.NODE_ENV === 'production') {
    app.use(csrfProtection);
}

// ========================================
// Passport (Authentication)
// ========================================

app.use(passport.initialize());

// ========================================
// Static Files
// ========================================

app.use('/uploads', express.static('uploads', {
    maxAge: '7d', // Cache static files for 7 days
    etag: true
}));

// ========================================
// Shop (combined categories + products for storefront)
// ========================================

app.get('/shop', async (req, res, next) => {
    try {
        const audience = req.query.audience || null;
        const [categories, products] = await Promise.all([
            categoryService.findAll(audience),
            productService.findAll({ audience: audience || undefined, isActive: true })
        ]);
        res.json({ success: true, data: { categories, products } });
    } catch (err) {
        next(err);
    }
});

const { swaggerUi, swaggerDocs } = require('./config/swagger');

// ========================================
// API Documentation
// ========================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
    swaggerOptions: {
        persistAuthorization: true
    },
    customSiteTitle: 'Kids & Co API Docs'
}));

// ========================================
// API Routes
// ========================================

app.use('/api', routes);
app.use('/kids/api', routes);

// ========================================
// 404 Handler
// ========================================

app.use((req, res, next) => {
    next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
});

// ========================================
// Global Error Handler
// ========================================

app.use((err, req, res, next) => {
    // Default values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    } else {
        // In production, only log non-operational errors
        if (!err.isOperational) {
            console.error('UNEXPECTED ERROR:', err);
        }
    }

    // Prisma Error Handling
    if (err.code === 'P2002') {
        err.message = 'Duplicate field value. This record already exists.';
        err.statusCode = 409;
    }
    if (err.code === 'P2025') {
        err.message = 'Record not found.';
        err.statusCode = 404;
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        err.message = 'Invalid token. Please log in again.';
        err.statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
        err.message = 'Token expired. Please log in again.';
        err.statusCode = 401;
    }

    // Validation Errors
    if (err.name === 'ValidationError') {
        err.statusCode = 400;
    }

    // Response
    const response = {
        success: false,
        message: err.message,
        ...(err.code && { code: err.code })
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
});

// Debug endpoint to inspect cookies sent by the client (development only)
app.get('/debug/cookies', (req, res) => {
  res.json({ headerCookie: req.headers.cookie || null, cookies: req.cookies || {} });
});

module.exports = app;
