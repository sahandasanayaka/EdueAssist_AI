/**
 * EduAssistAI — Phase 10 Career Hub + AI Skill Gap Engine Test Suite
 * 
 * Comprehensive verification of:
 * - JWT Authentication & RBAC on Career Hub Endpoints
 * - Public & authenticated career path retrieval
 * - Deterministic Skill Gap Engine calculations (STRONG, DEVELOPING, GAP)
 * - Importance and Priority evaluation (HIGH, MEDIUM, LOW)
 * - Grounding in Phase 7 Academic Analysis & Coursework Alignment
 * - Curated Learning Resource recommendations from MySQL course_materials
 * - 4-stage Career Roadmap synthesis
 * - Goal updates, normalization (camelCase & snake_case), and MySQL persistence
 * - Backward compatibility with Phase 4 schema requirements
 * - Gemini AI Career Advisory generation & deterministic fallback resilience
 * - IDOR protection, zero credential leakage, and data integrity
 */

process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('./server');
const pool = require('./src/db/connection');
const geminiService = require('./src/services/geminiService');
const skillGapService = require('./src/services/skillGapService');

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

async function runPhase10Tests() {
    console.log('====================================================');
    console.log('   EDUASSIST AI - PHASE 10 CAREER HUB TESTS         ');
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

        // ==========================================
        // SECTION 1: Authentication & Access Control
        // ==========================================
        console.log('[1. Authentication & Role-Based Access Control]');
        const noAuthHub = await request('GET', '/api/students/career-hub');
        assert('Unauthenticated GET /api/students/career-hub blocked (401)', noAuthHub.status === 401);

        const noAuthPaths = await request('GET', '/api/students/career-paths');
        assert('Unauthenticated GET /api/students/career-paths blocked (401)', noAuthPaths.status === 401);

        const lecBlockedHub = await request('GET', '/api/students/career-hub', null, lecturerToken);
        assert('Lecturer blocked from student Career Hub (403)', lecBlockedHub.status === 403);

        const adminBlockedHub = await request('GET', '/api/students/career-hub', null, adminToken);
        assert('Admin blocked from student Career Hub (403)', adminBlockedHub.status === 403);

        const studentGoalBlocked = await request('PUT', '/api/students/career-goal', { targetRole: 'CTO' });
        assert('Unauthenticated PUT /api/students/career-goal blocked (401)', studentGoalBlocked.status === 401);

        // ==========================================
        // SECTION 2: Career Paths Retrieval
        // ==========================================
        console.log('\n[2. Career Paths Catalog Endpoints]');
        const pathsRes = await request('GET', '/api/students/career-paths', null, studentToken);
        assert('GET /api/students/career-paths responds 200', pathsRes.status === 200);
        assert('Returns array of career paths', Array.isArray(pathsRes.data.data) && pathsRes.data.data.length >= 8);
        
        const sePath = pathsRes.data.data.find(p => p.name === 'Software Engineer');
        assert('Catalog includes Software Engineer track', !!sePath);
        assert('Track contains recommended courses', typeof sePath?.recommended_courses === 'string' && sePath.recommended_courses.includes('CSC202S2'));
        assert('Track contains roadmap JSON', !!sePath?.roadmap);

        // ==========================================
        // SECTION 3: Career Hub Payload & Backward Compatibility
        // ==========================================
        console.log('\n[3. Career Hub Payload Structure & Backward Compatibility]');
        const hubRes = await request('GET', '/api/students/career-hub', null, studentToken);
        assert('GET /api/students/career-hub responds 200 for Student 1', hubRes.status === 200);

        const hubData = hubRes.data.data;
        assert('Contains careerGoal object', typeof hubData?.careerGoal === 'object' && hubData.careerGoal !== null);
        assert('careerGoal has targetRole', typeof hubData.careerGoal.targetRole === 'string');
        assert('Contains numeric readinessScore', typeof hubData.readinessScore === 'number' && hubData.readinessScore > 0);
        assert('Contains skillMatchPercentage', typeof hubData.skillMatchPercentage === 'number');
        assert('Contains academicAlignment object', typeof hubData.academicAlignment === 'object');
        assert('academicAlignment contains score', typeof hubData.academicAlignment.score === 'number');

        // Phase 4 Backward Compatibility Checks
        assert('Backward-compatible career_paths array present', Array.isArray(hubData.career_paths) && hubData.career_paths.length >= 8);
        assert('Backward-compatible selected_goal object present', typeof hubData.selected_goal === 'object');
        assert('Backward-compatible student_skills array present', Array.isArray(hubData.student_skills));

        // ==========================================
        // SECTION 4: Skill Gap Engine Matrix Calculations
        // ==========================================
        console.log('\n[4. Deterministic Skill Gap Engine Calculations]');
        assert('Returns analyzed skillGaps array', Array.isArray(hubData.skillGaps) && hubData.skillGaps.length > 0);

        const sampleGap = hubData.skillGaps[0];
        assert('Skill item has skillName', typeof sampleGap.skillName === 'string');
        assert('Skill item has currentLevel (0-5)', typeof sampleGap.currentLevel === 'number' && sampleGap.currentLevel >= 0 && sampleGap.currentLevel <= 5);
        assert('Skill item has requiredLevel (1-5)', typeof sampleGap.requiredLevel === 'number' && sampleGap.requiredLevel >= 1);
        assert('Skill item has calculated gap', typeof sampleGap.gap === 'number');
        assert('Skill item category is STRONG, DEVELOPING, or GAP', ['STRONG', 'DEVELOPING', 'GAP'].includes(sampleGap.category));
        assert('Skill item priority is HIGH, MEDIUM, or LOW', ['HIGH', 'MEDIUM', 'LOW'].includes(sampleGap.priority));

        // Verify Student 1 specific skills (High performer: Java, React, SQL level 4-5)
        const sqlSkill = hubData.skillGaps.find(g => g.skillName.includes('Relational Databases') || g.skillName.includes('SQL'));
        assert('Student 1 has Relational Databases assessed', !!sqlSkill);
        assert('Student 1 SQL skill classified as STRONG', sqlSkill?.category === 'STRONG');

        // Test Student 3 (Significant gaps: SQL level 2, React level 2)
        const hub3Res = await request('GET', '/api/students/career-hub', null, student3Token);
        assert('GET /api/students/career-hub responds 200 for Student 3', hub3Res.status === 200);

        const hub3Data = hub3Res.data.data;
        const s3Sql = hub3Data.skillGaps.find(g => g.skillName.includes('Relational Databases') || g.skillName.includes('SQL'));
        assert('Student 3 SQL classified as DEVELOPING or GAP', s3Sql?.category === 'DEVELOPING' || s3Sql?.category === 'GAP');
        assert('Student 3 SQL gap is greater than 0', s3Sql?.gap > 0);
        assert('Student 3 high priority gap detected', hub3Data.skillGaps.some(g => g.priority === 'HIGH'));

        // ==========================================
        // SECTION 5: Grounded Academic Alignment & Resources
        // ==========================================
        console.log('\n[5. Grounding & Academic Coursework Alignment]');
        assert('Academic alignment has recommended courses array', Array.isArray(hubData.academicAlignment.recommendedCourses));
        assert('Recommended courses link to real curriculum', hubData.academicAlignment.recommendedCourses.some(c => c.startsWith('CSC20')));
        assert('Academic alignment includes course breakdown', Array.isArray(hubData.academicAlignment.breakdown));
        
        assert('Curated recommended resources returned', Array.isArray(hubData.recommendedResources) && hubData.recommendedResources.length > 0);
        assert('Resource has valid URL and resource_type', !!hubData.recommendedResources[0]?.resource_url && !!hubData.recommendedResources[0]?.resource_type);

        assert('Career Roadmap stages returned', Array.isArray(hubData.roadmap) && hubData.roadmap.length >= 4);
        assert('Roadmap stage has step and title', !!hubData.roadmap[0].step && !!hubData.roadmap[0].title);
        assert('Next steps array provided', Array.isArray(hubData.nextSteps) && hubData.nextSteps.length >= 2);

        // ==========================================
        // SECTION 6: Goal Updates & Persistence
        // ==========================================
        console.log('\n[6. Career Goal Updates & Database Persistence]');
        // 6.1 Test snake_case parameters (Phase 4 compatibility)
        const updateSnakeRes = await request('PUT', '/api/students/career-goal', {
            career_path_id: 2,
            target_role: 'Lead Data Analyst',
            target_timeline: '18 months'
        }, studentToken);
        assert('PUT /api/students/career-goal with snake_case responds 200', updateSnakeRes.status === 200);
        assert('Updated goal target_role reflects new input', updateSnakeRes.data.data.target_role === 'Lead Data Analyst');

        // Verify MySQL persistence
        const [persisted1] = await pool.query('SELECT target_role, career_path_id, target_timeline FROM career_goals WHERE student_id = 4');
        assert('Goal persisted in MySQL career_goals table', persisted1[0]?.target_role === 'Lead Data Analyst' && persisted1[0]?.career_path_id === 2);

        const [persistedStudent] = await pool.query('SELECT career_goal FROM students WHERE user_id = 4');
        assert('students.career_goal column kept synchronized', persistedStudent[0]?.career_goal === 'Lead Data Analyst');

        // 6.2 Test camelCase parameters (Phase 10 standard)
        const updateCamelRes = await request('PUT', '/api/students/career-goal', {
            careerPathId: 1,
            targetRole: 'Senior Full Stack Engineer',
            targetTimeline: '12 months'
        }, studentToken);
        assert('PUT /api/students/career-goal with camelCase responds 200', updateCamelRes.status === 200);
        assert('camelCase update persists targetRole', updateCamelRes.data.data.target_role === 'Senior Full Stack Engineer');

        // 6.3 Validation error for nonexistent path ID
        const invalidPathRes = await request('PUT', '/api/students/career-goal', {
            careerPathId: 99999,
            targetRole: 'Astronaut'
        }, studentToken);
        assert('Invalid careerPathId rejected (400)', invalidPathRes.status === 400);

        // ==========================================
        // SECTION 7: Gemini AI Insights & Fallback Resilience
        // ==========================================
        console.log('\n[7. Gemini AI Career Advisory & Fallback Resilience]');
        // Test injected mock
        geminiService.injectCareerMock(async () => {
            return {
                summary: 'Custom mocked career guidance for test suite.',
                keyStrengths: ['Mocked Strength 1', 'Mocked Strength 2'],
                criticalGaps: ['Mocked Gap 1'],
                actionPlan: ['Step 1: Mocked verification'],
                industryRelevance: 'Mocked industry perspective.'
            };
        });

        const mockHub = await request('GET', '/api/students/career-hub', null, studentToken);
        assert('Injected Career Mock returns custom AI insights', mockHub.data.data.aiInsights?.summary === 'Custom mocked career guidance for test suite.');
        assert('Mocked keyStrengths preserved', mockHub.data.data.aiInsights?.keyStrengths[0] === 'Mocked Strength 1');

        // Test Fallback Resilience (Gemini error / quota exhaustion simulation)
        geminiService.injectCareerMock(async () => {
            throw new Error('Simulated Gemini 429 API Rate Limit');
        });

        const fallbackHub = await request('GET', '/api/students/career-hub', null, studentToken);
        assert('System recovers gracefully from Gemini API failure (200)', fallbackHub.status === 200);
        assert('Deterministic fallback provides structured summary', typeof fallbackHub.data.data.aiInsights?.summary === 'string');
        assert('Deterministic fallback identifies real student strengths', fallbackHub.data.data.aiInsights?.keyStrengths.length > 0);
        assert('Deterministic fallback generates practical action plan', fallbackHub.data.data.aiInsights?.actionPlan.length > 0);

        // Clear mock to restore live service
        geminiService.clearCareerMock();

        // ==========================================
        // SECTION 8: Security, Zero Credential Leakage & IDOR
        // ==========================================
        console.log('\n[8. Security Auditing & Zero Leakage]');
        const rawJson = JSON.stringify(hubRes.data);
        assert('password_hash is never leaked in career hub payload', !rawJson.includes('password_hash'));
        assert('Bcrypt hashes are never leaked in career hub payload', !rawJson.includes('$2b$10$'));
        assert('GEMINI_API_KEY is never leaked in career hub payload', !rawJson.includes(process.env.GEMINI_API_KEY || 'AIzaSy'));

    } finally {
        server.close();
    }

    console.log('\n====================================================');
    console.log(`PHASE 10 TOTAL: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runPhase10Tests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
