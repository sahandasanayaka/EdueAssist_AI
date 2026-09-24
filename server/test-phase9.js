/**
 * EduAssistAI — Phase 9 Persistent AI Study Plan Generator Test Suite
 * 
 * Comprehensive verification of:
 * - JWT Authentication & RBAC on Study Plan Endpoints
 * - Input validation on preferences (days 1-14, dailyMinutes 30-300)
 * - Grounding in Phase 7 Academic Risk, GPA, Attendance, and Coursework
 * - Gemini JSON schema generation and strict validation
 * - MySQL persistence, task replacement, and completion tracking
 * - Strict IDOR protection on task toggling and deletion
 * - Zero leakage of credentials or sensitive hashes
 * - Resilience and deterministic fallback engine on API failure
 */

process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('./server');
const pool = require('./src/db/connection');
const config = require('./src/config/env');
const geminiService = require('./src/services/geminiService');
const aiContextService = require('./src/services/aiContextService');
const studyPlanService = require('./src/services/studyPlanService');

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

let server;
let baseUrl;

async function runPhase9Tests() {
    console.log('====================================================');
    console.log('   EDUASSIST AI - PHASE 9 STUDY PLAN TESTS         ');
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
        // Obtain authenticated tokens
        const s1Login = await request('POST', '/api/auth/login', { username: '2023CSCA001', password: 'password123' });
        const student1Token = s1Login.data.token;

        const s3Login = await request('POST', '/api/auth/login', { username: '2023CSCA003', password: 'password123' });
        const student3Token = s3Login.data.token;

        const lecLogin = await request('POST', '/api/auth/login', { username: 'Lec001', password: 'password123' });
        const lecturerToken = lecLogin.data.token;

        const admLogin = await request('POST', '/api/auth/login', { username: 'admin01', password: 'password123' });
        const adminToken = admLogin.data.token;

        // ==========================================
        // 1. AUTHENTICATION & ACCESS CONTROL
        // ==========================================
        console.log('\n[1. Authentication & Access Control]');

        const noToken = await request('POST', '/api/students/study-plan/generate', { days: 7 });
        assert('Missing JWT returns 401', noToken.status === 401);

        const badToken = await request('POST', '/api/students/study-plan/generate', { days: 7 }, 'invalid.bearer.token');
        assert('Invalid JWT returns 401', badToken.status === 401);

        const lecBlocked = await request('POST', '/api/students/study-plan/generate', { days: 7 }, lecturerToken);
        assert('Lecturer blocked from study plan generation (403)', lecBlocked.status === 403);

        const admBlocked = await request('POST', '/api/students/study-plan/generate', { days: 7 }, adminToken);
        assert('Admin blocked from study plan generation (403)', admBlocked.status === 403);

        const validGen = await request('POST', '/api/students/study-plan/generate', { days: 7 }, student1Token);
        assert('Valid student can generate plan (200)', validGen.status === 200);

        // ==========================================
        // 2. PREFERENCE INPUT VALIDATION
        // ==========================================
        console.log('\n[2. Preference Input Validation]');

        const badDaysLow = await request('POST', '/api/students/study-plan/generate', { days: 0 }, student1Token);
        assert('Days < 1 rejected (400)', badDaysLow.status === 400);

        const badDaysHigh = await request('POST', '/api/students/study-plan/generate', { days: 15 }, student1Token);
        assert('Days > 14 rejected (400)', badDaysHigh.status === 400);

        const badDaysFloat = await request('POST', '/api/students/study-plan/generate', { days: 5.5 }, student1Token);
        assert('Non-integer days rejected (400)', badDaysFloat.status === 400);

        const badMinsLow = await request('POST', '/api/students/study-plan/generate', { dailyMinutes: 20 }, student1Token);
        assert('dailyMinutes < 30 rejected (400)', badMinsLow.status === 400);

        const badMinsHigh = await request('POST', '/api/students/study-plan/generate', { dailyMinutes: 360 }, student1Token);
        assert('dailyMinutes > 300 rejected (400)', badMinsHigh.status === 400);

        // ==========================================
        // 3. DATA GROUNDING & CONTEXT INTEGRATION
        // ==========================================
        console.log('\n[3. Data Grounding & Phase 7 Context Integration]');

        const s3Context = await aiContextService.buildStudentContext(6);
        assert('Context contains authoritative student GPA', s3Context.gpa.current === 2.15);
        assert('Context reflects Phase 7 Risk profile', s3Context.academicRisk.level === 'HIGH' || s3Context.academicRisk.level === 'MEDIUM');
        assert('Context captures weak course needsAttention or mark < 65', s3Context.courses.needsAttention.length > 0 || s3Context.courses.average.some(c => c.mark < 65) || s3Context.gpa.weakestCourse === 'CSC203S2');
        assert('Context captures attendance breakdown', s3Context.attendance.courses.some(c => c.attendance < 75));
        assert('Context course codes come from database', s3Context.attendance.courses.some(c => c.code === 'CSC203S2'));

        // ==========================================
        // 4. GEMINI OUTPUT SCHEMA VALIDATION
        // ==========================================
        console.log('\n[4. Gemini Output Schema Validation]');

        // 4a. Invalid structure
        let threwInvalid = false;
        try {
            studyPlanService.validateGeneratedPlan(null);
        } catch {
            threwInvalid = true;
        }
        assert('Non-object plan rejected', threwInvalid);

        // 4b. Invalid priority
        let threwBadPriority = false;
        try {
            studyPlanService.validateGeneratedPlan({
                tasks: [{ title: 'Study', priority: 'SUPER_URGENT', estimatedMinutes: 60 }]
            });
        } catch {
            threwBadPriority = true;
        }
        assert('Invalid priority rejected', threwBadPriority);

        // 4c. Excessive estimated minutes
        let threwExcessiveMins = false;
        try {
            studyPlanService.validateGeneratedPlan({
                tasks: [{ title: 'Study', priority: 'HIGH', estimatedMinutes: 500 }]
            });
        } catch {
            threwExcessiveMins = true;
        }
        assert('Excessive estimated minutes (>240) rejected', threwExcessiveMins);

        // 4d. Too many tasks (>10)
        let threwTooManyTasks = false;
        try {
            const elevenTasks = Array.from({ length: 11 }, (_, i) => ({
                title: `Task ${i}`,
                priority: 'MEDIUM',
                estimatedMinutes: 30
            }));
            studyPlanService.validateGeneratedPlan({ tasks: elevenTasks });
        } catch {
            threwTooManyTasks = true;
        }
        assert('More than 10 tasks rejected', threwTooManyTasks);

        // ==========================================
        // 5. PERSISTENCE & TASK MANAGEMENT
        // ==========================================
        console.log('\n[5. Persistence & Task Management]');

        // Generate plan for student 3 (Daniel Taylor, high-risk student)
        const genRes = await request('POST', '/api/students/study-plan/generate', { days: 7, dailyMinutes: 120 }, student3Token);
        assert('Student 3 plan generated successfully (200)', genRes.status === 200);
        assert('Response contains tasks array', Array.isArray(genRes.data.data) && genRes.data.data.length > 0);
        assert('Response contains summary metrics', !!genRes.data.summary && genRes.data.summary.totalTasks > 0);

        // Verify tasks in MySQL for student 3
        const [dbTasks] = await pool.query(
            'SELECT id, title, course_code, priority, status, estimated_minutes FROM study_plan_tasks WHERE student_id = ?',
            [6]
        );
        assert('Tasks persisted in MySQL study_plan_tasks', dbTasks.length > 0);
        assert('Tasks reflect allowed priorities', dbTasks.every(t => ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(t.priority)));

        // Retrieve current study plan via GET
        const getRes = await request('GET', '/api/students/study-plan', null, student3Token);
        assert('GET /api/students/study-plan responds 200', getRes.status === 200);
        assert('GET returns task list', Array.isArray(getRes.data.data));
        assert('GET returns accurate summary percentage', typeof getRes.data.summary?.completionPercentage === 'number');

        // Toggle task completion status
        const targetTask = getRes.data.data[0];
        const toggleRes = await request('PATCH', `/api/students/study-plan/${targetTask.id}/toggle`, null, student3Token);
        assert('PATCH /api/students/study-plan/:id/toggle responds 200', toggleRes.status === 200);
        assert('Task toggled successfully', toggleRes.data.data?.status !== targetTask.status);

        // Verify persistence of toggled state in MySQL
        const [updatedRows] = await pool.query('SELECT status FROM study_plan_tasks WHERE id = ?', [targetTask.id]);
        assert('Task status persisted in MySQL', updatedRows[0].status === toggleRes.data.data?.status);

        // Toggle back to verify roundtrip
        const toggleBack = await request('PUT', `/api/students/study-plan/${targetTask.id}/toggle`, null, student3Token);
        assert('PUT /api/students/study-plan/:id/toggle backward-compatible', toggleBack.status === 200);

        // Delete task
        const deleteRes = await request('DELETE', `/api/students/study-plan/${targetTask.id}`, null, student3Token);
        assert('DELETE /api/students/study-plan/:id responds 200', deleteRes.status === 200);
        const [checkDeleted] = await pool.query('SELECT id FROM study_plan_tasks WHERE id = ?', [targetTask.id]);
        assert('Task deleted from MySQL', checkDeleted.length === 0);

        // ==========================================
        // 6. SECURITY & IDOR AUDITING
        // ==========================================
        console.log('\n[6. Security & IDOR Auditing]');

        // Student 1 attempts to toggle Student 3's remaining task
        const [student3Tasks] = await pool.query('SELECT id FROM study_plan_tasks WHERE student_id = 6 LIMIT 1');
        if (student3Tasks.length > 0) {
            const foreignId = student3Tasks[0].id;
            const idorToggle = await request('PATCH', `/api/students/study-plan/${foreignId}/toggle`, null, student1Token);
            assert('IDOR toggle blocked (404)', idorToggle.status === 404);

            const idorDelete = await request('DELETE', `/api/students/study-plan/${foreignId}`, null, student1Token);
            assert('IDOR delete blocked (404)', idorDelete.status === 404);
        }

        // Check for zero credentials leakage in responses
        const genPayloadStr = JSON.stringify(genRes.data);
        assert('password_hash is never leaked in study plan payload', !genPayloadStr.includes('password_hash'));
        assert('Bcrypt hashes are never leaked in study plan payload', !genPayloadStr.includes('$2b$10$'));
        assert('GEMINI_API_KEY is never leaked in study plan payload', !config.GEMINI_API_KEY || !genPayloadStr.includes(config.GEMINI_API_KEY));

        // ==========================================
        // 7. GEMINI MOCKING & FALLBACK RESILIENCE
        // ==========================================
        console.log('\n[7. Gemini Mocking & Fallback Resilience]');

        // 7a. Inject custom mock
        geminiService.injectStudyPlanMock(async ({ preferences }) => ({
            planTitle: 'Mock Injected Custom Plan',
            summary: 'Simulated plan for test isolation',
            tasks: [
                {
                    title: 'Specialized Test Task',
                    description: 'Custom verified assignment review',
                    courseCode: 'CSC201S2',
                    priority: 'HIGH',
                    estimatedMinutes: 90,
                    dueDate: '2026-09-25'
                }
            ]
        }));

        const mockGen = await request('POST', '/api/students/study-plan/generate', { days: 7 }, student1Token);
        assert('Injected study plan mock returns custom tasks', mockGen.data.data.some(t => t.title === 'Specialized Test Task'));

        // 7b. Inject Gemini API failure (e.g. Quota Exceeded / Network drop)
        geminiService.injectStudyPlanMock(async () => {
            throw new Error('Simulated Gemini 429 API Quota Exhausted');
        });

        const fallbackGen = await request('POST', '/api/students/study-plan/generate', { days: 7 }, student3Token);
        assert('System recovers gracefully from Gemini API failure (200)', fallbackGen.status === 200);
        assert('Deterministic fallback generates grounded tasks', Array.isArray(fallbackGen.data.data) && fallbackGen.data.data.length > 0);
        assert('Fallback references real student coursework', fallbackGen.data.data.some(t => t.course_code === 'CSC203S2' || t.course_code === 'CSC202S2'));

        // Clear mock to restore live service
        geminiService.clearStudyPlanMock();

    } finally {
        server.close();
    }

    console.log('\n====================================================');
    console.log(`PHASE 9 TOTAL: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runPhase9Tests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
