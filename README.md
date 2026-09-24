# 🎓 EduAssist AI — University Academic Advisory & Performance Gap Analyzer

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey?logo=express)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%20%7C%20MariaDB-4479A1?logo=mysql)](https://www.mysql.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

> **EduAssist AI** is an intelligent academic advisory and performance gap analysis platform for university students. By pulling course details, assignment records, and continuous assessment marks from the university Learning Management System (LMS), EduAssist AI calculates the exact mark deficit (+X% score gap) required to reach university honors benchmarks (Distinction 85%+, High Distinction 90%+) and delivers targeted, AI-powered revision advice on weak conceptual topics.

---

## 📌 Project Scope & Core Clarifications

* ❌ **No Assignment Submissions**: This platform is **NOT** an assignment dropbox. Students do not upload files or submit coursework here. All assessment marks and deliverables originate from the LMS.
* 🎯 **Score Gap & Advisory Engine**: The system is designed to analyze published continuous assessment marks and tell students:
  1. What their current module mark is.
  2. What their target mark is.
  3. **Exactly how much (+X%) they need to improve**.
  4. Which specific concepts (e.g., 3NF Normalization, Subnetting, Design Patterns) they must revise to close that gap.
* 👥 **Roles**: The platform provides two dedicated interfaces:
  1. **Student**: Coursework analytics, score gap diagnostics, revision tips, and AI study coach.
  2. **Admin**: Institutional oversight, student records, course catalog, and system diagnostics.
* 🗄️ **Database**: Powered exclusively by **MySQL** (`eduassist_db`).

---

## 🏛️ System Architecture

EduAssist AI follows a modern, decoupled **3-Tier Client-Server Architecture** with an integrated AI Intelligence Layer:

```
[ User Browser ]
       │
       ▼ (Port 5173 - React 19 + Vite)
┌─────────────────────────────────────────────────────────────┐
│ 1. Presentation Tier (Frontend Client)                      │
│    • Pages: StudentDashboard.jsx, AdminDashboard.jsx        │
│    • Services: studentApi.js, api.js (Axios Instance)       │
│    • Auth: JWT Token attached via Request Interceptor       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ (HTTP REST / JSON / Port 5000)
┌─────────────────────────────────────────────────────────────┐
│ 2. Application & API Gateway Tier (Express / Node.js)       │
│    • Server: server.js (CORS, Rate Limiting, Sanitization)  │
│    • Routes: /api/students, /api/auth, /api/admin           │
│    • Controllers: studentController.js                      │
│    • Services: studentService.js, chatService.js            │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ 3. Data Persistence Tier     │ │ 4. AI Intelligence Tier      │
│    • Database: MySQL 8       │ │    • Google Gemini AI        │
│    • DB Name: eduassist_db   │ │    • Model: gemini-2.5-flash │
│    • Driver: mysql2/promise  │ │    • SDK: @google/genai      │
│    • Connection: Pool (10)   │ │    • Feature: Grounding with │
│    • Tables: students,       │ │      authoritative MySQL     │
│      courses, enrollments,   │ │      marks (Zero             │
│      assignments, exam_marks │ │      Hallucination)          │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 🔄 End-to-End Data Flow (How Components Connect)

1. **User Action (Frontend)**:
   * The student loads the dashboard (`StudentDashboard.jsx`). React runs `useEffect()` and calls `studentApi.getDashboard()`.
2. **HTTP Request Bridge (Axios)**:
   * `client/src/services/api.js` dispatches an asynchronous HTTP GET request to `http://localhost:5000/api/students/dashboard`.
   * An Axios request interceptor automatically extracts the student's JWT token from `localStorage` and appends `Authorization: Bearer <token>`.
3. **Backend Routing & Security (Express)**:
   * `server/server.js` validates CORS (allowing `http://localhost:5173`), parses the JSON body, and routes the request through `server/src/routes/studentRoutes.js`.
   * `authMiddleware.verifyToken` verifies the JWT signature before passing execution to `studentController.js`.
4. **Database Query (MySQL Connection Pool)**:
   * `studentService.js` borrows a reusable connection from `server/src/db/connection.js` (`mysql2/promise`).
   * It executes parameterized SQL queries joining `enrollments`, `courses`, and `exam_results` to retrieve real continuous assessment marks.
5. **AI Reasoning & Grounding (Google Gemini)**:
   * When the student clicks **"Get Revision Tips"** or requests study advice, `server/src/services/geminiService.js` is triggered.
   * **Grounding Principle**: The backend injects the student's real MySQL marks into the prompt. The AI model (`gemini-2.5-flash`) reasons strictly over verified marks and outputs actionable revision tips with zero hallucinations.
6. **Reactive UI Render**:
   * The controller returns a JSON payload. React updates its state (`setData(...)`), rendering live KPI cards, score gap badges, and revision recommendations.

---

## 💻 Dashboard Components Explained

| Component | Visual Location | Purpose & Function |
| :--- | :--- | :--- |
| **Hero Banner** | Top of Dashboard | Welcomes the student and provides quick navigation to the AI study roadmap. |
| **Enrolled LMS Modules** | KPI Card 1 | Displays active enrolled modules (e.g. 5 Modules) synced with LMS database tables. |
| **Coursework Average** | KPI Card 2 | Real-time mathematical average of all published continuous assessment marks (e.g. 96.5%). |
| **Improvement Target** | KPI Card 3 | **Core Feature:** Calculates the exact score gap (e.g. `+2.5% Gap`) needed to achieve First Class / Top Distinction (Goal: 95%+). |
| **AI Improvement Focus** | KPI Card 4 | Highlights the top conceptual areas across all subjects where marks were dropped. |
| **Deadlines Tab** | Hub Tab 1 | Lists upcoming continuous assessment deliverables with a **"Get Revision Tips"** button (NO submit button). |
| **Graded Marks Tab** | Hub Tab 2 | Displays evaluated coursework with lecturer feedback and distinction scores. |
| **Score Gap & Suggestions** | Hub Tab 3 | **Heart of the App:** Per-module cards displaying Current Score, Target Score, **Score Gap (+X% Needed)**, and specific revision topics. |
| **Academic Schedule Tab** | Hub Tab 4 | Interactive calendar highlighting coursework milestone dates. |
| **Floating AI Copilot** | Bottom Right | One-click chatbot for asking academic questions, revision tips, and practice problems. |

---

## 🛠️ Tech Stack & Directory Structure

```
eduassist-ai/
├── client/                     # Frontend Application (React 19 + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI widgets (Navbar, MiniCalendar, ErrorMessage)
│   │   ├── pages/              # Main Views (StudentDashboard, AdminDashboard, AIPlan)
│   │   ├── services/           # API Layer (api.js, studentApi.js, authApi.js)
│   │   └── App.jsx             # Router and Global Providers
│   └── package.json
│
├── server/                     # Backend API Server (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Environment, DB, and Security settings
│   │   ├── controllers/        # Request Handlers (studentController, authController)
│   │   ├── db/                 # MySQL Connection Pool (connection.js)
│   │   ├── middleware/         # Auth, Error Handling, and Request Logger
│   │   ├── routes/             # API Endpoints (studentRoutes, authRoutes, adminRoutes)
│   │   └── services/           # Business Logic & AI (studentService, geminiService)
│   ├── server.js               # Application Entry Point
│   └── package.json
│
├── database/                   # Database Schemas & Migrations
│   └── EduAssist_DB_Schema.sql # Production MySQL relational schema
└── README.md                   # System Documentation
```

---

## 🚀 Quick Start & Installation

### 1. Database Setup (MySQL)
1. Open MySQL Workbench, phpMyAdmin, or your terminal.
2. Execute the schema file located at `EduAssist_DB_Schema.sql`:
   ```sql
   SOURCE database/EduAssist_DB_Schema.sql;
   ```
   *(Creates `eduassist_db` and seeds sample student courses, continuous assessment marks, and users).*

### 2. Backend Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   npm install
   ```
2. Configure `.env` in `server/`:
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=eduassist_db
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. Start the backend:
   ```bash
   node server.js
   # Server runs at http://localhost:5000
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to `client/`:
   ```bash
   cd client
   npm install
   npm run dev
   # App runs at http://localhost:5173
   ```

---

## 🔑 Demo Login Credentials

| Role | Username / Reg No | Password | Description |
| :--- | :--- | :--- | :--- |
| **Student** | `2023CSCA001` | `student123` | High Performer profile with active continuous assessment score gaps |
| **Student** | `2023CSCA003` | `student123` | Student requiring academic support in Database Systems |
| **Admin** | `admin` | `admin123` | Full administrative oversight and system statistics |

---

## 🎯 Viva Voce Defense Cheat Sheet

### 1. 30-Second Opening Pitch
> *"Good day, Professors. Our project is **EduAssist AI**, an academic advisory platform for university students. It pulls course details and continuous assessment marks directly from the university LMS. Crucially, students do **not** submit assignments here; instead, our platform calculates their exact **score gap (+X%)** to achieve Distinction benchmarks and uses **Google Gemini AI** with grounded MySQL data to suggest specific conceptual topics to study."*

### 2. Key Technical Q&A
* **Q: How does Frontend communicate with Backend?**
  * *A:* Through REST APIs using Axios. In `client/src/services/api.js`, an Axios instance connects to `http://localhost:5000/api` with an interceptor that attaches the user's JWT bearer token.
* **Q: How does the AI avoid hallucinating student grades?**
  * *A:* Through **Grounding** in `server/src/services/geminiService.js`. The backend first retrieves verified continuous assessment marks from MySQL and injects them into the system prompt. The model only analyzes real, verified marks.
* **Q: What database is used?**
  * *A:* Strictly **MySQL** (`eduassist_db`) via `mysql2/promise` using an asynchronous connection pool configured in `server/src/db/connection.js`.
* **Q: Can students submit assignments here?**
  * *A:* No. The system has no assignment submission dropbox. All coursework records come from the LMS, and the buttons offer **"Get Revision Tips"** instead of submission.

---
© 2026 EduAssist AI Team. All Rights Reserved.
