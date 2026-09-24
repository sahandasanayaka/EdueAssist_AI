# Phase 12 — Lecturer & Admin Command Centers

## 1. Executive Summary & Architecture Overview

**EduAssistAI — "Your AI Academic & Career Companion"**

Phase 12 builds institutional command centers tailored for two critical academic personas:
1. **Course Lecturers (`lecturer` role)**: Faculty command consoles for monitoring class progress, reviewing course rosters, tracking attendance compliance, identifying students in academic jeopardy with concrete evidence reasons, viewing submitted coursework solutions, and grading assignments directly into MySQL.
2. **University Administrators (`admin` / `super_admin` role)**: Institutional telemetry dashboards providing macro-level insights across students, lecturers, courses, academic risk distributions, popular career pathways, complete user lifecycle administration (with strict self-deletion safeguards), course creation/modification, and system diagnostics.

### Role-Based Access Control (RBAC) & Route Matrix

```
+-----------------------------------------------------------------------------------------+
|                                  AUTHENTICATED ROUTE MATRIX                             |
+-------------------+------------------------------+--------------------+-----------------+
| Scope             | API Base Path                | Frontend Routes    | Allowed Roles   |
+-------------------+------------------------------+--------------------+-----------------+
| Student           | /api/students/*              | /student-dashboard | student         |
|                   |                              | /courses, etc.     |                 |
| Lecturer Console  | /api/lecturers/*             | /lecturer-dashboard| lecturer        |
|                   |                              | /lecturer-courses  |                 |
|                   |                              | /lecturer-analytics|                 |
| Admin Console     | /api/admin/*                 | /admin-dashboard   | admin,          |
|                   |                              | /admin-users       | super_admin     |
+-------------------+------------------------------+--------------------+-----------------+
```

Cross-role access is strictly blocked by Express middleware:
- A student attempting to reach `/api/lecturers/*` or `/api/admin/*` immediately receives `403 Forbidden`.
- A lecturer attempting to reach `/api/admin/*` receives `403 Forbidden`.
- An unauthenticated request without a valid Bearer JWT receives `401 Unauthorized`.

---

## 2. Strict IDOR (Insecure Direct Object Reference) Protection

A cornerstone of academic integrity and student data privacy is ensuring that **Lecturers can only access data, rosters, and assignments for courses they are assigned to teach**.

### Database Grounding of Teaching Assignments

In MySQL, courses explicitly record their assigned lecturer:
```sql
courses.lecturer_id -> lecturers.user_id (foreign key to users.id)
```

In EduAssistAI seed data:
- `Lec001` (user_id: 2, Dr. Robert Smith) teaches: `CSC202S2`, `CSC203S2`, `CSC206S2`.
- `Lec002` (user_id: 3, Prof. Amanda Silva) teaches: `CSC204S2`, `CSC205S2`.

### IDOR Enforcement in Service Layer

Every lecturer endpoint checks course ownership against `req.user.id`:

```javascript
// 1. Course Detail & Student Roster Verification:
const [courseRows] = await pool.query('SELECT lecturer_id FROM courses WHERE code = ?', [courseCode]);
if (courseRows.length === 0) {
    const err = new Error(`Course '${courseCode}' not found`);
    err.statusCode = 404;
    throw err;
}
if (courseRows[0].lecturer_id !== lecturerId) {
    const err = new Error('Forbidden. You are not the assigned lecturer for this course.');
    err.statusCode = 403;
    throw err;
}

// 2. Assignment Submissions & Grading Verification:
const [assignRows] = await pool.query(
    `SELECT a.id, a.total_marks, c.lecturer_id 
     FROM assignments a 
     JOIN courses c ON a.course_code = c.code 
     WHERE a.id = ?`,
    [assignmentId]
);
if (assignRows[0].lecturer_id !== lecturerId) {
    const err = new Error('Forbidden. You do not have permission to access submissions for this course.');
    err.statusCode = 403;
    throw err;
}
```

