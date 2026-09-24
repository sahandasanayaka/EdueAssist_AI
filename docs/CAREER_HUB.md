# EduAssistAI — Career Hub & AI Skill Gap Engine (Phase 10)

## 1. Executive Summary

The **Career Hub & AI Skill Gap Engine** is an intelligent, explainable career advisory system within EduAssistAI ("Your AI Academic & Career Companion"). It enables university students to benchmark their current competencies and academic performance directly against industry expectations for diverse technical roles (Software Engineer, Data Analyst, Data Scientist, UI/UX Designer, Cybersecurity Analyst, Cloud Engineer, Database Administrator, and Product Manager).

Unlike naive LLM career advice that hallucinates skills or gives generic suggestions, EduAssistAI computes deterministic skill gaps and academic alignment directly from authoritative MySQL database records, coupled with Gemini 2.5 Flash for natural language strategic insights and an explainable deterministic fallback.

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------------------------+
|                             React Frontend (Vite)                             |
|       Target Role Card  *  Skill Gap Matrix  *  Roadmap  *  AI Insights       |
+---------------------------------------+---------------------------------------+
                                        | (Axios with JWT)
                                        v
+-------------------------------------------------------------------------------+
|                              Express REST API                                 |
|   GET /api/students/career-hub   |   GET /api/students/career-paths           |
|   PUT /api/students/career-goal                                               |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                       SkillGapService (Business Logic)                        |
|   1. Skill Matching & Gap Computation (STRONG / DEVELOPING / GAP)             |
|   2. Priority Assignment (HIGH / MEDIUM / LOW)                                |
|   3. Phase 7 Academic Alignment (AcademicAnalysisService integration)         |
|   4. Course Materials & Learning Resources Mapping                           |
|   5. 4-Stage Roadmap Synthesis                                                |
+-------------------+-----------------------------------+-----------------------+
                    |                                   |
                    v                                   v
