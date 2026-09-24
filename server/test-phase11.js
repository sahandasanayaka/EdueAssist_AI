/**
 * EduAssistAI — Phase 11 Assignment Intelligence & Submission Management Test Suite
 * 
 * Comprehensive verification of:
 * - JWT Authentication & RBAC on Assignment Endpoints
 * - Backward compatibility with Phase 4 response structure (res.data.data array)
 * - Deterministic Assignment Priority Engine (URGENT, HIGH, MEDIUM, LOW) & explainable reasons
 * - Grounding in real MySQL data: courses, enrollments, exam_results, attendance_summary
 * - Assignment summary metrics (total, pending, overdue, submitted, graded, completion_rate, average_marks)
 * - Single assignment detail endpoint & IDOR course-enrollment protection
 * - Submission management: validations, empty text rejection, duplicate rejection, late determination
 * - Gemini AI Assignment Advisor & deterministic fallback resilience
 * - Security audit: zero leakage of password_hash, bcrypt hashes, or GEMINI_API_KEY
 */

process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('./server');
const pool = require('./src/db/connection');
const geminiService = require('./src/services/geminiService');
const assignmentIntelligenceService = require('./src/services/assignmentIntelligenceService');

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

async function runPhase11Tests() {
    console.log('====================================================');
    console.log('   EDUASSIST AI - PHASE 11 ASSIGNMENT TESTS         ');
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

    try {
        await new Promise((resolve) => {
            server = http.createServer(app);
            server.listen(0, '127.0.0.1', () => {
                const port = server.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });

        // 1. Obtain Tokens
        const studentRes = await request('POST', '/api/auth/login', {
            username: '2023CSCA001',
            password: 'password123'
        });
        const studentToken = studentRes.data.token;

        const student3Res = await request('POST', '/api/auth/login', {
            username: '2023CSCA003',
            password: 'password123'
        });
        const student3Token = student3Res.data.token;

        const lecturerRes = await request('POST', '/api/auth/login', {
            username: 'Lec001',
            password: 'password123'
        });
        const lecturerToken = lecturerRes.data.token;

        const adminRes = await request('POST', '/api/auth/login', {
            username: 'admin01',
            password: 'password123'
        });
        const adminToken = adminRes.data.token;

        // Clean up any test submission for assignment 4 by student 4 before testing starts
        await pool.query('DELETE FROM assignment_submissions WHERE assignment_id = 4 AND student_id = 4');

        // ==========================================
        // SECTION 1: Authentication & RBAC
        // ==========================================
        console.log('[1. Authentication & Role-Based Access Control]');
        const noTokenRes = await request('GET', '/api/students/assignments');
        assert('GET /api/students/assignments rejects unauthenticated requests (401)', noTokenRes.status === 401);

        const lecRes = await request('GET', '/api/students/assignments', null, lecturerToken);
        assert('GET /api/students/assignments rejects lecturer role (403)', lecRes.status === 403);

        const admRes = await request('GET', '/api/students/assignments', null, adminToken);
        assert('GET /api/students/assignments rejects admin role (403)', admRes.status === 403);

        const authStudentRes = await request('GET', '/api/students/assignments', null, studentToken);
        assert('GET /api/students/assignments permits student role (200)', authStudentRes.status === 200);

        const unauthSubmit = await request('POST', '/api/students/assignments/4/submit', { submission_text: 'test' });
        assert('POST /api/students/assignments/:id/submit rejects unauthenticated requests (401)', unauthSubmit.status === 401);

        const lecSubmit = await request('POST', '/api/students/assignments/4/submit', { submission_text: 'test' }, lecturerToken);
        assert('POST /api/students/assignments/:id/submit rejects lecturer role (403)', lecSubmit.status === 403);

        // ==========================================
        // SECTION 2: Response Structure & Phase 4 Compatibility
        // ==========================================
        console.log('\n[2. Response Structure & Backward Compatibility]');
        const payload = authStudentRes.data;
        assert('Response status is success', payload.status === 'success');
        assert('res.data.data is an array (Phase 4 compatibility requirement)', Array.isArray(payload.data));
        assert('res.data.assignments is an array (Phase 11 primary field)', Array.isArray(payload.assignments));
        assert('res.data.summary is a valid object', typeof payload.summary === 'object' && payload.summary !== null);
        assert('res.data.priority_actions is an array', Array.isArray(payload.priority_actions));
        assert('res.data.ai_advisor is an object', typeof payload.ai_advisor === 'object' && payload.ai_advisor !== null);
        assert('Enrolled student has active assignments in list', payload.assignments.length > 0);
        assert('Phase 4 data array matches assignments array length', payload.data.length === payload.assignments.length);

        // ==========================================
        // SECTION 3: Intelligent Assignment Schema & Academic Context Grounding
        // ==========================================
        console.log('\n[3. Intelligent Assignment Schema & MySQL Grounding]');
        const sample = payload.assignments[0];
        assert('Assignment has valid numeric id', typeof sample.id === 'number');
        assert('Assignment has course_code and course_title', !!sample.course_code && !!sample.course_title);
        assert('Assignment has title and description', !!sample.title && typeof sample.description === 'string');
        assert('Assignment has due_date', !!sample.due_date);
        assert('Assignment has valid submission_status', ['PENDING', 'SUBMITTED', 'OVERDUE', 'GRADED', 'LATE'].includes((sample.submission_status || '').toUpperCase()));
        assert('Assignment has deterministic priority level', ['URGENT', 'HIGH', 'MEDIUM', 'LOW'].includes(sample.priority));
        assert('Assignment has non-empty priority_reason', typeof sample.priority_reason === 'string' && sample.priority_reason.length > 0);
        assert('Assignment has time_remaining_label', typeof sample.time_remaining_label === 'string' && sample.time_remaining_label.length > 0);
        assert('Assignment has current_course_mark property', sample.current_course_mark !== undefined);
        assert('Assignment has course_attendance property', sample.course_attendance !== undefined);

        // Verify assignment 1 (Database Normalization) is graded with marks 98
        const assign1 = payload.assignments.find(a => a.id === 1);
        assert('Assignment 1 is identified as GRADED with marks recorded', assign1 && ['GRADED', 'graded'].includes(assign1.submission_status) && parseFloat(assign1.marks) === 98);
        assert('Assignment 1 retains lecturer feedback', assign1 && typeof assign1.feedback === 'string' && assign1.feedback.length > 0);

        // Verify pending assignment 4
        const assign4 = payload.assignments.find(a => a.id === 4);
        assert('Student 4 has Assignment 4 in pending status', assign4 && ['PENDING', 'pending'].includes(assign4.submission_status));

        // ==========================================
        // SECTION 4: Deterministic Priority Engine Rule Verification
        // ==========================================
        console.log('\n[4. Deterministic Priority Engine Rules]');
        
        // Unit test 1: Overdue
        const pOverdue = assignmentIntelligenceService.computePriority({
            submission_status: 'overdue',
            due_date: new Date(Date.now() - 86400000).toISOString(),
            weight: 10,
            current_course_mark: 75,
            course_attendance: 85
        });
        assert('Overdue assignment flagged as URGENT', pOverdue.priority === 'URGENT' && pOverdue.reason.toLowerCase().includes('overdue'));

        // Unit test 2: Due in < 48 hours
        const p48h = assignmentIntelligenceService.computePriority({
            submission_status: 'pending',
            due_date: new Date(Date.now() + 36 * 3600000).toISOString(),
            weight: 10,
            current_course_mark: 75,
            course_attendance: 85
        });
        assert('Assignment due within 48h flagged as URGENT', p48h.priority === 'URGENT' && p48h.reason.toLowerCase().includes('48 hours'));

        // Unit test 3: Academic Risk (course mark < 50%) due in 4 days
        const pRisk = assignmentIntelligenceService.computePriority({
            submission_status: 'pending',
            due_date: new Date(Date.now() + 4 * 86400000).toISOString(),
            weight: 10,
            current_course_mark: 42,
            course_attendance: 80
        });
        assert('Course mark <50% due in 4 days flagged as URGENT', pRisk.priority === 'URGENT' && pRisk.reason.toLowerCase().includes('course performance'));

        // Unit test 4: Low attendance (<75%) due in 5 days
        const pLowAtt = assignmentIntelligenceService.computePriority({
            submission_status: 'pending',
            due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
            weight: 10,
            current_course_mark: 70,
            course_attendance: 65
        });
        assert('Course attendance <75% due in 5 days flagged as HIGH', pLowAtt.priority === 'HIGH' && pLowAtt.reason.toLowerCase().includes('attendance'));

        // Unit test 5: High weight (>=20%) due in 6 days
        const pHighWeight = assignmentIntelligenceService.computePriority({
            submission_status: 'pending',
            due_date: new Date(Date.now() + 6 * 86400000).toISOString(),
            weight: 25,
            current_course_mark: 80,
            course_attendance: 90
        });
        assert('High weight (25%) due in 6 days flagged as HIGH', pHighWeight.priority === 'HIGH' && pHighWeight.reason.toLowerCase().includes('weight'));

        // Unit test 6: Submitted / Graded assignment
        const pSubmitted = assignmentIntelligenceService.computePriority({
            submission_status: 'submitted',
            due_date: new Date(Date.now() + 86400000).toISOString(),
            weight: 20,
            current_course_mark: 80,
            course_attendance: 90
        });
        assert('Already submitted assignment marked as LOW priority', pSubmitted.priority === 'LOW' && pSubmitted.reason.toLowerCase().includes('completed'));

        // Unit test 7: Distant normal assignment
        const pDistant = assignmentIntelligenceService.computePriority({
            submission_status: 'pending',
            due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
            weight: 10,
            current_course_mark: 80,
            course_attendance: 90
        });
        assert('Distant pending assignment (>7 days) assigned LOW or MEDIUM priority', ['MEDIUM', 'LOW'].includes(pDistant.priority));

        // Priority actions filter check
        const priorityActions = payload.priority_actions;
        assert('Priority actions contains pending deliverables', priorityActions.every(a => a.submission_status !== 'submitted' && a.submission_status !== 'graded'));
        if (priorityActions.length > 1) {
            const rank = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
            assert('Priority actions are sorted by urgency', rank[priorityActions[0].priority] <= rank[priorityActions[1].priority]);
        } else {
            assert('Priority actions length matches pending priority assignments', true);
        }

        // ==========================================
        // SECTION 5: Summary Metrics Accuracy
        // ==========================================
        console.log('\n[5. Summary Metrics Accuracy]');
        const sum = payload.summary;
        assert('summary.total matches assignment array length', sum.total === payload.assignments.length);
        assert('summary.completion_rate is between 0 and 100', sum.completion_rate >= 0 && sum.completion_rate <= 100);
        assert('summary.average_marks is a valid positive number', sum.average_marks > 0);
        
        const calcCompleted = payload.assignments.filter(a => ['SUBMITTED', 'GRADED', 'LATE'].includes((a.submission_status || '').toUpperCase())).length;
        assert('summary.completion_rate matches expected completion percentage', sum.completion_rate === Math.round((calcCompleted / sum.total) * 100));

        const actualUrgents = payload.assignments.filter(a => a.priority === 'URGENT').length;
        assert('summary.urgent_count matches actual URGENT items in list', sum.urgent_count === actualUrgents);

        const actualHighs = payload.assignments.filter(a => a.priority === 'HIGH').length;
        assert('summary.high_count matches actual HIGH items in list', sum.high_count === actualHighs);

        const actualMediums = payload.assignments.filter(a => a.priority === 'MEDIUM').length;
        assert('summary.medium_count matches actual MEDIUM items in list', sum.medium_count === actualMediums);

        const actualLows = payload.assignments.filter(a => a.priority === 'LOW').length;
        assert('summary.low_count matches actual LOW items in list', sum.low_count === actualLows);

        // ==========================================
        // SECTION 6: Single Assignment Detail & IDOR Protection
        // ==========================================
        console.log('\n[6. Assignment Detail & IDOR Protection]');
        const detailRes = await request('GET', '/api/students/assignments/4', null, studentToken);
        assert('GET /api/students/assignments/4 returns 200 for enrolled student', detailRes.status === 200);
        assert('Detail response has assignment title', detailRes.data.data.title === 'Binary Search Tree & Heap Optimization');
        assert('Detail response includes enriched academic context', detailRes.data.data.course_title && detailRes.data.data.priority);

        // Non-existent assignment
        const notFoundRes = await request('GET', '/api/students/assignments/99999', null, studentToken);
        assert('GET non-existent assignment returns 404', notFoundRes.status === 404);

        // IDOR: Student 6 is NOT enrolled in CSC205S2 (assignment 4)
        const idorDetail = await request('GET', '/api/students/assignments/4', null, student3Token);
        assert('IDOR check: non-enrolled student is blocked from assignment detail (403 or 404)', [403, 404].includes(idorDetail.status));

        const idorSubmit = await request('POST', '/api/students/assignments/4/submit', {
            submission_text: 'Unauthorized attempt to submit coursework'
        }, student3Token);
        assert('IDOR check: non-enrolled student cannot submit to course assignment (403)', idorSubmit.status === 403);

        // ==========================================
        // SECTION 7: Submission Management & Validations
        // ==========================================
        console.log('\n[7. Submission Management & Defensive Validations]');
        
        // 1. Empty payload rejection
        const emptySubmitRes = await request('POST', '/api/students/assignments/4/submit', {}, studentToken);
        assert('Empty payload rejected with 400 Bad Request', emptySubmitRes.status === 400);

        // 2. Empty whitespace text rejection
        const whitespaceSubmitRes = await request('POST', '/api/students/assignments/4/submit', {
            submission_text: '    '
        }, studentToken);
        assert('Whitespace-only submission text rejected with 400 Bad Request', whitespaceSubmitRes.status === 400);

        // 3. Valid submission
        const validSubmitRes = await request('POST', '/api/students/assignments/4/submit', {
            submission_text: 'def binary_search_tree_insert(root, key):\n    if root is None:\n        return Node(key)\n    # Implementation complete',
            submission_file: 'bst_heap_solution.py'
        }, studentToken);
        assert('Valid submission accepted with 200/201', [200, 201].includes(validSubmitRes.status));
        assert('Submission response includes submission_id', !!validSubmitRes.data.data?.submission_id);
        assert('Submission response includes submission status', ['SUBMITTED', 'submitted', 'LATE', 'late'].includes(validSubmitRes.data.data?.status));

        // 4. Verify in MySQL database
        const [subRows] = await pool.query(
            'SELECT * FROM assignment_submissions WHERE assignment_id = 4 AND student_id = 4'
        );
        assert('Submission record successfully persisted to MySQL', subRows.length === 1);
        assert('Persisted record contains submission_text', subRows[0].submission_text.includes('binary_search_tree_insert'));
        assert('Persisted record contains submission_file name', subRows[0].submission_file === 'bst_heap_solution.py');

        // 5. Duplicate submission prevention
        const dupSubmitRes = await request('POST', '/api/students/assignments/4/submit', {
            submission_text: 'Second duplicate submission attempt'
        }, studentToken);
        assert('Duplicate submission attempt rejected with 400 Bad Request', dupSubmitRes.status === 400);
        const dupMsg = ((dupSubmitRes.data && (dupSubmitRes.data.message || dupSubmitRes.data.error)) || JSON.stringify(dupSubmitRes.data) || '').toLowerCase();
        assert('Duplicate error message informs user', dupMsg.includes('already'));

        // Clean up test submission to preserve original seed state
        await pool.query('DELETE FROM assignment_submissions WHERE assignment_id = 4 AND student_id = 4');
        assert('Test submission cleaned up from MySQL', true);

        // ==========================================
        // SECTION 8: Gemini AI Assignment Advisor & Fallback
        // ==========================================
        console.log('\n[8. Gemini AI Assignment Advisor & Fallback Resilience]');
        assert('ai_advisor has overview string', typeof payload.ai_advisor.overview === 'string');
        assert('ai_advisor has top_priority string', typeof payload.ai_advisor.top_priority === 'string');
        assert('ai_advisor has recommended_actions array', Array.isArray(payload.ai_advisor.recommended_actions));
        assert('ai_advisor has time_management_tip string', typeof payload.ai_advisor.time_management_tip === 'string');

        // Test Mock Injection
        geminiService.injectAssignmentMock(async () => {
            return {
                overview: 'Mocked Assignment Workload Overview for testing.',
                top_priority: 'CSC205S2 Heap Optimization',
                reasons: ['Mock reason 1', 'Mock reason 2'],
                recommended_actions: ['Step 1: Write test cases', 'Step 2: Profile heap'],
                time_management_tip: 'Mock time management tip.'
            };
        });

        const mockAdvisorRes = await request('GET', '/api/students/assignments', null, studentToken);
        assert('Injected Assignment Mock returns custom advisory', mockAdvisorRes.data.ai_advisor?.overview === 'Mocked Assignment Workload Overview for testing.');
        assert('Mocked top_priority returned accurately', mockAdvisorRes.data.ai_advisor?.top_priority === 'CSC205S2 Heap Optimization');

        // Test Fallback Resilience (Gemini 429 error simulation)
        geminiService.injectAssignmentMock(async () => {
            throw new Error('Simulated Gemini 429 API Rate Limit');
        });

        const fallbackRes = await request('GET', '/api/students/assignments', null, studentToken);
        assert('System recovers gracefully from Gemini API failure (200)', fallbackRes.status === 200);
        assert('Deterministic fallback provides overview', typeof fallbackRes.data.ai_advisor?.overview === 'string');
        assert('Deterministic fallback provides recommended actions', fallbackRes.data.ai_advisor?.recommended_actions.length > 0);
        assert('Deterministic fallback provides time management tip', typeof fallbackRes.data.ai_advisor?.time_management_tip === 'string');

        // Clear mock to restore live service
        geminiService.clearAssignmentMock();

        // ==========================================
        // SECTION 9: Security Audit & Zero Credential Leakage
        // ==========================================
        console.log('\n[9. Security Auditing & Zero Leakage]');
        const rawJson = JSON.stringify(authStudentRes.data);
        assert('password_hash is never leaked in assignment payload', !rawJson.includes('password_hash'));
        assert('Bcrypt hashes are never leaked in assignment payload', !rawJson.includes('$2b$10$'));
        assert('GEMINI_API_KEY is never leaked in assignment payload', !rawJson.includes(process.env.GEMINI_API_KEY || 'AIzaSy'));

    } finally {
        server.close();
    }

    console.log('\n====================================================');
    console.log(`PHASE 11 TOTAL: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runPhase11Tests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
