/**
 * Lightweight HTTP request logger middleware
 * Logs timestamp, HTTP method, URL path, response status, and duration in ms.
 * Excludes sensitive data (passwords, tokens, authorization headers).
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const method = req.method;
        const url = req.originalUrl || req.url;

        // Visual status indicator
        let statusBadge = '🟢';
        if (status >= 500) statusBadge = '🔴';
        else if (status >= 400) statusBadge = '🟡';
        else if (status >= 300) statusBadge = '🔵';

        console.log(`[${timestamp}] ${statusBadge} ${method} ${url} ${status} - ${duration}ms`);
    });

    next();
}

module.exports = requestLogger;
