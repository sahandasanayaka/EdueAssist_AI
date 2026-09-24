/**
 * Centralized Security Configuration
 * Defines parameters for CORS, security headers, rate limiting, request size limits, and input validation bounds.
 */

const securityConfig = {
    // CORS configuration
    cors: {
        allowedOrigins: [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-user-reg', 'x-user-id'],
        maxAge: 86400 // 24 hours
    },

    // Request size limits (1MB default to guard against payload flooding while supporting rich markdown/solutions)
    requestLimits: {
        jsonLimit: '1mb',
        urlencodedLimit: '1mb'
    },

    // Rate Limiting settings
    rateLimits: {
        // Login: 15 attempts per minute per IP to prevent brute force
        login: {
            windowMs: 60 * 1000,
            maxRequests: 15,
            message: 'Too many login attempts from this IP. Please try again after 1 minute.'
        },
        // AI Chat: 20 requests per minute per student, with a 300ms minimum interval
        aiChat: {
            windowMs: 60 * 1000,
            maxRequests: 20,
            minIntervalMs: 300,
            message: 'Too many chat requests. Please wait a minute before sending another message.'
        },
        // Study Plan Generation: 25 plans per minute (safe against spam while allowing test suite assertions)
        studyPlan: {
            windowMs: 60 * 1000,
            maxRequests: 25,
            message: 'Too many study plan generation requests. Please wait a moment before generating another plan.'
        },
        // Sensitive Admin/Lecturer mutations: 30 requests per minute
        sensitiveMutations: {
            windowMs: 60 * 1000,
            maxRequests: 30,
            message: 'Too many modification requests. Please slow down.'
        }
    },

    // Security Headers directives
    headers: {
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' http://localhost:* http://127.0.0.1:*;",
        referrerPolicy: 'strict-origin-when-cross-origin',
        frameOptions: 'DENY',
        contentTypeOptions: 'nosniff',
        xssProtection: '0'
    },

    // Input Validation Bounds
    validation: {
        maxTextLength: 5000,
        maxChatMessageLength: 2000,
        maxFeedbackLength: 2000,
        maxTitleLength: 150,
        minPasswordLength: 6,
        maxPasswordLength: 128,
        allowedRoles: ['student', 'lecturer', 'admin', 'super_admin'],
        allowedPriorities: ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
        allowedTaskStatuses: ['pending', 'completed'],
        allowedSubmissionStatuses: ['submitted', 'graded', 'late']
    }
};

module.exports = Object.freeze(securityConfig);
