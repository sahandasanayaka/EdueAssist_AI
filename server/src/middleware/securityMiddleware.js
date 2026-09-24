/**
 * Security Headers Middleware
 * Protects against MIME sniffing, clickjacking, cross-site leaks, and unsafe frame inclusion.
 */

const securityConfig = require('../config/security');

function securityHeaders(req, res, next) {
    // 1. Prevent browser MIME-sniffing away from declared Content-Type
    res.setHeader('X-Content-Type-Options', securityConfig.headers.contentTypeOptions);

    // 2. Prevent clickjacking by forbidding embedding in frames/iframes
    res.setHeader('X-Frame-Options', securityConfig.headers.frameOptions);

    // 3. Disable legacy XSS auditor in modern browsers (modern standard is CSP)
    res.setHeader('X-XSS-Protection', securityConfig.headers.xssProtection);

    // 4. Control referrer leakage across cross-origin boundaries
    res.setHeader('Referrer-Policy', securityConfig.headers.referrerPolicy);

    // 5. Restrict resource loading to secure, self-hosted and approved CDNs
    res.setHeader('Content-Security-Policy', securityConfig.headers.contentSecurityPolicy);

    // 6. Cross-Origin policies
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // 7. Prevent Adobe Flash / PDF cross-domain policy file exploits
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // 8. Control DNS prefetching
    res.setHeader('X-DNS-Prefetch-Control', 'off');

    // 9. Hide technology stack fingerprinting
    res.removeHeader('X-Powered-By');

    next();
}

module.exports = securityHeaders;
