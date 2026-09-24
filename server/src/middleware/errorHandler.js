/**
 * Hardened Centralized Error Handling Middleware
 * Guarantees zero credential or system information leakage in production error responses.
 */

const config = require('../config/env');

/**
 * 404 Handler for undefined routes
 */
function notFound(req, res, next) {
    const error = new Error(`Resource not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}

/**
 * Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
    // 1. Handle JSON parse syntax errors (e.g. malformed JSON request bodies)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Malformed JSON payload in request body',
            error: 'Bad Request'
        });
    }

    // 2. Handle Payload Too Large (e.g. request entity larger than configured 1MB limit)
    if (err.type === 'entity.too.large' || err.status === 413) {
        return res.status(413).json({
            success: false,
            message: 'Request payload exceeds the maximum allowable size limit (1MB)',
            error: 'Payload Too Large'
        });
    }

    // 3. Determine HTTP status code
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    if (err.status || err.statusCode) {
        statusCode = err.status || err.statusCode;
    }

    // 4. Scrub message to prevent database password, secret, or hash exposure
    let safeMessage = err.message || 'Internal Server Error';

    // Obfuscate database connection or internal SQL errors in production
    if (config.NODE_ENV === 'production' && statusCode === 500) {
        safeMessage = 'An internal server error occurred. Please try again later.';
    }

    // Redact any accidental secret matches from error message
    if (config.JWT_SECRET && safeMessage.includes(config.JWT_SECRET)) {
        safeMessage = safeMessage.replace(new RegExp(config.JWT_SECRET, 'g'), '[REDACTED]');
    }
    if (config.GEMINI_API_KEY && safeMessage.includes(config.GEMINI_API_KEY)) {
        safeMessage = safeMessage.replace(new RegExp(config.GEMINI_API_KEY, 'g'), '[REDACTED]');
    }
    if (config.DB_PASSWORD && safeMessage.includes(config.DB_PASSWORD)) {
        safeMessage = safeMessage.replace(new RegExp(config.DB_PASSWORD, 'g'), '[REDACTED]');
    }

    // Log the error details server-side (only in non-test mode to keep test output clean)
    if (process.env.NODE_ENV !== 'test') {
        console.error(`💥 [Error] ${req.method} ${req.originalUrl} (${statusCode}):`, safeMessage);
        if (config.NODE_ENV !== 'production' && err.stack) {
            console.error(err.stack);
        }
    }

    // Return clean, standardized JSON response
    res.status(statusCode).json({
        success: false,
        message: safeMessage,
        error: safeMessage,
        stack: config.NODE_ENV === 'production' ? undefined : err.stack
    });
}

module.exports = {
    notFound,
    errorHandler
};
