/**
 * In-Memory Sliding-Window Rate Limiting Middleware
 * Prevents brute-force authentication, denial of service, and API flooding.
 */

const securityConfig = require('../config/security');

/**
 * Creates an Express rate-limiting middleware instance
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Max allowed requests within window
 * @param {string} options.message - Error message when rate limit exceeded
 * @param {Function} [options.keyGenerator] - Custom key generator function (default: IP)
 * @param {number} [options.minIntervalMs] - Optional throttle interval between consecutive calls
 */
function createRateLimiter(options) {
    const {
        windowMs,
        maxRequests,
        message,
        keyGenerator = (req) => req.ip || req.connection.remoteAddress || '127.0.0.1',
        minIntervalMs = 0
    } = options;

    // In-memory store: key -> array of timestamps
    const hits = new Map();

    // Periodic cleanup of stale entries every 2 minutes
    const cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, timestamps] of hits.entries()) {
            const fresh = timestamps.filter(t => now - t < windowMs);
            if (fresh.length === 0) {
                hits.delete(key);
            } else {
                hits.set(key, fresh);
            }
        }
    }, 2 * 60 * 1000);

    // Prevent cleanup timer from keeping test processes alive
    if (cleanupTimer.unref) cleanupTimer.unref();

    return function rateLimiter(req, res, next) {
        const key = keyGenerator(req);
        const now = Date.now();
        const timestamps = hits.get(key) || [];

        // Retain only requests within the active sliding window
        const windowStart = now - windowMs;
        const recentTimestamps = timestamps.filter(t => t > windowStart);

        // Check optional minimum interval (e.g. 300ms anti-burst throttle for AI chat)
        if (minIntervalMs > 0 && recentTimestamps.length > 0) {
            const lastTime = recentTimestamps[recentTimestamps.length - 1];
            if (now - lastTime < minIntervalMs) {
                res.setHeader('Retry-After', Math.ceil(minIntervalMs / 1000));
                return res.status(429).json({
                    success: false,
                    message: 'You are sending requests too quickly. Please pause a moment.',
                    error: 'Too Many Requests'
                });
            }
        }

        // Check if rate limit threshold exceeded
        if (recentTimestamps.length >= maxRequests) {
            const oldestInWindow = recentTimestamps[0];
            const retryAfterSec = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));

            res.setHeader('Retry-After', retryAfterSec);
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', Math.ceil((oldestInWindow + windowMs) / 1000));

            return res.status(429).json({
                success: false,
                message: message || 'Too many requests. Please try again later.',
                error: 'Too Many Requests'
            });
        }

        // Record current request
        recentTimestamps.push(now);
        hits.set(key, recentTimestamps);

        // Attach rate limit telemetry headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - recentTimestamps.length));

        next();
    };
}

// 1. Login rate limiter: max 15 requests per minute per IP
const loginLimiter = createRateLimiter({
    windowMs: securityConfig.rateLimits.login.windowMs,
    maxRequests: securityConfig.rateLimits.login.maxRequests,
    message: securityConfig.rateLimits.login.message,
    keyGenerator: (req) => `login_${req.ip || '127.0.0.1'}`
});

// 2. AI Chat rate limiter: max 20 requests per minute per student, 300ms interval
const aiChatLimiter = createRateLimiter({
    windowMs: securityConfig.rateLimits.aiChat.windowMs,
    maxRequests: securityConfig.rateLimits.aiChat.maxRequests,
    minIntervalMs: securityConfig.rateLimits.aiChat.minIntervalMs,
    message: securityConfig.rateLimits.aiChat.message,
    keyGenerator: (req) => `aichat_${req.user?.id || req.ip || 'anon'}`
});

// 3. Study Plan generation limiter: max 5 requests per 5 minutes per student
const studyPlanLimiter = createRateLimiter({
    windowMs: securityConfig.rateLimits.studyPlan.windowMs,
    maxRequests: securityConfig.rateLimits.studyPlan.maxRequests,
    message: securityConfig.rateLimits.studyPlan.message,
    keyGenerator: (req) => `studyplan_${req.user?.id || req.ip || 'anon'}`
});

// 4. Sensitive Admin / Lecturer mutation limiter: max 30 requests per minute
const mutationLimiter = createRateLimiter({
    windowMs: securityConfig.rateLimits.sensitiveMutations.windowMs,
    maxRequests: securityConfig.rateLimits.sensitiveMutations.maxRequests,
    message: securityConfig.rateLimits.sensitiveMutations.message,
    keyGenerator: (req) => `mutation_${req.user?.id || req.ip || 'anon'}`
});

module.exports = {
    createRateLimiter,
    loginLimiter,
    aiChatLimiter,
    studyPlanLimiter,
    mutationLimiter
};
