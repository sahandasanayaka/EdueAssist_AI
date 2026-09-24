@echo off
title EduAssist AI - Launcher
echo ============================================================
echo          Starting EduAssist AI Academic Intelligence
echo ============================================================
echo.

:: 1. Ensure server/.env exists
if not exist "server\.env" (
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env" >nul
    )
)

:: 2. Start Backend Server
echo [1/2] Launching Backend Server on port 5000...
start "EduAssist Backend Server (Port 5000)" cmd /k "cd /d ""%~dp0server"" && npm start"

:: 3. Start Frontend Client
echo [2/2] Launching Frontend Client on port 5173...
start "EduAssist Frontend Client (Port 5173)" cmd /k "cd /d ""%~dp0client"" && npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ============================================================
echo           EduAssist AI is Running Successfully!
echo ============================================================
echo  🌐 Web Portal : http://localhost:5173
echo  🏥 API Health : http://localhost:5000/api/health
echo.
echo ------------------------------------------------------------
echo  DEMO LOGIN ACCOUNTS (Password for all: password123)
echo ------------------------------------------------------------
echo  🎓 STUDENT  : ID: 2023CSCA001    (Full Academic & AI Dashboard)
echo  👨‍🏫 LECTURER : ID: Lec001         (Faculty Course & Grading View)
echo  🛡️ ADMIN    : ID: admin01        (System Governance & Audits)
echo ------------------------------------------------------------
echo.
echo [Tip] Keep the backend and frontend terminal windows open while using.
echo.
pause
