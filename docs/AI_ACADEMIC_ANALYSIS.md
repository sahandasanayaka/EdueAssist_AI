# EduAssistAI — AI Academic Analysis Engine Documentation

## 1. Purpose
The AI Academic Analysis Engine provides deterministic, explainable, and personalized academic performance evaluation for university undergraduates. Built into the EduAssistAI platform, it analyzes empirical student records directly from MySQL and produces diagnostic risk levels, evidence-backed strengths and weaknesses, prioritized action checklists, and tailored recommendations without external API dependencies or hallucinations.

---

## 2. Data Sources (MySQL `eduassist_db`)
All insights are derived from authoritative database tables:
1. **`students`**: Cumulative GPA, academic standing, degree program, department, and career goal.
2. **`courses` & `enrollments`**: Active modular enrollments, course codes, titles, and credit weightings.
3. **`attendance_summary`**: Lecture attendance tracking (`total_classes`, `attended_classes`, percentage).
4. **`exam_results`**: Continuous assessments, quizzes, midterms, finals, grades, and grade points.
5. **`assignments` & `assignment_submissions`**: Coursework deadlines, submission status (`submitted`, `graded`, `pending`), scores, and overdue detection.
6. **`study_plan_tasks`**: Milestone completion progress and task priority.

---

## 3. Academic Risk Calculation (100-Point Penalty Model)
The academic risk engine is 100% deterministic and explainable:

$$\text{Risk Score} = \text{GPA Penalty} + \text{Attendance Penalty} + \text{Coursework Penalty} + \text{Assignment Penalty}$$

### A. GPA Component (0 to 40 Points)
* $\text{GPA} < 2.00$: **40 points** (Below graduation requirement)
* $2.00 \le \text{GPA} < 2.50$: **30 points** (Under performance baseline)
* $2.50 \le \text{GPA} < 3.00$: **15 points** (Satisfactory, monitored)
* $\text{GPA} \ge 3.00$: **0 points** (Good standing)

### B. Attendance Component (0 to 30 Points)
* Any module attendance $< 60\%$: **30 points** (Debarment risk)
* Any module attendance $60\% - 74.9\%$: **20 points** (Under 75% exam threshold)
* Overall attendance $< 75\%$: **10 points**
* All modules $\ge 75\%$: **0 points**

### C. Course Performance Component (0 to 20 Points)
* Any module continuous assessment score $< 50\%$: **20 points** (Failing standing)
* Any module assessment score $50\% - 64\%$: **10 points**
* All modules $\ge 65\%$: **0 points**

### D. Assignment Component (0 to 10 Points)
* $\ge 2$ overdue assignments: **10 points**
* 1 overdue assignment: **6 points**
* Assignment completion rate $< 50\%$: **4 points**
* 0 overdue assignments: **0 points**

### Categorical Risk Mapping
* **HIGH RISK**: Score $\ge 65$ OR $\text{GPA} < 2.00$ OR any course attendance $< 60\%$.
* **MEDIUM RISK**: Score $35 - 64$ OR any course attendance $< 75\%$ OR course mark $< 50\%$.
* **LOW RISK**: Score $< 35$.

---

## 4. GPA Trend Calculation
Calculates trajectory using historical semester assessments:
* $\Delta \text{Grade Point} > +0.15$: **IMPROVING**
* $\Delta \text{Grade Point} < -0.15$: **DECLINING**
* $-0.15 \le \Delta \text{Grade Point} \le +0.15$: **STABLE**
* Insufficient historical periods: **INSUFFICIENT_DATA** (Baseline established)

---

## 5. Attendance Thresholds
* **GOOD**: $\ge 75\%$ (Meets university examination eligibility requirements)
* **WARNING**: $60\% - 74.9\%$ (Alert issued; at risk of exam debarment)
* **CRITICAL**: $< 60\%$ (Urgent intervention; dean warning notice)

---

## 6. Assignment Priority Rules
Assignments are classified dynamically based on submission status and due dates:
* **URGENT**: Unsubmitted and overdue (`due_date < NOW()`).
* **HIGH**: Unsubmitted and due within 48 hours.
* **MEDIUM**: Unsubmitted and due within 7 days.
* **LOW**: Due in $> 7$ days or already submitted/graded.

---

## 7. Course Performance Rules
* **STRONG**: Average continuous assessment mark $\ge 75\%$ (Grades A/A+).
* **AVERAGE**: Average mark between $50\%$ and $74\%$ (Grades B/C).
* **NEEDS_ATTENTION**: Average mark $< 50\%$ (Grades D/F).
* **INSUFFICIENT_DATA**: No assessment marks recorded yet.

