# Phase 13 — Security & Validation Layer

## 1. Executive Summary & Security Philosophy

**EduAssistAI — "Your AI Academic & Career Companion"**

The Phase 13 Security & Validation Layer provides enterprise-grade, defense-in-depth protection across all EduAssistAI services, APIs, and client-server interactions. Designed to align with the **OWASP Top 10 (2021/2025)** web application security standards, this phase hardens the platform against common vulnerabilities while preserving 100% backward compatibility with all student, lecturer, and administrative features implemented across Phases 1–12.

### Core Security Tenets
1. **Zero Trust at the Boundary**: Every incoming HTTP request is authenticated, origin-checked, content-type verified, rate-limited, and payload-size audited before route handlers process the request.
2. **Context-Aware Sanitization**: Input strings are deeply sanitized to strip script tags, dangerous DOM event handlers (`onerror`, `onload`), and pseudo-protocols (`javascript:`, `vbscript:`, `data:`), preventing Cross-Site Scripting (XSS).
3. **Strict Query Parameterization**: All interactions with MySQL employ parameterized prepared statements via `mysql2/promise`, immunizing the data layer against SQL Injection (SQLi) attacks.
4. **Session-Bound Identity & IDOR Elimination**: Object IDs (assignments, courses, submissions, study tasks) supplied in URL parameters are never trusted in isolation; every mutation and read validates that the database record belongs to the authenticated identity (`req.user.id`).
5. **Absolute Secret Protection**: Passwords, bcrypt hash signatures (`$2b$10$`), JWT signing secrets, and third-party AI keys (`GEMINI_API_KEY`) are permanently excluded from query projections, response payloads, logs, and diagnostic endpoints.

---

## 2. Multi-Layer Request Processing Architecture

```
HTTP Client Request (Browser / Mobile / cURL)
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Security Headers Middleware (securityMiddleware.js)  │
│    - X-Content-Type-Options: nosniff                    │
│    - X-Frame-Options: DENY (Clickjacking)               │
│    - X-XSS-Protection: 0 (Modern standard)             │
│    - Referrer-Policy: strict-origin-when-cross-origin   │
│    - Content-Security-Policy (CSP)                      │
│    - Cross-Origin-Opener/Resource-Policy: same-origin   │
│    - Strip 'X-Powered-By: Express'                      │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 2. CORS Policy & Payload Size Enforcer (server.js)      │
│    - Allowed Origins: localhost:5173, 127.0.0.1:5173    │
│    - express.json({ limit: '1mb' })                     │
│    - express.urlencoded({ limit: '1mb' })               │
│    - Payload > 1MB rejected with 413 Payload Too Large  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Global Request Body Sanitizer (sanitizeRequestBody)  │
│    - Recursive object & array sanitization              │
│    - HTML tag & script removal (stripHtml)              │
│    - HTML entity encoding for display (escapeHtml)      │
│    - Protocol strip (javascript:, vbscript:, data:)     │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Rate Limiting Middleware (rateLimitMiddleware.js)    │
│    - Sliding window in-memory tracking                  │
│    - Login Limiter: 5 attempts/min (Brute Force)        │
│    - AI Study Plan Limiter: 25 requests/min             │
│    - AI Chat Interval Limiter: 20 req/min, 300ms gap    │
│    - Rate Limit Headers: X-RateLimit-Limit / Remaining  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Authentication & RBAC Verification                   │
│    - authMiddleware: Verify Bearer JWT format & secret  │
│    - roleMiddleware: Enforce student, lecturer, admin   │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Endpoint Validation Middleware (validationMiddleware)│
│    - validateLogin / validateUserCreation               │
│    - validateCourseCreation / validateCourseUpdate      │
│    - validateGrading / validateStudyPlanTask            │
│    - validateCareerGoal / validateChatMessage           │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 7. Service Layer & IDOR Verification                    │
│    - Database record ownership verification             │
│    - Parameterized SQL execution                        │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 8. Safe Error Handler (errorHandler.js)                 │
│    - Catches 413, 400 (Bad JSON), 404, 429, 500         │
│    - Strips stack traces in production                  │
│    - Redacts passwords, JWT_SECRET, GEMINI_API_KEY      │
│    - Returns standardized { success: false, message }   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Security Controls

### 3.1 HTTP Security Headers
Configured in `server/src/middleware/securityMiddleware.js`:
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-type sniffing attacks, stopping browsers from executing non-script assets as executable scripts.
- **`X-Frame-Options: DENY`**: Protects against clickjacking attacks by forbidding the application from being embedded in `<iframe>`, `<frame>`, `<embed>`, or `<object>` containers.
- **`X-XSS-Protection: 0`**: Explicitly disables legacy, buggy browser XSS filters that could create side-channel vulnerabilities, relying instead on CSP.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Restricts the leaking of sensitive URL paths and query parameters to third-party domains.
- **`Content-Security-Policy`**: Restricts resource execution to trusted origins (`default-src 'self'`).
- **`X-Powered-By` Header Removal**: Express signature is completely removed via `app.disable('x-powered-by')` and middleware cleanup, minimizing server fingerprinting.

### 3.2 Request Sanitization & XSS Prevention
Configured in `server/src/utils/sanitize.js` and mounted globally via `sanitizeRequestBody`:
- **`stripHtml(input)`**: Strips `<script>`, `<iframe>`, `object`, `embed`, and `applet` tags along with dangerous inline attributes such as `onerror=`, `onload=`, `onclick=`.
- **`escapeHtml(input)`**: Converts special characters (`&`, `<`, `>`, `"`, `'`, `/`) into their safe HTML entity representations (`&amp;`, `&lt;`, etc.).
- **Dangerous URL Schemes**: Strips pseudo-protocols including `javascript:`, `vbscript:`, and malicious `data:` URIs from input strings.
- **Deep Recursive Traversal**: Nested objects and arrays submitted in JSON request bodies are traversed and sanitized without mutating numeric, boolean, or date values.

