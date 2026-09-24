/**
 * EduAssistAI Phase 6 Complete Authentication & Security Verification Suite
 */
process.env.NODE_ENV = 'test';
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./server');
const config = require('./src/config/env');

let server;
let baseUrl;

async function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed, headers: res.headers });
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runPhase6Tests() {
    console.log('====================================================');
    console.log('   EDUASSIST AI - PHASE 6 AUTHENTICATION SUITE     ');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(name, condition, detail = '') {
        if (condition) {
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${name} ${detail ? '(' + detail + ')' : ''}`);
            failed++;
        }
    }

    const testPort = 5198;
    server = app.listen(testPort);
    baseUrl = `http://localhost:${testPort}`;

    let studentToken = null;
    let lecturerToken = null;
    let adminToken = null;

    try {
        // ==========================================
        // 1. CREDENTIAL VALIDATION & LOGIN FLOW
        // ==========================================
        console.log('\n[1. Credential Validation & Login Flow]');

        // 1a. Student login
        const sLogin = await request('POST', '/api/auth/login', { username: '2023CSCA001', password: 'password123' });
        assert('Valid student login succeeds (200)', sLogin.status === 200);
        assert('Token returned in student login response', !!sLogin.data.token);
        assert('User role in login response is student', sLogin.data.user?.role === 'student');
        assert('Password hash never returned in student login', sLogin.data.user?.password_hash === undefined);
        assert('Password plain text never returned in student login', sLogin.data.user?.password === undefined);
        studentToken = sLogin.data.token;

        // 1b. Lecturer login
        const lLogin = await request('POST', '/api/auth/login', { username: 'Lec001', password: 'password123' });
        assert('Valid lecturer login succeeds (200)', lLogin.status === 200);
        assert('User role in login response is lecturer', lLogin.data.user?.role === 'lecturer');
        lecturerToken = lLogin.data.token;

        // 1c. Admin login
        const aLogin = await request('POST', '/api/auth/login', { username: 'admin01', password: 'password123' });
        assert('Valid admin login succeeds (200)', aLogin.status === 200);
        assert('User role in login response is admin', aLogin.data.user?.role === 'admin');
        adminToken = aLogin.data.token;

        // 1d. Invalid password
        const badPw = await request('POST', '/api/auth/login', { username: '2023CSCA001', password: 'incorrect_password' });
        assert('Invalid password returns 401 Unauthorized', badPw.status === 401);
        assert('User-friendly error message on bad password', !!badPw.data.message);

        // 1e. Non-existent username
        const nonExistent = await request('POST', '/api/auth/login', { username: 'UNKNOWN_USER_999', password: 'password123' });
        assert('Non-existent user returns 401 Unauthorized', nonExistent.status === 401);

        // 1f. Empty credentials
        const emptyCreds = await request('POST', '/api/auth/login', { username: '', password: '' });
        assert('Empty credentials returns 400 Bad Request', emptyCreds.status === 400);

        // ==========================================
        // 2. TOKEN INTEGRITY & CLAIMS VERIFICATION
        // ==========================================
        console.log('\n[2. Token Integrity & Claims]');

        const decoded = jwt.decode(studentToken);
        assert('Decoded token contains id claim', !!decoded.id);
        assert('Decoded token contains role claim', decoded.role === 'student');
        assert('Decoded token contains reg_number claim', decoded.reg_number === '2023CSCA001');
        assert('Decoded token does not contain password_hash', decoded.password_hash === undefined);
        assert('Decoded token does not contain password', decoded.password === undefined);

        // Verify with wrong secret
        try {
            jwt.verify(studentToken, 'totally_wrong_fake_jwt_secret');
            assert('Token with wrong secret rejected', false);
        } catch {
            assert('Token with wrong secret correctly rejected by crypto check', true);
        }

        // ==========================================
        // 3. /api/auth/me PROFILE HYDRATION
        // ==========================================
        console.log('\n[3. /api/auth/me Endpoint]');

        // 3a. With valid student token
        const meStudent = await request('GET', '/api/auth/me', null, studentToken);
        assert('GET /api/auth/me with valid token returns 200', meStudent.status === 200);
        assert('Returns username matching identity', meStudent.data.data?.username === '2023CSCA001');
        assert('Returns student profile with fullName', !!meStudent.data.data?.profile?.fullName);
        assert('Password hash never exposed in /me payload', meStudent.data.data?.password_hash === undefined);
        assert('Password plain text never exposed in /me payload', meStudent.data.data?.password === undefined);

        // 3b. Without token
        const meNoToken = await request('GET', '/api/auth/me');
        assert('GET /api/auth/me without token returns 401', meNoToken.status === 401);

        // 3c. With malformed token
        const meMalformed = await request('GET', '/api/auth/me', null, 'malformed_invalid_header');
        assert('GET /api/auth/me with malformed token returns 401', meMalformed.status === 401);

        // 3d. With expired token
        const expiredToken = jwt.sign(
            { id: 4, role: 'student', reg_number: '2023CSCA001' },
            config.JWT_SECRET,
            { expiresIn: '-10s' }
        );
        const meExpired = await request('GET', '/api/auth/me', null, expiredToken);
        assert('GET /api/auth/me with expired token returns 401', meExpired.status === 401);
        assert('Expired token error indicates expiration', 
            meExpired.data.message?.toLowerCase().includes('expired') || meExpired.data.error?.toLowerCase().includes('expired'));

        // ==========================================
        // 4. ROLE-BASED ACCESS CONTROL (RBAC) BOUNDARIES
        // ==========================================
        console.log('\n[4. Role-Based Access Control Boundaries]');

        // 4a. Student attempts lecturer console
        const sToLecturer = await request('GET', '/api/lecturers/dashboard', null, studentToken);
        assert('Student blocked from lecturer dashboard (403)', sToLecturer.status === 403);
        assert('403 response contains clean Forbidden message', sToLecturer.data.message?.includes('Forbidden'));

        // 4b. Student attempts admin dashboard
        const sToAdmin = await request('GET', '/api/admin/dashboard', null, studentToken);
        assert('Student blocked from admin dashboard (403)', sToAdmin.status === 403);

        // 4c. Student attempts admin users management
        const sToAdminUsers = await request('GET', '/api/admin/users', null, studentToken);
        assert('Student blocked from admin users (403)', sToAdminUsers.status === 403);

        // 4d. Lecturer attempts student dashboard
        const lToStudent = await request('GET', '/api/students/dashboard', null, lecturerToken);
        assert('Lecturer blocked from student dashboard (403)', lToStudent.status === 403);

        // 4e. Lecturer attempts admin dashboard
        const lToAdmin = await request('GET', '/api/admin/dashboard', null, lecturerToken);
        assert('Lecturer blocked from admin dashboard (403)', lToAdmin.status === 403);

        // 4f. Admin accesses admin dashboard
        const aToAdmin = await request('GET', '/api/admin/dashboard', null, adminToken);
        assert('Admin authorized for admin dashboard (200)', aToAdmin.status === 200);

        // 4g. Admin accesses admin users
        const aToUsers = await request('GET', '/api/admin/users', null, adminToken);
        assert('Admin authorized for admin users (200)', aToUsers.status === 200);

        // ==========================================
        // 5. SENSITIVE DATA EXPOSURE CHECKS
        // ==========================================
        console.log('\n[5. Sensitive Data Exposure Audits]');

        const responsesToCheck = [sLogin, lLogin, aLogin, meStudent, aToUsers, aToAdmin];
        let leakFound = false;

        for (const res of responsesToCheck) {
            const str = JSON.stringify(res.data);
            if (str.includes('password_hash') || str.includes('$2b$10$') || str.includes(config.JWT_SECRET)) {
                leakFound = true;
                break;
            }
        }
        assert('Zero leaks of password_hash, hashes, or JWT_SECRET across endpoints', !leakFound);

    } finally {
        server.close();
    }

    console.log('\n====================================================');
    console.log(`PHASE 6 TOTAL: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

runPhase6Tests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