If Lecturer 1 attempts to query `/api/lecturers/courses/CSC204S2` or grade a submission in `CSC204S2`, the server returns `403 Forbidden`.

---

## 3. Lecturer Command Center Capabilities

### 3.1 Class Dashboard (`GET /api/lecturers/dashboard`)
- **Profile Card**: Full name, department, academic title, office location.
- **Top 6 KPI Metric Cards**: Total assigned courses, total distinct enrolled students, average assessment mark, average attendance rate, pending assignment submissions, and at-risk students count.
- **Assigned Modules Summary Table**: Code, title, credits, student count, average mark, attendance rate, assignments count, pending submissions.
- **At-Risk Students Triage Table**: Identifies students with `academic_risk = 'High'`, GPA $< 2.5$, attendance $< 75\%$, or course score $< 50\%$. Each student displays **grounded evidence reasons** (e.g. *"Attendance is 66.7%, below mandatory 75% threshold"*).
- **Academic Recovery Advisory Modal**: Allows lecturers to dispatch targeted intervention notifications to at-risk students.

### 3.2 My Classes & Rosters (`GET /api/lecturers/courses`, `GET /api/lecturers/courses/:code`)
- Detailed course view displaying module metadata, score range (highest, lowest, average), attendance average, and assignment completion rate.
- Enrolled student roster with academic standing badges (`LOW`, `MEDIUM`, `HIGH`).
- Active course assignments with submission counters (`submitted`, `pending`, `graded`, `late`).
- Drawer listing student submissions for any assignment.
- **Interactive Grading Modal**: Allows the lecturer to enter marks ($0 \le \text{marks} \le \text{total\_marks}$) and qualitative feedback.

### 3.3 Cohort Analytics (`GET /api/lecturers/analytics`)
- **Module Performance Comparison**: Bar comparisons across taught modules.
- **Attendance Compliance Bands**: Categorizes students into $\ge 75\%$ (Healthy), $60-74\%$ (Warning), and $< 60\%$ (Critical).
- **Performance Tiers**: Distinction ($\ge 75\%$), Credit ($60-74\%$), Pass ($50-59\%$), and Fail ($< 50\%$).
- **Coursework Submission Triage**: Telemetry on expected, submitted, graded, late, and pending submissions.

---

## 4. Student Reflection After Grading

When a lecturer grades a submission via `PATCH /api/lecturers/submissions/:id`:
1. The submission row in `assignment_submissions` is updated in MySQL:
   - `marks = :marks`
   - `feedback = :feedback`
   - `status = 'graded'`
   - `updated_at = NOW()`
2. When the student queries `GET /api/students/assignments`:
   - The assignment status immediately transitions to `graded` / `GRADED`.
   - The assigned marks and lecturer feedback are immediately visible.
   - The student's coursework summary metrics (`average_marks`) immediately update.

---

## 5. Admin Institutional Command Center

### 5.1 Institutional Overview (`GET /api/admin/dashboard`)
- **8 Core Telemetry KPIs**: Total platform users, students count, faculty count, course count, active enrollments count, university-wide average GPA, institutional average exam score, and overall lecture attendance percentage.
- **Risk Distribution Curve**: High-risk, medium-risk, and low-risk student headcounts across all departments.
- **Popular Career Pathways**: Top target roles aggregated from student `career_goals` and `students` tables.
- **University Operations Table**: Real-time roster counts, assigned professors, average attendance, and average examination performance per course.
- **Platform Telemetry**: Database connection status, server uptime, environment mode, and API health.

### 5.2 User Management (`GET /api/admin/users`, `POST /api/admin/users`, `DELETE /api/admin/users/:id`)
- Directory listing all university accounts with search and role filtering (`student`, `lecturer`, `admin`).
- **Account Provisioning**: Form with field validation (minimum 6 character password, valid email, department, role). Password is automatically hashed using bcrypt (`$2b$10$`).
- **Safe Deletion Safeguards**:
  - Administrators cannot delete their own active account.
  - The root system administrator (User ID 1) is strictly protected from deletion.
  - Deleting a user cleans up corresponding role-specific profile records.