### 3.3 SQL Injection (SQLi) Defense
All database interactions use `mysql2/promise` with prepared statement parameterization:
```javascript
// Parameterized query prevents SQL injection
const [rows] = await pool.query(
    'SELECT * FROM courses WHERE code = ? AND is_active = 1',
    [courseCode]
);
```
- **Stacked Query Protection**: Path parameters or search strings containing `'; DROP TABLE users; --` are bound strictly as string literals, completely preventing stacked query execution.
- **Wildcard Escape in Search**: Search parameters in Admin user management use SQL parameter binding (`WHERE username LIKE ?`) with escaped inputs, preventing wildcard flooding or unauthorized database dumps.

### 3.4 Insecure Direct Object Reference (IDOR) Mitigation
- **Lecturer Course Isolation**: Lecturers can only access, view rosters for, and grade submissions for courses assigned to them (`courses.lecturer_id = req.user.id`). Attempting to view or grade another lecturer's course returns `403 Forbidden`.
- **Student Resource Isolation**: Study plan tasks, chat sessions, and assignment submissions are bound to the authenticated student (`student_id = req.user.id`). Toggling or deleting another student's task returns `404 Not Found`, giving zero indication of resource existence.
- **Assignment Submission Protection**: Students can only submit coursework for courses in which they have active enrollments (`enrollments.student_id = req.user.id AND enrollments.status = 'enrolled'`).