---

## 8. Recommendation Logic
Recommendations are strictly conditioned on observed empirical deficits:
1. **Attendance Deficit**: Recommends attending upcoming lecture sessions for specific flagged course codes.
2. **Overdue Coursework**: Flags specific assignment titles and courses to prevent grade penalties.
3. **Imminent Deadlines**: Reminds student of coursework due within 48 hours.
4. **Subject Remediation**: Identifies modules where marks are $< 50\%$ and advises instructor consultation.
5. **Career Acceleration**: For low-risk students, recommends elective projects aligned with `career_goal`.

---

## 9. API Endpoint
* **Path:** `GET /api/students/academic-analysis`
* **Access:** Private (Student JWT required; user ID extracted from `req.user.id`).
* **Format:** Standardized JSON.

---

## 10. Security Model
1. **Identity Grounding:** Uses `req.user.id` from the cryptographically verified JWT payload. Rejects query/path parameter tampering (IDOR immunity).
2. **Role Authorization:** Protected by `requireRole('student')` middleware (returns `403 Forbidden` for lecturers or admins).
3. **SQL Injection Defense:** All database queries utilize parameterized `?` placeholders.
4. **Credential Isolation:** Never returns `password_hash`, plain passwords, or `JWT_SECRET`.

---

## 11. Example API Response
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 4,
      "reg_number": "2023CSCA001",
      "fullName": "Alex Perera",
      "department": "Computer Science",
      "currentSemester": "Year 2 Sem 2",
      "careerGoal": "Software Engineer"
    },
    "risk": {
      "level": "LOW",
      "score": 5,
      "reasons": [
        "All core indicators (GPA, attendance, coursework, and assessments) are in good standing."
      ]
    },
    "gpa": {
      "current": 3.85,
      "trend": "STABLE",
      "trendDetail": "Academic performance remains steady across modules.",
      "strongestCourse": {
        "courseCode": "CSC203S2",
        "courseTitle": "Database Management Systems",
        "score": 92.5,
        "grade": "A+"
      },
      "weakestCourse": {
        "courseCode": "CSC204S2",
        "courseTitle": "Computer Networks & Protocols",
        "score": 84.0,
        "grade": "A-"
      }
    },
    "attendance": {
      "overall": 95.0,
      "totalClasses": 120,
      "attendedClasses": 116,
      "warnings": []
    },
    "assignments": {
      "total": 4,
      "submitted": 2,
      "graded": 2,
      "pending": 2,
      "overdue": 0,
      "completionRate": 50,
      "priorityList": [
        {
          "id": 1,
          "courseCode": "CSC203S2",
          "title": "Database Normalization & Relational Schema",
          "priority": "HIGH",
          "isOverdue": false
        }
      ]
    },
    "coursePerformance": {
      "strongCount": 5,
      "attentionCount": 0,
      "strong": [
        {
          "courseCode": "CSC203S2",
          "courseTitle": "Database Management Systems",
          "averageMark": 92.5,
          "status": "STRONG"
        }
      ]
    },
    "strengths": [
      {
        "title": "Exceptional Academic Standing",
        "detail": "Cumulative GPA of 3.85 places you in the top tier of your degree program.",
        "evidence": "GPA: 3.85 / 4.00"
      }
    ],
    "weaknesses": [],
    "recommendations": [
      {
        "category": "CAREER_ACCELERATION",
        "urgency": "MEDIUM",
        "text": "Your academic profile is strong. Advance your target career goal as a Software Engineer by tackling industry portfolio projects."
      }
    ],
    "priorityActions": [
      {
        "level": "HIGH",
        "action": "Finalize \"Database Normalization & Relational Schema\" (CSC203S2) due in less than 48 hours.",
        "tag": "Coursework"
      }
    ]
  }
}
```

---

## 12. Why the Engine is Explainable for University Viva
1. **Zero Hallucinations:** Every number, grade, attendance score, and risk rating is deterministically traced back to a specific row in MySQL.
2. **Transparent Mathematical Model:** The risk score is an additive 100-point formula with clearly defined thresholds ($<2.0$ GPA, $<75\%$ attendance, overdue coursework).
3. **Auditable Rules:** When an intervention recommendation is triggered, the system explicitly prints the exact empirical evidence (e.g. `CSC203S2: 66.7% attendance`, `GPA: 1.80`).
4. **Viva Defensibility:** The student or examiner can query the database directly and verify that every generated insight matches the ground truth.
