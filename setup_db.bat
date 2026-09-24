@echo off
title EduAssist AI - Database Setup
echo ============================================================
echo         EduAssist AI - Automated Database Setup
echo ============================================================
echo.
echo Connecting to MySQL and configuring 'eduassist_db'...
echo.

if not exist "server\.env" (
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env" >nul
    )
)

node database/migrate.js --seed
echo.
if %errorlevel% neq 0 (
    echo [ERROR] Could not connect to MySQL.
    echo.
    echo Please make sure:
    echo  1. XAMPP Control Panel is open.
    echo  2. The "Start" button next to MySQL has been clicked and shows green.
    echo.
    echo After starting MySQL in XAMPP, run this file again!
) else (
    echo ============================================================
    echo [SUCCESS] Database 'eduassist_db' is fully created and seeded!
    echo All student records, courses, and credentials are ready.
    echo ============================================================
)
echo.
pause
