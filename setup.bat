@echo off
title EduAssist AI - First Time Setup
echo ============================================================
echo         EduAssist AI - Automated First Time Setup
echo ============================================================
echo.

:: 1. Setup server/.env if missing
if not exist "server\.env" (
    echo [1/4] Configuring server environment file...
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env" >nul
        echo       Created server\.env from .env.example
    ) else (
        (
            echo PORT=5000
            echo NODE_ENV=development
            echo DB_HOST=localhost
            echo DB_PORT=3306
            echo DB_USER=root
            echo DB_PASSWORD=
            echo DB_NAME=eduassist_db
            echo JWT_SECRET=dev_secret_key_eduassist_companion_fallback
            echo CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
        ) > "server\.env"
        echo       Generated default server\.env
    )
) else (
    echo [1/4] server\.env already exists. OK!
)

:: 2. Install backend dependencies
echo.
echo [2/4] Installing Backend Dependencies (Express, MySQL2, etc.)...
cd server
call npm install
cd ..

:: 3. Install frontend dependencies
echo.
echo [3/4] Installing Frontend Dependencies (React, Vite, Tailwind, etc.)...
cd client
call npm install
cd ..

:: 4. Database Setup & Seeding
echo.
echo [4/4] Setting up MySQL Database (eduassist_db)...
echo       (Checking connection to MySQL on port 3306...)
node database/migrate.js --seed
if %errorlevel% neq 0 (
    echo.
    echo [!] MySQL connection failed or MySQL is not running yet.
    echo     NOTE: Please open XAMPP Control Panel and click "Start" next to MySQL.
    echo     Then double-click 'setup_db.bat' anytime to create and seed the database!
) else (
    echo.
    echo [OK] Database schema and 16 tables populated successfully!
)

echo.
echo ============================================================
echo [SUCCESS] Setup Completed!
echo You can now start the application by double-clicking 'start_app.bat'
echo ============================================================
echo.
pause
