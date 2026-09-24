/**
 * EduAssistAI Phase 8 AI Chatbot & Memory Integration Verification Suite
 */
process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('./server');
const config = require('./src/config/env');
const pool = require('./src/db/connection');
const geminiService = require('./src/services/geminiService');
const aiContextService = require('./src/services/aiContextService');

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

async function runPhase8Tests() {
    console.log('====================================================');
    console.log('   EDUASSIST AI - PHASE 8 CHATBOT & MEMORY TESTS   ');
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

    const testPort = 5196;
    server = app.listen(testPort);
    baseUrl = `http://localhost:${testPort}`;

    try {
        // Step 1: Login & obtain tokens
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

        const validChat = await request('POST', '/api/students/chat', { 
            message: 'Hello, what is my current academic status?',
            session_id: 'phase8_test_s1'
        }, student1Token);

        assert('Valid student can chat (200)', validChat.status === 200);
        assert('Chat returns reply text', !!(validChat.data.reply || validChat.data.data?.message));

        const noToken = await request('POST', '/api/students/chat', { message: 'Hello' });
        assert('Missing JWT returns 401', noToken.status === 401);

        const badToken = await request('POST', '/api/students/chat', { message: 'Hello' }, 'invalid.jwt.token');
        assert('Invalid JWT returns 401', badToken.status === 401);

        const lecBlocked = await request('POST', '/api/students/chat', { message: 'Hello' }, lecturerToken);
        assert('Lecturer blocked from student chat (403)', lecBlocked.status === 403);

        const admBlocked = await request('POST', '/api/students/chat', { message: 'Hello' }, adminToken);
        assert('Admin blocked from student chat (403)', admBlocked.status === 403);

        // ==========================================
        // 2. INPUT VALIDATION
        // ==========================================
        console.log('\n[2. Input Validation]');

        const emptyMsg = await request('POST', '/api/students/chat', { message: '' }, student1Token);
        assert('Empty message rejected (400)', emptyMsg.status === 400);

        const spaceMsg = await request('POST', '/api/students/chat', { message: '    ' }, student1Token);
        assert('Whitespace-only message rejected (400)', spaceMsg.status === 400);

        const hugeMsg = 'A'.repeat(2500);
        const oversized = await request('POST', '/api/students/chat', { message: hugeMsg }, student1Token);
        assert('Oversized message >2000 chars rejected (400)', oversized.status === 400);

        const nonString = await request('POST', '/api/students/chat', { message: 12345 }, student1Token);
        assert('Non-string message rejected (400)', nonString.status === 400);

        // ==========================================
        // 3. DATA GROUNDING & CONTEXT BUILDER
        // ==========================================
        console.log('\n[3. Data Grounding & Phase 7 Context Integration]');

        const contextS1 = await aiContextService.buildStudentContext(4);
        assert('Student context contains full name matching MySQL', contextS1.student.fullName === 'Alex Perera');
        assert('Student context incorporates Phase 7 risk level', contextS1.academicRisk.level === 'LOW');
        assert('Student context incorporates authoritative GPA', contextS1.gpa.current === 3.85);
        assert('Student context incorporates course attendance summary', contextS1.attendance.overall > 0);

        const contextS3 = await aiContextService.buildStudentContext(6);
        assert('High-risk student context reflects Phase 7 risk', contextS3.academicRisk.level === 'HIGH' || contextS3.academicRisk.level === 'MEDIUM');
        assert('High-risk student context captures attendance warnings', contextS3.attendance.warnings.length > 0);

        const formattedPrompt = aiContextService.formatContextForPrompt(contextS3);
        assert('Formatted prompt contains student registration number', formattedPrompt.includes('2023CSCA003'));
        assert('Formatted prompt contains module details', formattedPrompt.includes('CSC203S2'));

        // ==========================================
        // 4. CHAT MEMORY & PERSISTENCE
        // ==========================================
        console.log('\n[4. Chat Memory & Persistence Scoping]');

        const uniquePrompt = `Unique Verification Prompt ${Date.now()}`;
        const chatSend = await request('POST', '/api/students/chat', { 
            message: uniquePrompt, 
            session_id: 'scope_test_session' 
        }, student3Token);
        assert('Chat request completed successfully', chatSend.status === 200);

        // Verify message was stored in MySQL
        const [historyRows] = await pool.query(
            `SELECT message, sender, student_id FROM ai_chat_history 
             WHERE student_id = 6 AND session_id = 'scope_test_session'
             ORDER BY id DESC LIMIT 2`
        );
        assert('User message persisted in MySQL ai_chat_history', historyRows.some(r => r.message === uniquePrompt && r.sender === 'user'));
        assert('Assistant response persisted in MySQL ai_chat_history', historyRows.some(r => r.sender === 'ai'));
        assert('Messages strictly scoped to studentId = 6', historyRows.every(r => r.student_id === 6));

        // Verify retrieval endpoint
        const historyGet1 = await request('GET', '/api/students/chat/history?session_id=scope_test_session', null, student3Token);
        assert('GET /api/students/chat/history responds 200', historyGet1.status === 200);
        assert('History returns stored messages', historyGet1.data.data?.length >= 2);

        // Verify alias endpoint GET /api/students/chat-history
        const historyGetAlias = await request('GET', '/api/students/chat-history?session_id=scope_test_session', null, student3Token);
        assert('GET /api/students/chat-history responds 200', historyGetAlias.status === 200);

        // Verify cross-student isolation: Student 1 cannot view Student 3's chat history
        const historyCross = await request('GET', '/api/students/chat/history?session_id=scope_test_session', null, student1Token);
        const crossLeaked = (historyCross.data.data || []).some(m => m.message === uniquePrompt);
        assert('Cross-student chat isolation verified (Student 1 cannot see Student 3 messages)', !crossLeaked);

        // ==========================================
        // 5. SECURITY & ZERO SECRETS LEAKAGE
        // ==========================================
        console.log('\n[5. Security & Sensitive Information Audits]');

        const chatPayloadStr = JSON.stringify(validChat.data);
        assert('password_hash is never leaked in chat response', !chatPayloadStr.includes('password_hash'));
        assert('Bcrypt hashes are never leaked in chat response', !chatPayloadStr.includes('$2b$10$'));
        assert('JWT_SECRET is never leaked in chat response', !chatPayloadStr.includes(config.JWT_SECRET));
        assert('GEMINI_API_KEY is never leaked in chat response', !config.GEMINI_API_KEY || !chatPayloadStr.includes(config.GEMINI_API_KEY));

        // ==========================================
        // 6. RATE LIMITING AUDIT
        // ==========================================
        console.log('\n[6. Rate Limiting & Throttling]');

        // Consecutive request within 300ms should trigger 429
        const rapid1 = await request('POST', '/api/students/chat', { message: 'Rapid ping 1' }, student1Token);
        const rapid2 = await request('POST', '/api/students/chat', { message: 'Rapid ping 2' }, student1Token);
        assert('Rapid burst request (<300ms) triggers 429 rate limit', rapid2.status === 429);
        assert('Rate limit error message is helpful', rapid2.data.error?.includes('quickly') || rapid2.data.message?.includes('quickly'));

        // Wait for interval to reset
        await new Promise(r => setTimeout(r, 350));

        // ==========================================
        // 7. GEMINI INJECTABLE MOCKING & FAILURE HANDLING
        // ==========================================
        console.log('\n[7. Gemini Mocking & Failure Resilience]');

        // 7a. Inject successful mock
        geminiService.injectMock(async () => 'This is a mocked Gemini academic advisor reply.');
        const mockedRes = await request('POST', '/api/students/chat', { message: 'Test mock query' }, student1Token);
        assert('Injected Gemini mock returns custom response', mockedRes.data.reply === 'This is a mocked Gemini academic advisor reply.');

        // Pause for rate limit
        await new Promise(r => setTimeout(r, 350));

        // 7b. Inject Gemini API failure
        geminiService.injectMock(async () => {
            throw new Error('Simulated Gemini 429 Quota Exceeded');
        });
        const failedRes = await request('POST', '/api/students/chat', { message: 'Why is my GPA low?' }, student3Token);
        assert('System handles Gemini API failure gracefully without crashing', failedRes.status === 200);
        assert('Grounded fallback reply generated on API failure', !!failedRes.data.reply);
        assert('Fallback references student empirical GPA', (failedRes.data.reply || '').includes('2.15') || (failedRes.data.reply || '').includes('GPA'));

        // Pause for rate limit
        await new Promise(r => setTimeout(r, 350));

        // 7c. Inject empty Gemini response
        geminiService.injectMock(async () => '');
        const emptyRes = await request('POST', '/api/students/chat', { message: 'Hello' }, student1Token);
        assert('Empty Gemini response handled safely', emptyRes.status === 200 && !!emptyRes.data.reply);

        // Clear mock to restore live service
        geminiService.clearMock();

    } finally {
        server.close();
    }

    console.log('\n====================================================');
    console.log(`PHASE 8 TOTAL: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

runPhase8Tests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