+---------------------------------------+   +-----------------------------------+
|            MySQL Database             |   |        Gemini 2.5 Flash           |
|  - career_paths                       |   |  - generateCareerAnalysis()       |
|  - career_path_skills (42 benchmarks) |   |  - Structured JSON Output         |
|  - student_skills                     |   |  - Deterministic Fallback Engine  |
|  - career_goals                       |   +-----------------------------------+
|  - course_materials                   |
|  - Phase 7 courses/exam_results       |
+---------------------------------------+
```

---

## 3. Database Schema

### 3.1. `career_paths` (Reference Catalog)
Defines the 8 core tracks supported by the university:
- `id`: Primary key (1-8).
- `name`: Track title (e.g., `Software Engineer`, `Data Analyst`).
- `description`: Formal track scope.
- `required_skills`: Comma-delimited skill list.
- `recommended_courses`: Comma-delimited university course codes (e.g. `CSC202S2, CSC203S2, CSC205S2`).
- `roadmap`: JSON array of progression milestones.

### 3.2. `career_path_skills` (Normalized Competency Benchmark Matrix)
Normalized table introduced in Phase 10 defining granular level requirements:
```sql
CREATE TABLE IF NOT EXISTS career_path_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    career_path_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    required_level INT NOT NULL DEFAULT 3,
    importance ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'HIGH',
    FOREIGN KEY (career_path_id) REFERENCES career_paths(id) ON DELETE CASCADE,
    UNIQUE KEY uq_career_skill (career_path_id, skill_name)
);
```
Contains **42 seed records** covering all 8 career paths with distinct requirements and weights.

### 3.3. `student_skills` (Verified Competencies)
Persists empirical skill levels for students (levels 1-5, status `needs_improvement`, `in_progress`, `proficient`, `mastered`).

### 3.4. `career_goals` (Student Target)
Stores each student's chosen path, custom target role title, target timeline (e.g., "12 months"), and computed `readiness_score` (0.00 to 100.00).

---

## 4. Deterministic Skill Gap Engine

### 4.1. Flexible Skill Matching Algorithm
To avoid brittle comparisons between academic skill labels and industry designations, `SkillGapService.findMatchingStudentSkill` executes a 3-tier matching strategy:
1. **Exact Case-Insensitive Match**: e.g. `Relational Databases (SQL)` === `Relational Databases (SQL)`.
2. **Normalized Base Match**: Strips parentheses and special characters (e.g. `Core Programming (Java)` matches `Core Programming (Java/Python)`).
3. **Keyword Overlap Match**: Checks stemmed token intersections (> 2 letters).
If no match is found, student level is treated as `0` and status as `not_started`.

### 4.2. Category Determination
- **`STRONG`**: `currentLevel >= requiredLevel` ($\text{gap} = 0$).
- **`DEVELOPING`**: $0 < \text{currentLevel} < \text{requiredLevel}$ ($\text{gap} = \text{requiredLevel} - \text{currentLevel}$).
- **`GAP`**: $\text{currentLevel} = 0$ ($\text{gap} = \text{requiredLevel}$).

### 4.3. Priority Assignment Matrix
- **`LOW`**: Any skill categorized as `STRONG` or where $\text{gap} = 0$, or $\text{importance} = \text{LOW}$.
- **`HIGH`**: 
  - $\text{importance} = \text{HIGH} \land (\text{gap} \ge 2 \lor \text{currentLevel} = 0)$
  - OR $\text{gap} \ge 3$
- **`MEDIUM`**:
  - $\text{importance} = \text{HIGH} \land \text{gap} = 1$
  - OR $\text{importance} = \text{MEDIUM} \land \text{gap} \ge 1$

### 4.4. Composite Readiness Score
The readiness score is a weighted composite of verified technical skills and empirical academic coursework:
$$\text{Skill Match \%} = \frac{\sum \min(\text{currentLevel}_i, \text{requiredLevel}_i)}{\sum \text{requiredLevel}_i} \times 100$$
$$\text{Readiness Score} = \text{round}(0.7 \times \text{Skill Match \%} + 0.3 \times \text{Academic Alignment Score})$$

---

## 5. Academic Alignment & Curated Course Materials

- Integrates directly with `AcademicAnalysisService.analyzeStudentAcademicProfile(studentId)` (Phase 7).
- Evaluates student continuous assessment performance against the target track's `recommended_courses`.
- Evaluates completion status: `completed`, `in_progress`, `needs_improvement`, or `unfulfilled`.
- Automatically queries `course_materials` table for relevant textbooks, laboratory manuals, and video lectures matching the recommended courses and high-gap topics.

---

## 6. Gemini 2.5 Flash AI Career Advisory & Fallback

`GeminiService.generateCareerAnalysis` provides natural language career advisory grounded strictly in:
- The student's verified skills and calculated gaps.
- Active GPA and academic risk tier from Phase 7.
- Enrolled modules and coursework performance.

### Structured Response Schema
```json
{
  "summary": "Executive summary of career trajectory and immediate priorities.",
  "keyStrengths": ["Strength 1", "Strength 2"],
  "criticalGaps": ["Critical Gap 1", "Critical Gap 2"],
  "actionPlan": ["Action 1", "Action 2", "Action 3"],
  "industryRelevance": "How academic coursework aligns with industry demands."
}
```

### Deterministic Fallback Engine
When Gemini API is unconfigured, unreachable, or rate-limited (HTTP 429), the engine automatically switches to `_generateFallbackCareerAnalysis`. This fallback derives all summary points, key strengths, critical gaps, and action items purely from database facts with zero crash or degraded experience.

---

## 7. REST API Reference

### 7.1. `GET /api/students/career-hub`
- **Auth**: Bearer JWT (role `student`).
- **Response**:
```json
{
  "success": true,
  "data": {
    "careerGoal": {
      "id": 1,
      "careerPathId": 1,
      "careerPathName": "Software Engineer",
      "targetRole": "Software Engineer",
      "targetTimeline": "12 months",
      "readinessScore": 76,
      "description": "Designs, builds, and maintains reliable full-stack applications..."
    },
    "currentSkills": [...],
    "requiredSkills": [...],
    "skillGaps": [
      {
        "skillName": "Relational Databases (SQL)",
        "currentLevel": 5,
        "requiredLevel": 4,
        "gap": 0,
        "category": "STRONG",
        "importance": "HIGH",
        "priority": "LOW",
        "status": "Mastered"
      }
    ],
    "readinessScore": 76,
    "skillMatchPercentage": 82,
    "academicAlignment": {
      "score": 67,
      "recommendedCourses": ["CSC202S2", "CSC203S2", "CSC205S2"],
      "breakdown": [...]
    },
    "recommendedResources": [...],
    "roadmap": [...],
    "nextSteps": [...],
    "aiInsights": {...},
    "career_paths": [...],
    "selected_goal": {...},
    "student_skills": [...]
  }
}
```

### 7.2. `GET /api/students/career-paths`
- **Auth**: Bearer JWT (role `student`).
- **Response**: Full list of 8 university-approved career tracks.

### 7.3. `PUT /api/students/career-goal`
- **Auth**: Bearer JWT (role `student`).
- **Payload**: Supports both camelCase (`careerPathId`, `targetRole`, `targetTimeline`) and snake_case (`career_path_id`, `target_role`, `target_timeline`).
- **Response**: Updated goal, recalculated `readiness_score`, refreshed `skill_gaps`, and updated `roadmap`.

---

## 8. Verification & Test Coverage

### Automated Test Suite: `test-phase10.js`
- **Total Assertions**: 57
- **Passed**: 57 | **Failed**: 0
- **Coverage**:
  - JWT authentication and role-based access control (student vs. lecturer vs. admin).
  - Career path retrieval and schema validation.
  - Skill Gap calculation for strong students (Student 1) and struggling students (Student 3).
  - Priority derivation logic (`HIGH`, `MEDIUM`, `LOW`).
  - Academic coursework alignment and resource recommendation.
  - Goal updates, input normalization, and MySQL persistence.
  - Mocked Gemini integration and simulated API failure fallback resilience.
  - Security audit: zero leakage of `password_hash`, bcrypt signatures, or `GEMINI_API_KEY`.

### Full Project Regression Status (`npm run test:all`)
- **Phase 4 (REST API Expansion)**: 81 / 81 passed
- **Phase 6 (JWT Authentication Flow)**: 37 / 37 passed
- **Phase 7 (AI Academic Analysis Engine)**: 31 / 31 passed
- **Phase 8 (AI Chatbot & Memory Integration)**: 37 / 37 passed
- **Phase 9 (Persistent AI Study Plan Generator)**: 42 / 42 passed
- **Phase 10 (Career Hub & AI Skill Gap Engine)**: 57 / 57 passed
- **TOTAL REGRESSION SUITE**: **285 / 285 passed (100%)**
- **Frontend Production Build**: Vite build completed with **0 errors**.
