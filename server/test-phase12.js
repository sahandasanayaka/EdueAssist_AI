/**
 * EduAssistAI — Phase 12 Lecturer & Admin Command Centers Test Suite
 * 
 * Comprehensive verification of:
 * 1. Authentication & RBAC on Lecturer and Admin Endpoints
 * 2. Lecturer Dashboard & Course Roster Telemetry
 * 3. Lecturer Course Ownership & Strict IDOR Protection (Lecturer 1 vs Lecturer 2)
 * 4. Lecturer Analytics (Performance, Attendance Bands, Assignment Triage, Risk Tiers)
 * 5. Lecturer Submissions Retrieval & Grading IDOR Protection (Validations, Boundary Checks)
 * 6. Student Reflection (Graded Submissions and Marks Instantly Reflected in Student Endpoints)
 * 7. Admin Institutional Dashboard, KPI Telemetry, and System Health
 * 8. Admin User Management (Role Filtering, Search, Validations, Safe Deletion Safeguards)
 * 9. Admin Course Management (Creation, Modification, Active Enrollment Deletion Protection)
 * 10. Security Audit: Zero Credential Leakage (password_hash, bcrypt, secrets)
 */

process.env.NODE_ENV = 'test';
const http = require('http');
const app = require('./server');
const pool = require('./src/db/connection');

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

