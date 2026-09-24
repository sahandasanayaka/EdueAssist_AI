# Phase 11 — Assignment Intelligence & Submission Management

## 1. Executive Summary & Architecture Overview

**EduAssistAI — "Your AI Academic & Career Companion"**

Phase 11 transforms traditional coursework list displays into a deterministic, AI-grounded **Assignment Intelligence & Submission Management Engine**. Rather than viewing assignments merely as isolated due dates, the system correlates deadlines with real-time academic performance (`exam_results`), lecture attendance (`attendance_summary`), grade weight, difficulty, and current submission records in MySQL.

### Architectural Data Flow

```
+-----------------------------------------------------------------------------------+
|                              REACT FRONTEND CLIENT                                |
|  - Assignments.jsx: AI Advisor card, priority tabs, metric cards, submit modal    |
|  - StudentDashboard.jsx: Compact Assignment Priorities triage widget              |
|  - EduAssistChatbot.jsx: "Prioritize My Assignments" quick-action prompt          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (HTTP REST with Bearer JWT)
+-----------------------------------------------------------------------------------+
|                            EXPRESS BACKEND (PORT 5000)                            |
|  - authMiddleware: Verifies Bearer JWT & student user id                          |
|  - roleMiddleware: Enforces student RBAC; blocks lecturers and admins             |
|  - studentRoutes & studentController: IDOR route protection & schema formatting   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                    ASSIGNMENT INTELLIGENCE SERVICE LAYER                          |
|  - assignmentIntelligenceService.js: Deterministic priority rules & analytics     |
|  - geminiService.js: Workload analysis via Gemini 2.5 Flash & deterministic fallback|
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (mysql2 pool query)
+-----------------------------------------------------------------------------------+
|                                MYSQL DATABASE                                     |
|  - assignments: deadlines, total marks, weights, difficulties, status             |
|  - courses & enrollments: verifies student is actively registered                 |
|  - assignment_submissions: status, timestamps, files, and text solutions          |
|  - exam_results: module marks used for academic risk correlation                  |
|  - attendance_summary: attendance % used to flag attendance risk                  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Deterministic Priority Engine & Decision Rules

Coursework prioritization is 100% deterministic and explainable. No black-box guesses or hallucinations occur. Priority levels and human-readable rationales are computed using the following explicit rules:

| Priority | Trigger Conditions | Example Explainable Rationale |
| :--- | :--- | :--- |
| **`LOW`** | Submission already recorded (`SUBMITTED` or `GRADED`). | *"Submission completed on time; awaiting evaluation."* or *"Assignment evaluated and graded by course lecturer."* |
| **`URGENT`** | Submission unfulfilled and deadline has passed. | *"Assignment deadline has passed and submission is unfulfilled overdue."* |
| **`URGENT`** | Pending submission and deadline within $\le 48\text{ hours}$. | *"Immediate action required: due within 48 hours (24h remaining)."* |
| **`URGENT`** | Student's average course mark $< 50\%$ and deadline within $\le 5\text{ days}$. | *"Critical course performance alert: current course mark is 42%, below the passing threshold."* |
| **`HIGH`** | Student's course attendance $< 75\%$ and deadline within $\le 7\text{ days}$. | *"Attendance risk alert: course attendance is 65%, below the mandatory 75% threshold."* |
| **`HIGH`** | Grade weight is high ($\ge 20\%$) and deadline within $\le 7\text{ days}$. | *"Significant grade weight impact (25% of module total) due within 7 days."* |
| **`HIGH`** | Weak course overall (course mark $< 60\%$) and deadline within $\le 7\text{ days}$. | *"Academic intervention priority: module average (54%) is below target standard."* |
| **`MEDIUM`** | Normal upcoming deadline within $\le 7\text{ days}$. | *"Coursework deadline approaching in 5 days."* |
| **`LOW`** | Deadline $> 7\text{ days}$ with satisfactory course standing. | *"Upcoming assignment with sufficient preparation buffer."* |

---

## 3. MySQL Database Grounding & Schema Details

### Schema Enhancements

In Phase 11, the `assignment_submissions` table was augmented to support online text and code submissions:

```sql
ALTER TABLE assignment_submissions 
ADD COLUMN submission_text TEXT DEFAULT NULL AFTER submission_file;
```

### Relational Context Joined for Intelligence

All intelligence metrics are pulled dynamically from MySQL:

1. **`assignments`**: Title, module, weight, due date, maximum marks.
2. **`courses`**: Course title and credits.
3. **`enrollments`**: Validates active student enrollment.
4. **`assignment_submissions`**: Identifies submission status, date, text, file, marks, and lecturer feedback.
5. **`exam_results`**: Computes current average course mark (`ROUND(AVG(score), 1)`).
6. **`attendance_summary`**: Computes course-level attendance percentage (`ROUND((attended_classes / NULLIF(total_classes, 0)) * 100, 1)`).

---

## 4. Submission Management & Status Lifecycle

The system models the complete coursework submission lifecycle:

```
[ PENDING ] ──(Deadline passes without submission)──> [ OVERDUE ]
     │                                                     │
     │ (Submitted before deadline)                         │ (Submitted after deadline)
     ▼                                                     ▼
