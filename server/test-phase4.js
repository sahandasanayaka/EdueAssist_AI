/**
 * EduAssistAI Phase 4 Automated Verification Suite
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

async function runTests() {
    console.log('====================================================');
    console.log('   EDUASSIST AI - PHASE 4 VERIFICATION SUITE       ');
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

    const testPort = 5199;
    server = app.listen(testPort);
    baseUrl = `http://localhost:${testPort}`;

    let studentToken = null;
    let studentId = null;
    let atRiskStudentToken = null;
    let lecturerToken = null;
    let lecturerId = null;
    let adminToken = null;
    let adminId = null;

    try {
        // ==========================================
        // 1. AUTHENTICATION & PROFILE TESTS
        // ==========================================
        console.log('\n[1. Authentication & Profile Tests]');
        
        // 1a. Login valid student
        const sLogin = await request('POST', '/api/auth/login', { username: '2023CSCA001', password: 'password123' });
        assert('Student login succeeds (200)', sLogin.status === 200);
        assert('Student token returned', !!sLogin.data.token);
        assert('User role is student', sLogin.data.user?.role === 'student');
        studentToken = sLogin.data.token;
        studentId = sLogin.data.user?.id;

        // 1b. Login at-risk student
        const arLogin = await request('POST', '/api/auth/login', { username: '2023CSCA003', password: 'password123' });
        assert('At-risk student login succeeds (200)', arLogin.status === 200);
        atRiskStudentToken = arLogin.data.token;

        // 1c. Login valid lecturer
        const lLogin = await request('POST', '/api/auth/login', { username: 'Lec001', password: 'password123' });
        assert('Lecturer login succeeds (200)', lLogin.status === 200);
        lecturerToken = lLogin.data.token;
        lecturerId = lLogin.data.user?.id;

        // 1d. Login valid admin
        const aLogin = await request('POST', '/api/auth/login', { username: 'admin01', password: 'password123' });
        assert('Admin login succeeds (200)', aLogin.status === 200);
        adminToken = aLogin.data.token;
        adminId = aLogin.data.user?.id;

        // 1e. Login invalid credentials
        const badLogin = await request('POST', '/api/auth/login', { username: '2023CSCA001', password: 'wrongpassword' });
        assert('Invalid credentials rejected (401)', badLogin.status === 401);

        // 1f. GET /api/auth/me with valid token
        const meRes = await request('GET', '/api/auth/me', null, studentToken);
        assert('GET /api/auth/me succeeds (200)', meRes.status === 200);
        assert('Username is 2023CSCA001', meRes.data.data?.username === '2023CSCA001');
        assert('Student profile returned', !!meRes.data.data?.profile?.fullName);
        assert('Password hash never exposed in /me', meRes.data.data?.password_hash === undefined);

        // 1g. Protected route without token
        const noTokenRes = await request('GET', '/api/auth/me');
        assert('Missing token rejected (401)', noTokenRes.status === 401);

        // 1h. Protected route with invalid token
        const badTokenRes = await request('GET', '/api/auth/me', null, 'malformed.invalid.token');
        assert('Invalid token rejected (401)', badTokenRes.status === 401);

        // ==========================================
        // 2. STUDENT API TESTS
        // ==========================================
        console.log('\n[2. Student API Tests]');

        // 2a. Student Dashboard
        const dashRes = await request('GET', '/api/students/dashboard', null, studentToken);
        assert('Student dashboard responds 200', dashRes.status === 200);
        assert('Dashboard has real GPA', typeof dashRes.data.data?.gpa === 'number' && dashRes.data.data?.gpa > 0);
        assert('Dashboard has attendance percentage', typeof dashRes.data.data?.attendance === 'number');
        assert('Dashboard has enrolled courses list', Array.isArray(dashRes.data.data?.enrolled_courses) && dashRes.data.data.enrolled_courses.length > 0);
        assert('Dashboard has recent exams', Array.isArray(dashRes.data.data?.recent_exams));
        assert('Dashboard has assignments summary', typeof dashRes.data.data?.assignments_summary?.total === 'number');
        assert('Dashboard has study plan tasks', Array.isArray(dashRes.data.data?.study_plan));

        // 2b. Student Courses
        const coursesRes = await request('GET', '/api/students/courses', null, studentToken);
        assert('Student courses responds 200', coursesRes.status === 200);
        assert('Returns array of courses', Array.isArray(coursesRes.data.data) && coursesRes.data.data.length > 0);
        assert('Course contains code, title, credits, lecturer_name', 
            !!coursesRes.data.data[0].code && !!coursesRes.data.data[0].title && !!coursesRes.data.data[0].credits);

        // 2c. Student Attendance
        const attRes = await request('GET', '/api/students/attendance', null, studentToken);
        assert('Student attendance responds 200', attRes.status === 200);
        assert('Attendance contains course details', Array.isArray(attRes.data.data?.courses));
        assert('Attendance contains overall_percentage', typeof attRes.data.data?.overall_percentage === 'number');

        // 2d. Student Assignments
        const assignRes = await request('GET', '/api/students/assignments', null, studentToken);
        assert('Student assignments responds 200', assignRes.status === 200);
        assert('Returns assignments array', Array.isArray(assignRes.data.data) && assignRes.data.data.length > 0);
        assert('Assignment has submission status', !!assignRes.data.data[0].submission_status);

        // 2e. Assignment Submission
        const assignmentToSubmit = assignRes.data.data[0];
        // Clean any existing submission for test idempotency
        await pool.query('DELETE FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?', [assignmentToSubmit.id, studentId]);

        const submitRes = await request('POST', `/api/students/assignments/${assignmentToSubmit.id}/submit`, {
            submission_file: 'student_solution.pdf'
        }, studentToken);
        assert('Assignment submit responds 201', submitRes.status === 201);
        assert('Submission marked as submitted', submitRes.data.data?.status === 'submitted' || submitRes.data.data?.status === 'late');

        // Verify duplicate submission prevention
        const dupSubmitRes = await request('POST', `/api/students/assignments/${assignmentToSubmit.id}/submit`, {}, studentToken);
        assert('Duplicate assignment submit rejected (400)', dupSubmitRes.status === 400);

        // 2f. Student Growth
        const growthRes = await request('GET', '/api/students/growth', null, studentToken);
        assert('Student growth responds 200', growthRes.status === 200);
        assert('Growth data contains current_gpa', typeof growthRes.data.data?.current_gpa === 'number');
        assert('Growth data contains course_performance', Array.isArray(growthRes.data.data?.course_performance));
        assert('Growth data contains skills', Array.isArray(growthRes.data.data?.skills));

        // 2g. Study Plan
        const planRes = await request('GET', '/api/students/study-plan', null, studentToken);
        assert('Study plan responds 200', planRes.status === 200);
        assert('Study plan returns tasks', Array.isArray(planRes.data.data) && planRes.data.data.length > 0);
        const taskToToggle = planRes.data.data[0];

        // 2h. Study Plan Task Toggle
        const toggleRes = await request('PUT', `/api/students/study-plan/${taskToToggle.id}/toggle`, null, studentToken);
        assert('Study plan toggle responds 200', toggleRes.status === 200);
        assert('Task status toggled', toggleRes.data.data?.status !== taskToToggle.status);

        // Verify persistence in DB
        const [persistedTask] = await pool.query('SELECT status FROM study_plan_tasks WHERE id = ?', [taskToToggle.id]);
        assert('Task toggle persisted in MySQL', persistedTask[0].status === toggleRes.data.data?.status);

        // 2i. Career Hub
        const careerRes = await request('GET', '/api/students/career-hub', null, studentToken);
        assert('Career hub responds 200', careerRes.status === 200);
        assert('Career paths listed', Array.isArray(careerRes.data.data?.career_paths) && careerRes.data.data.career_paths.length > 0);
        assert('Student skills listed', Array.isArray(careerRes.data.data?.student_skills));

        // 2j. Career Goal Update
        const targetPath = careerRes.data.data.career_paths[0];
        const updateGoalRes = await request('PUT', '/api/students/career-goal', {
            career_path_id: targetPath.id,
            target_role: 'Senior Full Stack Engineer',
            target_timeline: '18 months'
        }, studentToken);
        assert('Career goal update responds 200', updateGoalRes.status === 200);

        // Verify career goal persistence in DB
        const [persistedGoal] = await pool.query('SELECT target_role, target_timeline FROM career_goals WHERE student_id = ?', [studentId]);
        assert('Career goal persisted in MySQL', persistedGoal[0]?.target_role === 'Senior Full Stack Engineer');

        // 2k. Course Materials / Resources
        const resRes = await request('GET', '/api/students/resources', null, studentToken);
        assert('Resources endpoint responds 200', resRes.status === 200);
        assert('Resources array returned', Array.isArray(resRes.data.data) && resRes.data.data.length > 0);

        // 2l. AI Chat & Chat History Persistence
        const chatRes = await request('POST', '/api/students/chat', {
            message: 'What is my current academic status?',
            session_id: 'test_session_1'
        }, studentToken);
        assert('AI Chat responds 200', chatRes.status === 200);
        assert('AI Chat returns reply', !!chatRes.data.reply);

        // Verify chat stored in ai_chat_history
        const [chatHistory] = await pool.query(
            'SELECT message, sender FROM ai_chat_history WHERE student_id = ? AND session_id = "test_session_1" ORDER BY id DESC LIMIT 2',
            [studentId]
        );
        assert('User message persisted to ai_chat_history', chatHistory.some(c => c.sender === 'user'));
        assert('AI response persisted to ai_chat_history', chatHistory.some(c => c.sender === 'ai'));

        const histRes = await request('GET', '/api/students/chat/history?session_id=test_session_1', null, studentToken);
        assert('GET /api/students/chat/history responds 200', histRes.status === 200);
        assert('Chat history returns messages array', Array.isArray(histRes.data.data) && histRes.data.data.length >= 2);

        // ==========================================
        // 3. SECURITY & ACCESS CONTROL TESTS
        // ==========================================
        console.log('\n[3. Security & Access Control Tests]');

        // 3a. Student cannot access admin endpoints
        const sToAdmin = await request('GET', '/api/admin/dashboard', null, studentToken);
        assert('Student blocked from /api/admin/dashboard (403)', sToAdmin.status === 403);

        const sToAdminUsers = await request('GET', '/api/admin/users', null, studentToken);
        assert('Student blocked from /api/admin/users (403)', sToAdminUsers.status === 403);

        // 3b. Student cannot access lecturer endpoints
        const sToLec = await request('GET', '/api/lecturers/dashboard', null, studentToken);
        assert('Student blocked from /api/lecturers/dashboard (403)', sToLec.status === 403);

        // 3c. Lecturer cannot access admin endpoints
        const lToAdmin = await request('GET', '/api/admin/dashboard', null, lecturerToken);
        assert('Lecturer blocked from /api/admin/dashboard (403)', lToAdmin.status === 403);

        // 3d. Lecturer cannot access student endpoints
        const lToStudent = await request('GET', '/api/students/dashboard', null, lecturerToken);
        assert('Lecturer blocked from /api/students/dashboard (403)', lToStudent.status === 403);

        // 3e. IDOR Protection: Student cannot toggle another student's study plan task
        // Find a task belonging to at-risk student
        const [otherStudentTasks] = await pool.query('SELECT id FROM study_plan_tasks WHERE student_id != ? LIMIT 1', [studentId]);
        if (otherStudentTasks.length > 0) {
            const foreignTaskId = otherStudentTasks[0].id;
            const idorToggle = await request('PUT', `/api/students/study-plan/${foreignTaskId}/toggle`, null, studentToken);
            assert('Student blocked from toggling another student task (404/IDOR)', idorToggle.status === 404);
        }

        // ==========================================
        // 4. LECTURER API TESTS
        // ==========================================
        console.log('\n[4. Lecturer API Tests]');

        // 4a. Lecturer Dashboard
        const lecDash = await request('GET', '/api/lecturers/dashboard', null, lecturerToken);
        assert('Lecturer dashboard responds 200', lecDash.status === 200);
        assert('Lecturer dashboard has profile', !!lecDash.data.data?.profile?.full_name);
        assert('Lecturer dashboard has courses array', Array.isArray(lecDash.data.data?.courses));

        // 4b. Lecturer Courses
        const lecCourses = await request('GET', '/api/lecturers/courses', null, lecturerToken);
        assert('Lecturer courses responds 200', lecCourses.status === 200);
        assert('Lecturer courses returns array', Array.isArray(lecCourses.data.data) && lecCourses.data.data.length > 0);
        const assignedCourseCode = lecCourses.data.data[0].code;

        // 4c. Lecturer Course Students (valid course)
        const courseStudents = await request('GET', `/api/lecturers/courses/${assignedCourseCode}/students`, null, lecturerToken);
        assert('Lecturer course students responds 200', courseStudents.status === 200);
        assert('Returns students array', Array.isArray(courseStudents.data.data));

        // 4d. IDOR Protection: Lecturer accessing students of a course NOT taught by them
        const [unassignedCourses] = await pool.query('SELECT code FROM courses WHERE lecturer_id != ? OR lecturer_id IS NULL LIMIT 1', [lecturerId]);
        if (unassignedCourses.length > 0) {
            const unassignedCode = unassignedCourses[0].code;
            const unassignedRes = await request('GET', `/api/lecturers/courses/${unassignedCode}/students`, null, lecturerToken);
            assert('Lecturer blocked from viewing unassigned course students (403/IDOR)', unassignedRes.status === 403);
        }

        // ==========================================
        // 5. ADMIN API TESTS
        // ==========================================
        console.log('\n[5. Admin API Tests]');

        // 5a. Admin Dashboard
        const adminDash = await request('GET', '/api/admin/dashboard', null, adminToken);
        assert('Admin dashboard responds 200', adminDash.status === 200);
        assert('Dashboard has real metrics', typeof adminDash.data.data?.metrics?.total_users === 'number');
        assert('Total users > 0', adminDash.data.data?.metrics?.total_users > 0);

        // 5b. Admin Users list
        const adminUsers = await request('GET', '/api/admin/users', null, adminToken);
        assert('Admin users responds 200', adminUsers.status === 200);
        assert('Users list returned', Array.isArray(adminUsers.data.data) && adminUsers.data.data.length > 0);
        assert('Password hash never exposed in users list', adminUsers.data.data[0].password_hash === undefined);

        // 5c. Admin User Creation & Validation
        const newTestReg = `test_stu_${Date.now()}`;
        // Clean any existing test user
        await pool.query('DELETE FROM users WHERE reg_number LIKE "test_stu_%"');

        const badCreate = await request('POST', '/api/admin/users', {
            reg_number: '',
            password: '123'
        }, adminToken);
        assert('Invalid user creation rejected (400)', badCreate.status === 400);

        const createRes = await request('POST', '/api/admin/users', {
            reg_number: newTestReg,
            password: 'password123',
            role: 'student',
            full_name: 'Test Automation Student',
            email: `${newTestReg}@uni.edu`,
            department: 'Computer Science'
        }, adminToken);
        assert('Admin create user responds 201', createRes.status === 201);
        const createdUserId = createRes.data.data?.id;

        // Verify created in DB
        const [createdInDb] = await pool.query('SELECT id, reg_number FROM users WHERE id = ?', [createdUserId]);
        assert('New user persisted in MySQL users table', createdInDb.length > 0);

        const [createdProfile] = await pool.query('SELECT full_name FROM students WHERE user_id = ?', [createdUserId]);
        assert('New student profile persisted in MySQL students table', createdProfile.length > 0 && createdProfile[0].full_name === 'Test Automation Student');

        // 5d. Admin User Deletion
        const deleteRes = await request('DELETE', `/api/admin/users/${createdUserId}`, null, adminToken);
        assert('Admin delete user responds 200', deleteRes.status === 200);

        // Verify deleted in DB
        const [deletedCheck] = await pool.query('SELECT id FROM users WHERE id = ?', [createdUserId]);
        assert('Deleted user removed from MySQL', deletedCheck.length === 0);

        // 5e. Prevent root admin deletion
        const rootDelRes = await request('DELETE', '/api/admin/users/1', null, adminToken);
        assert('Root administrator deletion rejected (400)', rootDelRes.status === 400);

    } catch (err) {
        console.error('Unexpected test error:', err);
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
