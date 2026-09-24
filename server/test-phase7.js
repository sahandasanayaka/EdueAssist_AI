/**
 * EduAssistAI Phase 7 AI Academic Analysis Engine Verification Suite
 */
process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('./server');
const config = require('./src/config/env');
const pool = require('./src/db/connection');

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

async function runPhase7Tests() {
    console.log('====================================================');
    console.log('   EDUASSIST AI - PHASE 7 ACADEMIC ANALYSIS TESTS  ');
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

    const testPort = 5197;
    server = app.listen(testPort);
    baseUrl = `http://localhost:${testPort}`;

    try {
        // Step 1: Generate Tokens
        const s1Login = await request('POST', '/api/auth/login', { username: '2023CSCA001', password: 'password123' });
        const student1Token = s1Login.data.token;

        const s3Login = await request('POST', '/api/auth/login', { username: '2023CSCA003', password: 'password123' });
        const student3Token = s3Login.data.token;

        const s4Login = await request('POST', '/api/auth/login', { username: '2023CSCA004', password: 'password123' });
        const student4Token = s4Login.data.token;

        const lecLogin = await request('POST', '/api/auth/login', { username: 'Lec001', password: 'password123' });
        const lecturerToken = lecLogin.data.token;

        const admLogin = await request('POST', '/api/auth/login', { username: 'admin01', password: 'password123' });
        const adminToken = admLogin.data.token;

        // ==========================================
        // 1. AUTHENTICATION & ACCESS CONTROL
        // ==========================================
        console.log('\n[1. Authentication & Access Control]');

        const res1 = await request('GET', '/api/students/academic-analysis', null, student1Token);
        assert('Student with valid JWT accesses academic analysis (200)', res1.status === 200);
        assert('Response success flag is true', res1.data.success === true);
        assert('Response contains structured data payload', !!res1.data.data);

        const resNoToken = await request('GET', '/api/students/academic-analysis');
        assert('Missing token returns 401 Unauthorized', resNoToken.status === 401);

        const resBadToken = await request('GET', '/api/students/academic-analysis', null, 'invalid.token.here');
        assert('Invalid token returns 401 Unauthorized', resBadToken.status === 401);

        const resLecturer = await request('GET', '/api/students/academic-analysis', null, lecturerToken);
        assert('Lecturer blocked from student academic analysis (403)', resLecturer.status === 403);

        const resAdmin = await request('GET', '/api/students/academic-analysis', null, adminToken);
        assert('Admin blocked from student academic analysis (403)', resAdmin.status === 403);

        // ==========================================
        // 2. DATA ACCURACY AGAINST MYSQL
        // ==========================================
        console.log('\n[2. Data Accuracy & Grounding Against MySQL]');

        const [dbStudent] = await pool.query('SELECT gpa, full_name, department FROM students WHERE user_id = 4');
        const [dbAtt] = await pool.query(`
            SELECT SUM(attended_classes) as attended, SUM(total_classes) as total
            FROM attendance_summary WHERE student_id = 4
        `);
        const expectedAttendance = Math.round((dbAtt[0].attended / dbAtt[0].total) * 1000) / 10;

        assert('Returned GPA strictly matches MySQL students table', 
            res1.data.data.gpa?.current === parseFloat(dbStudent[0].gpa));
        assert('Returned student name matches MySQL', 
            res1.data.data.student?.fullName === dbStudent[0].full_name);
        assert('Returned attendance matches calculated percentage from MySQL', 
            res1.data.data.attendance?.overall === expectedAttendance);
        assert('Enrolled courses list is present and populated', 
            Array.isArray(res1.data.data.coursePerformance?.all) && res1.data.data.coursePerformance.all.length > 0);

        // ==========================================
        // 3. DETERMINISTIC RISK ENGINE & PERSONAS
        // ==========================================
        console.log('\n[3. Deterministic Risk Engine & Personas]');

        // Student 001 (High Performer: GPA 3.85, >95% attendance)
        assert('Student 001 classified as LOW risk', res1.data.data.risk?.level === 'LOW');
        assert('Student 001 has low risk score (< 35)', res1.data.data.risk?.score < 35);
        assert('Student 001 has no attendance warnings', res1.data.data.attendance?.warnings?.length === 0);
        assert('Student 001 has verified strengths', res1.data.data.strengths?.length > 0);

        // Student 004 (High Risk Performer: GPA 1.80, critical attendance <60%)
        const res4 = await request('GET', '/api/students/academic-analysis', null, student4Token);
        assert('Student 004 analysis returns 200', res4.status === 200);
        assert('Student 004 classified as HIGH risk', res4.data.data.risk?.level === 'HIGH');
        assert('Student 004 risk score >= 65', res4.data.data.risk?.score >= 65);
        assert('Student 004 has critical attendance warnings', res4.data.data.attendance?.warnings?.some(w => w.severity === 'CRITICAL'));
        assert('Student 004 has documented risk reasons', res4.data.data.risk?.reasons?.length > 0);

        // Student 003 (Needs Help: GPA 2.15, DB attendance 66%, 1 overdue/imminent)
        const res3 = await request('GET', '/api/students/academic-analysis', null, student3Token);
        assert('Student 003 analysis returns 200', res3.status === 200);
        assert('Student 003 classified as MEDIUM or HIGH risk', 
            res3.data.data.risk?.level === 'HIGH' || res3.data.data.risk?.level === 'MEDIUM');
        assert('Student 003 identifies attendance warning in CSC203S2 (<75%)', 
            res3.data.data.attendance?.warnings?.some(w => w.courseCode === 'CSC203S2'));
        assert('Student 003 has actionable recommendations', res3.data.data.recommendations?.length > 0);
        assert('Student 003 recommendations target attendance or coursework', 
            res3.data.data.recommendations?.some(r => r.category === 'ATTENDANCE' || r.category === 'ASSIGNMENT'));

        // ==========================================
        // 4. ASSIGNMENT & PRIORITY ACTION RULES
        // ==========================================
        console.log('\n[4. Assignment & Priority Action Rules]');

        assert('Assignment priority list contains structured priority levels', 
            Array.isArray(res1.data.data.assignments?.priorityList));
        assert('Priority actions array contains ranked urgency levels', 
            Array.isArray(res3.data.data.priorityActions) && res3.data.data.priorityActions.length > 0);
        assert('Priority actions levels are valid (URGENT, HIGH, MEDIUM, LOW)', 
            res3.data.data.priorityActions.every(p => ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(p.level)));

        // ==========================================
        // 5. SECURITY & ZERO DATA LEAKAGE AUDIT
        // ==========================================
        console.log('\n[5. Security & Zero Data Leakage]');

        const str1 = JSON.stringify(res1.data);
        const str3 = JSON.stringify(res3.data);
        const str4 = JSON.stringify(res4.data);

        const hasPasswordHash = str1.includes('password_hash') || str3.includes('password_hash') || str4.includes('password_hash');
        const hasBcrypt = str1.includes('$2b$10$') || str3.includes('$2b$10$') || str4.includes('$2b$10$');
        const hasSecret = str1.includes(config.JWT_SECRET) || str3.includes(config.JWT_SECRET) || str4.includes(config.JWT_SECRET);

        assert('Zero leaks of password_hash in academic analysis payloads', !hasPasswordHash);
        assert('Zero leaks of bcrypt hashes in academic analysis payloads', !hasBcrypt);
        assert('Zero leaks of JWT_SECRET in academic analysis payloads', !hasSecret);

    } finally {
        server.close();
    }

    console.log('\n====================================================');
    console.log(`PHASE 7 TOTAL: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

runPhase7Tests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
