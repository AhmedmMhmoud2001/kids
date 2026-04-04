/**
 * Custom Application Error Class
 * Extends Error with additional properties for better error handling
 */
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = 'Bad Request', code = 'BAD_REQUEST') {
        return new AppError(message, 400, code);
    }

    static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
        return new AppError(message, 401, code);
    }

    static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
        return new AppError(message, 403, code);
    }

    static notFound(message = 'Not Found', code = 'NOT_FOUND') {
        return new AppError(message, 404, code);
    }

    static conflict(message = 'Conflict', code = 'CONFLICT') {
        return new AppError(message, 409, code);
    }

    static tooManyRequests(message = 'Too Many Requests', code = 'RATE_LIMIT') {
        return new AppError(message, 429, code);
    }

    static internal(message = 'Internal Server Error', code = 'INTERNAL_ERROR') {
        return new AppError(message, 500, code);
    }
}

module.exports = AppError;