### 5.3 Course Operations & Safeguards (`GET /api/admin/courses`, `POST /api/admin/courses`, `PUT /api/admin/courses/:code`, `DELETE /api/admin/courses/:code`)
- Academic course creation with duplicate code detection.
- Course modification (title, credits, assigned lecturer).
- **Active Enrollment Protection**: A course with active student enrollments cannot be deleted; the API returns `400 Bad Request` with an explanatory message: *"Cannot delete course 'CSC202S2' because 6 students are currently enrolled. Unenroll students first."*

---

## 6. Security Audit & Zero Credential Leakage

Comprehensive security assertions verify zero credential leakage:
- `password_hash` is explicitly excluded from user listings (`SELECT u.id, u.reg_number, u.role...` omitting `password_hash`).
- Bcrypt hash patterns (`$2b$10$`) never appear in API responses.
- `JWT_SECRET`, `GEMINI_API_KEY`, and `DB_PASSWORD` are never exposed in responses or system diagnostics.

---

## 7. Verification & Test Metrics

### Test Suite Execution Summary
- **Phase 4 (REST API Expansion)**: 81 / 81 passed
- **Phase 6 (JWT Authentication Flow)**: 37 / 37 passed
- **Phase 7 (AI Academic Analysis Engine)**: 31 / 31 passed
- **Phase 8 (AI Chatbot & Memory Integration)**: 37 / 37 passed
- **Phase 9 (Persistent AI Study Plan Generator)**: 42 / 42 passed
- **Phase 10 (Career Hub & Skill Gap Engine)**: 57 / 57 passed
- **Phase 11 (Assignment Intelligence & Submissions)**: 74 / 74 passed
- **Phase 12 (Lecturer & Admin Command Centers)**: 108 / 108 passed
- **TOTAL BACKEND ASSERTIONS**: **467 / 467 PASS — 100%**
- **FRONTEND PRODUCTION BUILD**: **0 errors, 0 warnings**

---

## 8. University Viva Defense Questions & Answers

**Q1: How do you prevent Lecturer A from grading assignments or viewing rosters belonging to Lecturer B?**
> *Answer*: Through service-layer authorization checks in `lecturerService.js`. When a lecturer requests a course detail or attempts to grade a submission, the system performs an internal lookup: `SELECT lecturer_id FROM courses WHERE code = ?`. It compares `course.lecturer_id` with `req.user.id` extracted from the cryptographically verified JWT. If they do not match, a `403 Forbidden` error is thrown before any student roster or submission data is touched.

**Q2: What happens if an administrator tries to delete a course that students are actively taking?**
> *Answer*: The system enforces foreign key and institutional integrity safeguards in `adminService.deleteCourse()`. Before executing any delete query, it runs `SELECT COUNT(*) FROM enrollments WHERE course_code = ? AND enrollment_status = 'active'`. If active enrollments exist, it rejects the deletion with a `400 Bad Request` and instructs the administrator to unenroll students first.

**Q3: How are "at-risk" students identified on the lecturer dashboard? Is it a fake AI number?**
> *Answer*: No fake numbers or hallucinated estimates are used. The triage engine is 100% deterministic and grounded in MySQL data. A student is flagged as at-risk if their cumulative GPA is below 2.5, their module attendance is below the mandatory 75% threshold, or their module exam mark is below 50%. The response includes explicit evidence strings explaining exactly why the student was flagged.

**Q4: How does the system ensure administrative passwords and database credentials are never leaked?**
> *Answer*: User management queries explicitly project only safe columns (`u.id, u.reg_number, u.role, u.created_at, s.full_name, s.email`) and never `u.password_hash`. System diagnostics return only high-level status strings (`database: 'connected'`), process uptime, and memory usage, with zero connection strings or credentials included. Automated tests assert that no bcrypt signatures (`$2b$10$`) or environment secrets appear in any API payload.