### 3.5 Rate Limiting & Resource Throttling
Implemented in `server/src/middleware/rateLimitMiddleware.js` using an efficient sliding-window algorithm:
- **Authentication Rate Limiting (`loginLimiter`)**: 5 login attempts per minute per IP address. Exceeding this limit returns `429 Too Many Requests` with a `Retry-After` header, defending against brute-force credential stuffing.
- **AI Study Plan Limiter (`studyPlanLimiter`)**: 25 plan generation requests per minute, protecting underlying Gemini API quota.
- **AI Chat Interval Limiter**: 20 chat requests per minute, with a minimum interval of 300ms between consecutive student messages.
- **Header Standards**: Returns standard `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers on managed endpoints.

### 3.6 Numeric Bounds & Schema Validation
Enforced via `server/src/middleware/validationMiddleware.js`:
- **Admin User Creation**: Validates username (3–50 alphanumeric chars), password ($\ge 6$ chars), role (`student`, `lecturer`, `admin`, `super_admin`), and mandatory registration number for students.
- **Course Administration**: Validates credits ($1 \le \text{credits} \le 12$, integer only), course code pattern (e.g., `CSC202S2`), and non-empty titles.
- **Lecturer Grading**: Rejects negative marks ($< 0$), non-numeric values (`NaN`, `Infinity`), and marks exceeding assignment maximum (`marks > max_marks`).
- **Student Study Plan**: Rejects days outside $[1, 14]$ and daily minutes outside $[30, 300]$.

### 3.7 Secret & Credential Leakage Prevention
- **Password Hash Redaction**: SQL queries across `authController.js`, `adminController.js`, and `lecturerController.js` omit `password_hash` from `SELECT` clauses or explicitly delete `password_hash` prior to serializing JSON responses.
- **Bcrypt Signature Guard**: Tests verify that `$2b$10$` signatures never leak into user-facing JSON payloads.
- **Environment & Key Protection**: Error handlers scan stack traces and error messages, replacing any instance of `JWT_SECRET`, `GEMINI_API_KEY`, or `DB_PASSWORD` with `[REDACTED]`.

---

## 4. Test Verification & Coverage Matrix

EduAssistAI maintains an automated test suite comprising **557 total assertions across 9 distinct test files**, achieving 100% pass rates across all functional and security domains:

| Test Suite | File | Focus Area | Assertions | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 4** | `test-phase4.js` | REST APIs, RBAC, Core Endpoints | 81 | 81/81 PASS |
| **Phase 6** | `test-phase6.js` | JWT Authentication & Claims | 37 | 37/37 PASS |
| **Phase 7** | `test-phase7.js` | AI Academic Analysis Engine | 31 | 31/31 PASS |
| **Phase 8** | `test-phase8.js` | Gemini AI Chatbot & Memory | 37 | 37/37 PASS |
| **Phase 9** | `test-phase9.js` | Persistent AI Study Plan | 42 | 42/42 PASS |
| **Phase 10** | `test-phase10.js`| Career Hub & Skill Gap Engine | 57 | 57/57 PASS |
| **Phase 11** | `test-phase11.js`| Assignment Intelligence & Submissions | 74 | 74/74 PASS |
| **Phase 12** | `test-phase12.js`| Lecturer & Admin Command Centers | 108 | 108/108 PASS |
| **Phase 13** | `test-phase13.js`| **Security & Validation Layer** | 90 | **90/90 PASS** |
| **TOTAL** | **`npm run test:all`** | **Comprehensive Full System Regression** | **557** | **557/557 PASS (100%)** |

### Phase 13 Test Breakdown (90 Assertions)
1. **Authentication Security (13 assertions)**: Missing tokens, malformed tokens, expired tokens, tampered signatures, credential validation.
2. **RBAC Boundary Enforcement (12 assertions)**: Cross-role route blocking between student, lecturer, and admin tiers.
3. **IDOR Protection (15 assertions)**: Course ownership checks, cross-student study plan isolation, assignment submission scoping.
4. **Input Validation & Bounds (14 assertions)**: Numeric boundary enforcement, character length constraints, type checking.
5. **SQLi & Sanitization (12 assertions)**: Prepared statements against stacked attacks, wildcard injection, XSS script stripping.
6. **Rate Limiting (8 assertions)**: Brute-force throttling, Retry-After headers, sliding window limit tracking.
7. **Secret & Credential Leakage Prevention (8 assertions)**: Omission of password hashes, bcrypt signatures, and environment secrets.
8. **Security Headers, CORS & Payload Limits (5 assertions)**: CSP, X-Frame-Options, X-Content-Type-Options, 1MB payload cap.
9. **Error Handling & Malicious Payloads (5 assertions)**: 400 Bad Request JSON, path traversal containment, template literal injection defense.

---

## 5. Viva Defense & Examination Guide

### Q1: How does EduAssistAI prevent SQL Injection (SQLi)?
> **Answer**: All database interactions in EduAssistAI utilize the `mysql2/promise` connection pool with parameterized prepared queries using placeholder syntax (`?`). User inputs are transmitted separately from the SQL statement structure, ensuring that special SQL characters (e.g. `' OR '1'='1`, `'; DROP TABLE;`) are treated strictly as string literals rather than executable SQL syntax.

### Q2: What mechanisms protect against Cross-Site Scripting (XSS)?
> **Answer**: EduAssistAI implements a two-pronged defense against XSS:
> 1. **Server-Side Sanitization**: The global `sanitizeRequestBody` middleware and utility functions in `sanitize.js` inspect incoming request bodies, stripping `<script>`, `<iframe>`, and malicious inline attributes (`onerror=`, `onload=`), as well as dangerous URI schemes (`javascript:`).
> 2. **HTTP Response Hardening**: The server enforces `Content-Security-Policy` and modern browser security headers (`X-Content-Type-Options: nosniff`), while React's virtual DOM inherently escapes variable bindings prior to DOM insertion.

### Q3: How is Insecure Direct Object Reference (IDOR) mitigated?
> **Answer**: Rather than relying solely on the presence of a valid JWT, EduAssistAI performs contextual authorization checks in the service layer. For example, when a lecturer attempts to grade a submission or view course rosters, the system joins the requested resource to the `courses` table and verifies that `courses.lecturer_id === req.user.id`. For students, resource queries are explicitly scoped with `WHERE student_id = req.user.id`. If a user attempts to interact with an unauthorized resource, the system returns `403 Forbidden` or `404 Not Found`.

### Q4: How are brute-force login attacks and AI service flooding handled?
> **Answer**: An in-memory sliding-window rate limiter tracks request counts by client IP. The authentication endpoint (`/api/auth/login`) permits a maximum of 5 requests per minute, returning `HTTP 429 Too Many Requests` with a `Retry-After` header when exceeded. The AI Chat service enforces a 300ms minimum inter-request interval and a 20 request/minute ceiling, protecting against automated bot spam and conserving Gemini API quotas.

### Q5: How does the application prevent credential and secret leakage?
> **Answer**:
> 1. In SQL query projections, password hashes are never included in user listing queries.
> 2. The authentication service explicitly deletes `password_hash` from user objects prior to token issuance.
> 3. The centralized error handling middleware intercepts uncaught exceptions and redacts any occurrences of `JWT_SECRET`, `GEMINI_API_KEY`, or `DB_PASSWORD` before returning clean error JSON with stack traces suppressed.