[ SUBMITTED ]                                          [ LATE ]
     │                                                     │
     └────────────────(Lecturer grading)───────────────────┘
                               │
                               ▼
                           [ GRADED ]
```

### Defensive Submission Controls
- **Validation**: Rejects submissions lacking both text and file with `400 Bad Request`.
- **Content Check**: Rejects empty whitespace text (`"   "`) with `400 Bad Request`.
- **IDOR Protection**: Verifies student is actively enrolled in the assignment's course; returns `403 Forbidden` if not.
- **Duplicate Prevention**: Rejects duplicate submission attempts with `400 Bad Request` (`"Assignment has already been submitted"`).
- **On-time vs Late Calculation**: Compares submission timestamp (`NOW()`) against `assignments.due_date` to assign `'submitted'` vs `'late'`.

---

## 5. REST API Specifications & Backward Compatibility

### 1. `GET /api/students/assignments`
- **Auth**: Bearer JWT (`student` role required)
- **Response**:
  ```json
  {
    "success": true,
    "status": "success",
    "data": [ ... ], // Array of assignments (Phase 4 backward compatibility)
    "assignments": [
      {
        "id": 4,
        "course_code": "CSC205S2",
        "course_title": "Data Structures & Algorithms",
        "title": "Binary Search Tree & Heap Optimization",
        "description": "Benchmark performance of AVL balanced trees...",
        "due_date": "2026-10-04T08:51:52.000Z",
        "max_marks": 100,
        "total_marks": 100,
        "weight": 20,
        "difficulty": "hard",
        "submission_status": "PENDING",
        "priority": "LOW",
        "priority_reason": "Upcoming assignment with sufficient preparation buffer.",
        "current_course_mark": 89.0,
        "course_attendance": 95.8,
        "time_remaining_label": "12 days left",
        "marks": null,
        "feedback": null
      }
    ],
    "summary": {
      "total": 4,
      "pending": 1,
      "overdue": 0,
      "submitted": 3,
      "graded": 1,
      "late": 1,
      "due_soon": 0,
      "urgent": 0,
      "high": 0,
      "medium": 0,
      "low": 4,
      "urgent_count": 0,
      "high_count": 0,
      "medium_count": 0,
      "low_count": 4,
      "completion_rate": 75,
      "average_marks": 98.0
    },
    "priority_actions": [ ... ],
    "ai_advisor": {
      "overview": "You have 1 pending assignment across your registered courses...",
      "top_priority": "CSC205S2: Binary Search Tree & Heap Optimization",
      "reasons": [ "Due soon (12 days left)." ],
      "recommended_actions": [ "Review the assignment rubric..." ],
      "time_management_tip": "Break larger coursework into smaller milestones..."
    }
  }
  ```

### 2. `GET /api/students/assignments/:id`
- **Auth**: Bearer JWT (`student` role required)
- **IDOR Check**: Validates student enrollment in course; returns `403 Forbidden` if student is unauthorized.
- **Response**: Single assignment detail object enriched with course marks, attendance, countdown label, and submission history.

### 3. `POST /api/students/assignments/:id/submit`
- **Auth**: Bearer JWT (`student` role required)
- **Body**: `{ "submission_text": "...", "submission_file": "solution.pdf" }`
- **Response**: `201 Created` with `submission_id` and calculated `status`.

---

## 6. Gemini 2.5 Flash Assignment Advisor & Fallback Architecture

The system uses Gemini 2.5 Flash (`generateAssignmentAnalysis`) to synthesize an academic triage overview:
- Top priority deliverable.
- Explainable reasons grounded in deadline, weight, and course performance.
- Actionable steps for completing the coursework.
- Time management strategy.

### Deterministic Fallback Resilience
If the Gemini API key is missing, network is unavailable, or a 429 rate limit occurs:
- The backend automatically catches the error.
- Falls back to `_generateFallbackAssignmentAnalysis` using deterministic MySQL metrics.
- The HTTP request **always succeeds with status 200**, ensuring zero user-facing disruptions.

---

## 7. React Frontend UI & User Interaction Design

1. **`Assignments.jsx`**:
   - **Summary Cards**: Displays live counters for Pending, Overdue, Completed (%), and Average Graded Mark.
   - **AI Advisor Card**: Gradient card rendering Gemini/fallback triage, top priority highlights, recommended actions, and time management tips.
   - **Priority Filter Tabs**: Tabbed filtering by `ALL`, `URGENT`, `HIGH`, `MEDIUM`, `LOW`, and `COMPLETED`.
   - **Enriched Deliverable Cards**: Visual priority indicators, module tags, remaining time countdowns, course average marks, attendance stats, and lecturer feedback.
   - **Interactive Submission Modal**: Clean modal enabling direct submission of text/code solutions, with live character count, instant state update, and alert banners.
2. **`StudentDashboard.jsx`**:
   - **Assignment Priorities Widget**: Compact sidebar card showing urgent/high priority badge indicators, top 3 pending assignments, and a direct navigation shortcut to `/assignments`.
3. **`EduAssistChatbot.jsx`**:
   - Pre-configured quick action: *"Prioritize My Assignments"*.

---

## 8. Security, RBAC & IDOR Enforcement

- **Role-Based Access Control**: Student-only endpoints strictly block unauthenticated calls (`401`) and other roles (`403` for lecturers and admins).
- **IDOR Course Enrollment Validation**: Even with a valid student token, students cannot view or submit assignments for courses they are not enrolled in (`403 Forbidden`).
- **Zero Credential Leakage**: Audited to guarantee `password_hash`, bcrypt `$2b$10$` hashes, and `GEMINI_API_KEY` are never returned in responses.

---

## 9. Complete Test Suite & Assertion Breakdown

### Full Regression Test Results (`npm run test:all`)

| Phase | Test Suite | Assertions | Status |
| :--- | :--- | :--- | :--- |
| **Phase 4** | `test-phase4.js` (REST API Expansion) | 81 / 81 | **PASS** |
| **Phase 6** | `test-phase6.js` (JWT Authentication Flow) | 37 / 37 | **PASS** |
| **Phase 7** | `test-phase7.js` (Academic Analysis Engine) | 31 / 31 | **PASS** |
| **Phase 8** | `test-phase8.js` (AI Chatbot & Memory) | 37 / 37 | **PASS** |
| **Phase 9** | `test-phase9.js` (AI Study Plan Generator) | 42 / 42 | **PASS** |
| **Phase 10** | `test-phase10.js` (Career Hub & Skill Gap) | 57 / 57 | **PASS** |
| **Phase 11** | `test-phase11.js` (Assignment Intelligence) | 74 / 74 | **PASS** |
| **TOTAL** | **All Phases Combined** | **359 / 359** | **100% PASS** |

Frontend Production Build (`vite build`): **0 errors, 0 warnings**.

---

## 10. Viva Preparation & Architecture Defense Q&As

### Q1: Why didn't you just let Gemini sort and prioritize the assignments?
**Answer**: Relying purely on an LLM for priority sorting introduces nondeterminism, latency, token costs, and hallucination risks. In an academic institution, students need reliable, transparent rules: if an assignment is due in 24 hours, or if a student's course mark is failing (<50%), it must **always** be flagged as URGENT without exception. Our deterministic priority engine executes this logic in $< 5\text{ms}$ directly from MySQL data. Gemini 2.5 Flash is then used strictly for natural language synthesis, advising, and study coaching on top of the deterministic foundation.

### Q2: How do you prevent Insecure Direct Object Reference (IDOR) attacks on submissions?
**Answer**: We check active course enrollment before granting access to assignment details or accepting submissions:
```sql
SELECT 1 FROM enrollments 
WHERE student_id = ? AND course_code = ? AND enrollment_status = 'active'
```
If the student is not actively enrolled in that course, the server immediately throws a `403 Forbidden` error, preventing unauthorized students from probing or submitting coursework for modules they do not take.

### Q3: What happens if Gemini API rate limits (HTTP 429) during peak submission week?
**Answer**: Our service layer wraps Gemini calls in defensive error handling. If Gemini fails or times out, `assignmentIntelligenceService` instantly falls back to `_generateFallbackAssignmentAnalysis()`, which constructs an assignment triage overview directly from MySQL summary statistics. The API response returns HTTP 200 with complete advisory data, ensuring zero downtime for students.

### Q4: How is backward compatibility preserved with Phase 4 tests?
**Answer**: In Phase 4, `GET /api/students/assignments` expected `res.data.data` to be an array of assignments. In Phase 11, `res.data.data` is preserved as the assignment array, while also returning `assignments`, `summary`, `priority_actions`, and `ai_advisor` at the top level of the JSON response. This ensures 100% compatibility with legacy clients and tests while powering the new intelligent UI.