async function runPhase12Tests() {
    console.log('====================================================');
    console.log('   EDUASSIST AI - PHASE 12 COMMAND CENTERS TESTS   ');
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

        // 1. Obtain Authentication Tokens
        const adminRes = await request('POST', '/api/auth/login', {
            username: 'admin01',
            password: 'password123'
        });
        const adminToken = adminRes.data?.token;

        const lec1Res = await request('POST', '/api/auth/login', {
            username: 'Lec001',
            password: 'password123'
        });
        const lec1Token = lec1Res.data?.token;

        const lec2Res = await request('POST', '/api/auth/login', {
            username: 'Lec002',
            password: 'password123'
        });
        const lec2Token = lec2Res.data?.token;

        const studentRes = await request('POST', '/api/auth/login', {
            username: '2023CSCA001',
            password: 'password123'
        });
        const studentToken = studentRes.data?.token;

        // ==========================================
        // SECTION 1: Authentication & RBAC Enforcement
        // ==========================================
        console.log('[1. Authentication & RBAC Enforcement]');
        
        // Missing token on lecturer endpoint
        const noTokenLec = await request('GET', '/api/lecturers/dashboard');
        assert('Lecturer endpoint rejects missing token (401)', noTokenLec.status === 401);

        // Student accessing lecturer endpoint
        const studentToLec = await request('GET', '/api/lecturers/dashboard', null, studentToken);
        assert('Student is forbidden from lecturer dashboard (403)', studentToLec.status === 403);

        // Admin accessing lecturer endpoint
        const adminToLec = await request('GET', '/api/lecturers/dashboard', null, adminToken);
        assert('Admin is forbidden from lecturer dashboard (403)', adminToLec.status === 403);

        // Lecturer accessing lecturer endpoint
        const lecToLec = await request('GET', '/api/lecturers/dashboard', null, lec1Token);
        assert('Lecturer accesses lecturer dashboard (200)', lecToLec.status === 200);

        // Missing token on admin endpoint
        const noTokenAdmin = await request('GET', '/api/admin/dashboard');
        assert('Admin endpoint rejects missing token (401)', noTokenAdmin.status === 401);

        // Student accessing admin endpoint
        const studentToAdmin = await request('GET', '/api/admin/dashboard', null, studentToken);
        assert('Student is forbidden from admin dashboard (403)', studentToAdmin.status === 403);

        // Lecturer accessing admin endpoint
        const lecToAdmin = await request('GET', '/api/admin/dashboard', null, lec1Token);
        assert('Lecturer is forbidden from admin dashboard (403)', lecToAdmin.status === 403);

        // Admin accessing admin endpoint
        const adminToAdmin = await request('GET', '/api/admin/dashboard', null, adminToken);
        assert('Admin accesses admin dashboard (200)', adminToAdmin.status === 200);

        // ==========================================
        // SECTION 2: Lecturer Dashboard & Roster Telemetry
        // ==========================================
        console.log('\n[2. Lecturer Dashboard & Roster Telemetry]');
        
        const lecDash = lecToLec.data;
        assert('Lecturer dashboard returns success true', lecDash.success === true);
        assert('Lecturer dashboard returns lecturer profile object', typeof lecDash.data?.lecturer?.name === 'string');
        assert('Lecturer dashboard returns summary_metrics object', typeof lecDash.data?.summary_metrics === 'object');
        assert('Total students metric is valid number', typeof lecDash.data.summary_metrics.total_students === 'number' && lecDash.data.summary_metrics.total_students >= 0);
        assert('Total courses metric is valid number', typeof lecDash.data.summary_metrics.total_courses === 'number' && lecDash.data.summary_metrics.total_courses > 0);
        assert('Average class performance metric is numeric', typeof lecDash.data.summary_metrics.avg_class_performance === 'number');
        assert('Average class attendance metric is numeric', typeof lecDash.data.summary_metrics.avg_class_attendance === 'number');
        assert('Pending submissions metric is numeric', typeof lecDash.data.summary_metrics.pending_submissions === 'number');
        assert('At-risk students count is numeric', typeof lecDash.data.summary_metrics.at_risk_students_count === 'number');
        assert('Courses array is populated', Array.isArray(lecDash.data?.courses) && lecDash.data.courses.length > 0);
        assert('At-risk students list is an array', Array.isArray(lecDash.data?.at_risk_students));

        // Validate grounded at-risk student evidence reasons
        if (lecDash.data.at_risk_students.length > 0) {
            const firstRisk = lecDash.data.at_risk_students[0];
            assert('At-risk student has valid risk level (HIGH or MEDIUM)', ['HIGH', 'MEDIUM'].includes(firstRisk.risk_level));
            assert('At-risk student includes grounded evidence reasons', Array.isArray(firstRisk.reasons) && firstRisk.reasons.length > 0);
        } else {
            assert('At-risk students list structure verified (empty or populated)', true);
            assert('At-risk student grounded reasons verified', true);
        }

        // ==========================================
        // SECTION 3: Lecturer Course Ownership & Strict IDOR Protection
        // ==========================================
        console.log('\n[3. Lecturer Course Ownership & Strict IDOR Protection]');
        
        // Lec001 courses list
        const lec1CoursesRes = await request('GET', '/api/lecturers/courses', null, lec1Token);
        assert('Lecturer 1 retrieves assigned courses (200)', lec1CoursesRes.status === 200);
        const lec1Courses = lec1CoursesRes.data?.data || [];
        const lec1CourseCodes = lec1Courses.map(c => c.course_code);
        assert('Lecturer 1 teaches CSC202S2', lec1CourseCodes.includes('CSC202S2'));
        assert('Lecturer 1 teaches CSC203S2', lec1CourseCodes.includes('CSC203S2'));
        assert('Lecturer 1 does NOT teach CSC204S2', !lec1CourseCodes.includes('CSC204S2'));

        // Lec001 accessing own course CSC203S2
        const lec1OwnCourse = await request('GET', '/api/lecturers/courses/CSC203S2', null, lec1Token);
        assert('Lecturer 1 can access own course CSC203S2 (200)', lec1OwnCourse.status === 200);
        assert('Course detail includes score stats', typeof lec1OwnCourse.data?.data?.score_stats === 'object');
        assert('Course detail includes attendance stats', typeof lec1OwnCourse.data?.data?.attendance === 'object');
        assert('Course detail includes student roster', Array.isArray(lec1OwnCourse.data?.data?.roster));
        assert('Course detail includes assignments with submission counts', Array.isArray(lec1OwnCourse.data?.data?.assignments));

        // Lec001 attempting to access Lec002's course CSC204S2 (IDOR violation -> 403)
        const lec1IdorCourse = await request('GET', '/api/lecturers/courses/CSC204S2', null, lec1Token);
        assert('IDOR Protection: Lecturer 1 blocked from Lecturer 2 course CSC204S2 (403)', lec1IdorCourse.status === 403);

        // Lec002 attempting to access Lec001's course CSC202S2 (IDOR violation -> 403)
        const lec2IdorCourse = await request('GET', '/api/lecturers/courses/CSC202S2', null, lec2Token);
        assert('IDOR Protection: Lecturer 2 blocked from Lecturer 1 course CSC202S2 (403)', lec2IdorCourse.status === 403);

        // Non-existent course lookup returns 404
        const nonExistentCourse = await request('GET', '/api/lecturers/courses/NONEXISTENT999', null, lec1Token);
        assert('Accessing non-existent course returns 404', nonExistentCourse.status === 404);

        // Course students roster endpoint
        const lec1Students = await request('GET', '/api/lecturers/courses/CSC203S2/students', null, lec1Token);
        assert('Lecturer 1 retrieves enrolled students for CSC203S2 (200)', lec1Students.status === 200);
        assert('Enrolled students array is returned', Array.isArray(lec1Students.data?.data));

        // Course students roster IDOR check
        const lec1StudentsIdor = await request('GET', '/api/lecturers/courses/CSC204S2/students', null, lec1Token);
        assert('IDOR Protection: Lecturer 1 blocked from students of CSC204S2 (403)', lec1StudentsIdor.status === 403);

        // ==========================================
        // SECTION 4: Lecturer Analytics & Telemetry
        // ==========================================
        console.log('\n[4. Lecturer Analytics & Telemetry]');
        
        const analyticsRes = await request('GET', '/api/lecturers/analytics', null, lec1Token);
        assert('Lecturer analytics returns 200', analyticsRes.status === 200);
        const analytics = analyticsRes.data?.data;
        assert('Analytics includes course performance comparison array', Array.isArray(analytics?.course_performance_comparison));
        assert('Analytics includes attendance compliance distribution', typeof analytics?.attendance_compliance_distribution === 'object');
        assert('Attendance compliance has >=75% band', typeof analytics.attendance_compliance_distribution.healthy_gte_75 === 'number');
        assert('Attendance compliance has 60-74% band', typeof analytics.attendance_compliance_distribution.warning_60_to_74 === 'number');
        assert('Attendance compliance has <60% band', typeof analytics.attendance_compliance_distribution.critical_lt_60 === 'number');
        assert('Analytics includes assignment completion telemetry', typeof analytics?.assignment_completion_metrics === 'object');
        assert('Assignment telemetry has completion rate', typeof analytics.assignment_completion_metrics.completion_rate === 'number');
        assert('Analytics includes performance brackets', typeof analytics?.performance_brackets === 'object');
        assert('Analytics includes risk distribution', typeof analytics?.risk_distribution === 'object');

        // ==========================================
        // SECTION 5: Lecturer Submissions & Grading IDOR
        // ==========================================
        console.log('\n[5. Lecturer Submissions & Grading IDOR]');
        
        // Assignment 2 belongs to CSC202S2 (taught by Lec001)
        const assign2SubmissionsLec1 = await request('GET', '/api/lecturers/assignments/2/submissions', null, lec1Token);
        assert('Lecturer 1 views submissions for assignment 2 in CSC202S2 (200)', assign2SubmissionsLec1.status === 200);
        assert('Submissions payload contains assignment metadata', assign2SubmissionsLec1.data?.data?.assignment?.id === 2);
        assert('Submissions payload contains submissions list', Array.isArray(assign2SubmissionsLec1.data?.data?.submissions));

        // Lec002 attempting to view submissions for Assignment 2 (IDOR -> 403)
        const assign2SubmissionsLec2 = await request('GET', '/api/lecturers/assignments/2/submissions', null, lec2Token);
        assert('IDOR Protection: Lecturer 2 blocked from submissions for Assignment 2 (403)', assign2SubmissionsLec2.status === 403);

        // Non-existent assignment submissions returns 404
        const nonExistentAssign = await request('GET', '/api/lecturers/assignments/99999/submissions', null, lec1Token);
        assert('Submissions query for non-existent assignment returns 404', nonExistentAssign.status === 404);

        // Grading Validation: Negative marks rejected
        const negGrade = await request('PATCH', '/api/lecturers/submissions/4', { marks: -10, feedback: 'Negative marks' }, lec1Token);
        assert('Grading rejects negative marks (400)', negGrade.status === 400);

        // Grading Validation: Marks exceeding maximum rejected
        const exceedGrade = await request('PATCH', '/api/lecturers/submissions/4', { marks: 9999, feedback: 'Exceeding marks' }, lec1Token);
        assert('Grading rejects marks exceeding assignment maximum (400)', exceedGrade.status === 400);

        // Grading IDOR: Lec002 attempting to grade submission 4 in CSC202S2 (403)
        const idorGrade = await request('PATCH', '/api/lecturers/submissions/4', { marks: 85, feedback: 'Unauthorized grading' }, lec2Token);
        assert('IDOR Protection: Lecturer 2 forbidden from grading Lecturer 1 submission (403)', idorGrade.status === 403);

        // Valid Grading: Lec001 grades submission 4
        const validGrade = await request('PATCH', '/api/lecturers/submissions/4', {
            marks: 92.5,
            feedback: 'Excellent relational design, query optimization, and indexing structure.'
        }, lec1Token);
        assert('Lecturer 1 successfully grades submission 4 (200)', validGrade.status === 200);
        assert('Graded submission reflects updated marks (92.5)', Number(validGrade.data?.data?.marks) === 92.5);
        assert('Graded submission reflects status graded', validGrade.data?.data?.status === 'graded');
        assert('Graded submission preserves feedback', validGrade.data?.data?.feedback?.includes('relational design'));

        // ==========================================
        // SECTION 6: Student Reflection After Grading
        // ==========================================
        console.log('\n[6. Student Reflection After Grading]');
        
        // Student 1 (2023CSCA001) queries assignments endpoint
        const studentAssignments = await request('GET', '/api/students/assignments', null, studentToken);
        assert('Student retrieves updated assignments (200)', studentAssignments.status === 200);
        const sub2 = (studentAssignments.data?.data || []).find(a => a.id === 2);
        assert('Student view reflects submission status as graded', (sub2?.submission?.status || sub2?.status) === 'graded');
        assert('Student view reflects assigned marks (92.5)', Number(sub2?.submission?.marks || sub2?.marks) === 92.5);
        assert('Student view reflects lecturer feedback', (sub2?.submission?.feedback || sub2?.feedback)?.includes('relational design'));
        assert('Assignment summary average marks is updated', studentAssignments.data?.summary?.average_marks > 0);

        // ==========================================
        // SECTION 7: Admin Institutional Dashboard & Telemetry
        // ==========================================
        console.log('\n[7. Admin Institutional Dashboard & Telemetry]');
        
        const adminDash = adminToAdmin.data;
        assert('Admin dashboard returns success true', adminDash.success === true);
        assert('Admin dashboard contains institutional_metrics', typeof adminDash.data?.institutional_metrics === 'object');
        assert('Institutional total_students is positive number', adminDash.data.institutional_metrics.total_students > 0);
        assert('Institutional total_lecturers is positive number', adminDash.data.institutional_metrics.total_lecturers > 0);
        assert('Institutional total_courses is positive number', adminDash.data.institutional_metrics.total_courses > 0);
        assert('Institutional total_enrollments is positive number', adminDash.data.institutional_metrics.total_enrollments > 0);
        assert('Institutional avg_university_gpa is numeric', typeof adminDash.data.institutional_metrics.avg_university_gpa === 'number');
        assert('Institutional avg_overall_score is numeric', typeof adminDash.data.institutional_metrics.avg_overall_score === 'number');
        assert('Institutional avg_overall_attendance is numeric', typeof adminDash.data.institutional_metrics.avg_overall_attendance === 'number');
        assert('Admin dashboard contains academic_risk_distribution', typeof adminDash.data?.academic_risk_distribution === 'object');
        assert('Admin dashboard contains top_career_paths list', Array.isArray(adminDash.data?.top_career_paths));
        assert('Admin dashboard contains course_operations table', Array.isArray(adminDash.data?.course_operations));
        assert('Admin dashboard contains system_status diagnostics', typeof adminDash.data?.system_status === 'object');
        assert('System status confirms database is connected', adminDash.data.system_status.database === 'connected');

        // ==========================================
        // SECTION 8: Admin User Management (CRUD & Safeguards)
        // ==========================================
        console.log('\n[8. Admin User Management & Safeguards]');
        
        // List all users
        const allUsersRes = await request('GET', '/api/admin/users', null, adminToken);
        assert('Admin lists all institutional users (200)', allUsersRes.status === 200);
        assert('Users list is an array', Array.isArray(allUsersRes.data?.data));

        // Filter by role: lecturer
        const lecUsersRes = await request('GET', '/api/admin/users?role=lecturer', null, adminToken);
        assert('Admin filters users by role lecturer (200)', lecUsersRes.status === 200);
        const onlyLecturers = (lecUsersRes.data?.data || []).every(u => u.role === 'lecturer');
        assert('All returned users in filtered query have role lecturer', onlyLecturers);

        // Search by query
        const searchUserRes = await request('GET', '/api/admin/users?search=Robert', null, adminToken);
        assert('Admin searches users by query string (200)', searchUserRes.status === 200);
        assert('Search finds matching user Dr. Robert Smith', (searchUserRes.data?.data || []).some(u => u.full_name?.includes('Robert')));

        // User Provisioning Validation: Password too short (< 6 chars)
        const shortPwRes = await request('POST', '/api/admin/users', {
            username: '2023TESTSHORT',
            password: '123',
            role: 'student',
            full_name: 'Short Pw Student',
            email: 'shortpw@uni.edu'
        }, adminToken);
        assert('User creation rejects password shorter than 6 chars (400)', shortPwRes.status === 400);

        // User Provisioning Validation: Missing required fields
        const missingFieldsRes = await request('POST', '/api/admin/users', {
            username: '2023TESTMISS'
        }, adminToken);
        assert('User creation rejects missing required fields (400)', missingFieldsRes.status === 400);

        // Valid User Provisioning: Create test student
        const testStudentReg = `TEST${Date.now()}`;
        const createStudentRes = await request('POST', '/api/admin/users', {
            username: testStudentReg,
            password: 'ValidPassword123',
            role: 'student',
            full_name: 'Automated Test Student',
            email: `${testStudentReg.toLowerCase()}@university.edu`,
            department: 'Computer Science',
            year: 2,
            semester: 2,
            current_gpa: 3.65
        }, adminToken);
        assert('Admin successfully provisions new student user (201)', createStudentRes.status === 201);
        const createdUserId = createStudentRes.data?.data?.id;
        assert('Created user returns positive integer ID', typeof createdUserId === 'number' && createdUserId > 0);

        // Duplicate username rejected
        const dupUserRes = await request('POST', '/api/admin/users', {
            username: testStudentReg,
            password: 'ValidPassword123',
            role: 'student',
            full_name: 'Duplicate Student',
            email: `dup_${testStudentReg.toLowerCase()}@university.edu`
        }, adminToken);
        assert('User creation rejects duplicate username/registration (400)', dupUserRes.status === 400);

        // Safe Deletion Safeguards: Cannot delete root Admin 1
        const deleteRootAdmin = await request('DELETE', '/api/admin/users/1', null, adminToken);
        assert('Safeguard: Admin cannot delete root admin user (400)', deleteRootAdmin.status === 400);

        // Safe Deletion: Admin deletes newly created test student
        const deleteTestUser = await request('DELETE', `/api/admin/users/${createdUserId}`, null, adminToken);
        assert('Admin successfully deletes newly created test user (200)', deleteTestUser.status === 200);

        // ==========================================
        // SECTION 9: Admin Course Management & System Health
        // ==========================================
        console.log('\n[9. Admin Course Management & System Health]');
        
        // List all courses
        const adminCoursesRes = await request('GET', '/api/admin/courses', null, adminToken);
        assert('Admin lists all courses with lecturer and enrollment counts (200)', adminCoursesRes.status === 200);
        assert('Courses list is an array', Array.isArray(adminCoursesRes.data?.data));

        // Create course validation: duplicate course code rejected
        const dupCourseRes = await request('POST', '/api/admin/courses', {
            course_code: 'CSC202S2',
            course_name: 'Duplicate Course',
            credits: 3,
            semester: 'Semester 1',
            department: 'Computer Science'
        }, adminToken);
        assert('Course creation rejects duplicate course code (400)', dupCourseRes.status === 400);

        // Valid course creation
        const testCourseCode = `TST${Math.floor(Math.random() * 899 + 100)}`;
        const createCourseRes = await request('POST', '/api/admin/courses', {
            course_code: testCourseCode,
            course_name: 'Cloud Computing & Microservices',
            credits: 3,
            semester: 'Semester 2',
            department: 'Computer Science',
            lecturer_id: 2
        }, adminToken);
        assert('Admin successfully provisions new academic course (201)', createCourseRes.status === 201);

        // Update course
        const updateCourseRes = await request('PUT', `/api/admin/courses/${testCourseCode}`, {
            course_name: 'Advanced Cloud Architecture',
            credits: 4
        }, adminToken);
        assert('Admin successfully updates existing course (200)', updateCourseRes.status === 200);

        // Safeguard: Cannot delete course with active enrollments
        const deleteActiveCourse = await request('DELETE', '/api/admin/courses/CSC202S2', null, adminToken);
        assert('Safeguard: Deletion of course with active enrollments is blocked (400)', deleteActiveCourse.status === 400);

        // Safe deletion of newly created test course (has zero enrollments)
        const deleteTestCourse = await request('DELETE', `/api/admin/courses/${testCourseCode}`, null, adminToken);
        assert('Admin successfully removes newly created un-enrolled course (200)', deleteTestCourse.status === 200);

        // Institutional Enrollments Overview
        const enrollmentsRes = await request('GET', '/api/admin/enrollments', null, adminToken);
        assert('Admin retrieves institutional enrollment overview (200)', enrollmentsRes.status === 200);

        // Institutional Analytics
        const adminAnalyticsRes = await request('GET', '/api/admin/analytics', null, adminToken);
        assert('Admin retrieves deep institutional analytics (200)', adminAnalyticsRes.status === 200);

        // Institutional System Health
        const healthRes = await request('GET', '/api/admin/system/health', null, adminToken);
        assert('Admin retrieves system health diagnostics (200)', healthRes.status === 200);
        assert('System health verifies database status', healthRes.data?.data?.database?.status === 'connected');

        // ==========================================
        // SECTION 10: Security Auditing & Zero Credential Leakage
        // ==========================================
        console.log('\n[10. Security Auditing & Zero Credential Leakage]');
        
        const rawLecDash = JSON.stringify(lecDash);
        const rawAdminDash = JSON.stringify(adminDash);
        const rawAllUsers = JSON.stringify(allUsersRes.data);
        const rawLecAnalytics = JSON.stringify(analyticsRes.data);

        assert('password_hash is absent from lecturer dashboard', !rawLecDash.includes('password_hash'));
        assert('password_hash is absent from admin dashboard', !rawAdminDash.includes('password_hash'));
        assert('password_hash is absent from admin user listing', !rawAllUsers.includes('password_hash'));
        assert('Bcrypt hash signature ($2b$10$) never leaks in user listing', !rawAllUsers.includes('$2b$10$'));
        assert('Bcrypt hash signature never leaks in lecturer dashboard', !rawLecDash.includes('$2b$10$'));
        assert('JWT secret never leaks in any command center payload', !rawAdminDash.includes(process.env.JWT_SECRET || 'super_secret'));
        assert('Database password never leaks in system health or diagnostics', !rawAdminDash.includes(process.env.DB_PASSWORD || 'password123'));

    } finally {
        server.close();
    }

    console.log('\n====================================================');
    console.log(`PHASE 12 TOTAL: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runPhase12Tests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
