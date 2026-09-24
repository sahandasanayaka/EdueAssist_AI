/**
 * EduAssistAI Phase 3 Automated Verification Suite
 */
process.env.NODE_ENV = 'test';
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./server');
const config = require('./src/config/env');
const { testConnection } = require('./src/db/connection');
const { authenticateToken } = require('./src/middleware/authMiddleware');
const { requireRole } = require('./src/middleware/roleMiddleware');

let server;
let baseUrl;

async function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
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

async function runTests() {
    console.log('====================================================');
    console.log('   EDUASSIST AI - PHASE 3 VERIFICATION SUITE       ');
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

    // Start a temporary test server on port 5099
    const testPort = 5099;
    server = app.listen(testPort);
    baseUrl = `http://localhost:${testPort}`;

    try {
        // 1. Config Test
        console.log('\n[1. Environment Configuration]');
        assert('PORT loaded', typeof config.PORT === 'number');
        assert('DB_NAME is eduassist_db', config.DB_NAME === 'eduassist_db');
        assert('JWT_SECRET is defined', typeof config.JWT_SECRET === 'string' && config.JWT_SECRET.length > 5);
        assert('CLIENT_URLS array defined', Array.isArray(config.CLIENT_URLS) && config.CLIENT_URLS.length > 0);

        // 2. Database Connection Test
        console.log('\n[2. Database Connection Pool]');
        const dbConnected = await testConnection();
        assert('MySQL testConnection() returned true', dbConnected === true);

        // 3. Health Check Route
        console.log('\n[3. Health Check Endpoint - GET /api/health]');
        const healthRes = await request('GET', '/api/health');
        assert('Health status is 200', healthRes.status === 200);
        assert('Health success is true', healthRes.data.success === true);
        assert('Database is connected', healthRes.data.database === 'connected');
        assert('Environment reported', healthRes.data.environment === 'test');

        // 4. Authentication Middleware Unit Tests
        console.log('\n[4. Authentication Middleware Tests]');
        
        // 4a. Missing token
        let mockReq = { headers: {} };
        let mockRes = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(payload) { this.payload = payload; return this; }
        };
        let nextCalled = false;
        authenticateToken(mockReq, mockRes, () => { nextCalled = true; });
        assert('Missing token rejected with 401', mockRes.statusCode === 401 && !nextCalled);
        assert('Error message provided for missing token', mockRes.payload?.success === false);

        // 4b. Invalid token
        mockReq = { headers: { authorization: 'Bearer invalid.jwt.token' } };
        mockRes.statusCode = 200;
        nextCalled = false;
        authenticateToken(mockReq, mockRes, () => { nextCalled = true; });
        assert('Invalid token rejected with 401', mockRes.statusCode === 401 && !nextCalled);

        // 4c. Valid token
        const sampleToken = jwt.sign({ id: 4, role: 'student', reg_number: '2023CSCA001' }, config.JWT_SECRET, { expiresIn: '1h' });
        mockReq = { headers: { authorization: `Bearer ${sampleToken}` } };
        mockRes.statusCode = 200;
        nextCalled = false;
        authenticateToken(mockReq, mockRes, () => { nextCalled = true; });
        assert('Valid token accepted and next() called', nextCalled === true);
        assert('User attached to req.user', mockReq.user?.reg_number === '2023CSCA001' && mockReq.user?.role === 'student');

        // 5. Role-Based Authorization Middleware Unit Tests
        console.log('\n[5. Role-Based Authorization Middleware Tests]');
        
        // 5a. Student accessing student-allowed endpoint
        const studentMiddleware = requireRole('student');
        nextCalled = false;
        mockReq = { user: { role: 'student', reg_number: '2023CSCA001' } };
        mockRes.statusCode = 200;
        studentMiddleware(mockReq, mockRes, () => { nextCalled = true; });
        assert('Student role allowed on student route', nextCalled === true);

        // 5b. Student accessing lecturer-only endpoint
        const lecturerMiddleware = requireRole('lecturer');
        nextCalled = false;
        mockReq = { user: { role: 'student', reg_number: '2023CSCA001' } };
        mockRes.statusCode = 200;
        lecturerMiddleware(mockReq, mockRes, () => { nextCalled = true; });
        assert('Student role blocked on lecturer route with 403', mockRes.statusCode === 403 && !nextCalled);

        // 5c. Admin accessing lecturer-only endpoint (admin bypass)
        nextCalled = false;
        mockReq = { user: { role: 'admin', reg_number: 'admin01' } };
        mockRes.statusCode = 200;
        lecturerMiddleware(mockReq, mockRes, () => { nextCalled = true; });
        assert('Admin role permitted on lecturer route', nextCalled === true);

        // 6. Login API Integration Tests
        console.log('\n[6. Login Endpoint Tests - POST /api/auth/login]');
        
        // 6a. Student login
        const studentLogin = await request('POST', '/api/auth/login', { username: '2023CSCA001', password: 'password123' });
        assert('Student login succeeds (200)', studentLogin.status === 200);
        assert('Student token returned', typeof studentLogin.data.token === 'string' && studentLogin.data.token.length > 20);
        assert('Student role returned', studentLogin.data.user?.role === 'student');

        // 6b. Lecturer login
        const lecturerLogin = await request('POST', '/api/auth/login', { username: 'Lec001', password: 'password123' });
        assert('Lecturer login succeeds (200)', lecturerLogin.status === 200);
        assert('Lecturer role returned', lecturerLogin.data.user?.role === 'lecturer');

        // 6c. Admin login
        const adminLogin = await request('POST', '/api/auth/login', { username: 'admin01', password: 'password123' });
        assert('Admin login succeeds (200)', adminLogin.status === 200);
        assert('Admin role returned', adminLogin.data.user?.role === 'admin');

        // 6d. At-risk student login
        const atRiskLogin = await request('POST', '/api/auth/login', { username: '2023CSCA003', password: 'password123' });
        assert('At-risk student login succeeds (200)', atRiskLogin.status === 200);
        assert('At-risk student role returned', atRiskLogin.data.user?.role === 'student');

        // 6e. Invalid credentials
        const badLogin = await request('POST', '/api/auth/login', { username: 'nonexistent_user', password: 'wrongpassword' });
        assert('Invalid login rejected with 401', badLogin.status === 401);
        assert('Error message returned', badLogin.data.success === false);

        // 7. Existing Endpoints Compatibility
        console.log('\n[7. Existing Endpoints Compatibility]');
        
        // 7a. Student Dashboard
        const dashRes = await request('GET', '/api/students/dashboard', null, { 'x-user-reg': '2023CSCA001' });
        assert('Dashboard responds 200', dashRes.status === 200);
        assert('Dashboard returns GPA and AI analysis', dashRes.data.gpa !== undefined && dashRes.data.ai_analysis !== undefined);

        // 7b. Chat endpoint
        const chatRes = await request('POST', '/api/students/chat', { message: 'Hello EduAssist' });
        assert('Chat responds 200', chatRes.status === 200);
        assert('Chat returns reply', typeof chatRes.data.reply === 'string' && chatRes.data.reply.length > 5);

        // 8. 404 & Centralized Error Handler
        console.log('\n[8. Centralized Error Handler & 404 Handling]');
        const notFoundRes = await request('GET', '/api/nonexistent-route-xyz');
        assert('Unknown route returns 404', notFoundRes.status === 404);
        assert('Standardized error structure returned', notFoundRes.data.success === false && notFoundRes.data.message.includes('not found'));

    } catch (err) {
        console.error('Unexpected test failure:', err);
        failed++;
    } finally {
        if (server) {
            server.close();
        }
    }

    console.log('\n====================================================');
    console.log(`TOTAL: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
}

runTests();
