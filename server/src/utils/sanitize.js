/**
 * Request Input Sanitization Utilities
 * Protects against Cross-Site Scripting (XSS), script tag injection, and dangerous HTML constructs.
 */

/**
 * Escapes HTML control characters (&, <, >, ", ')
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Strips script tags, iframes, inline event handlers, and javascript pseudo-protocol
 * @param {string} str
 * @returns {string}
 */
function stripHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        // Remove script tags and content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove iframe tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove object / embed tags
        .replace(/<(object|embed|applet)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
        // Remove javascript: URI protocols
        .replace(/javascript:[^"'\s]*/gi, '')
        // Remove inline event handlers (e.g. onerror=..., onclick=...)
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^>\s]+/gi, '');
}

/**
 * Clean and normalize a string by stripping dangerous scripts and trimming
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return stripHtml(str).trim();
}

/**
 * Recursively sanitize string values in an object or array
 * @param {any} input
 * @returns {any}
 */
function sanitizeObject(input) {
    if (input === null || input === undefined) return input;
    if (typeof input === 'string') return sanitizeString(input);
    if (Array.isArray(input)) return input.map(sanitizeObject);
    if (typeof input === 'object') {
        const cleaned = {};
        for (const [key, val] of Object.entries(input)) {
            cleaned[key] = sanitizeObject(val);
        }
        return cleaned;
    }
    return input;
}

module.exports = {
    escapeHtml,
    stripHtml,
    sanitizeString,
    sanitizeObject
};
