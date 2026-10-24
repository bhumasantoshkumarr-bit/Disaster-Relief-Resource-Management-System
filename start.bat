@echo off
setlocal enabledelayedexpansion
title Disaster Relief Resource Management System Launcher

echo ===============================================================================
echo     DISASTER RELIEF RESOURCE MANAGEMENT SYSTEM - ONE-CLICK LAUNCHER
echo ===============================================================================
echo.

:: Resolve target project directory
set "PROJECT_DIR=%~dp0"
if exist "%PROJECT_DIR%Disaster-Relief-Resource-Management-System\package.json" (
    set "PROJECT_DIR=%PROJECT_DIR%Disaster-Relief-Resource-Management-System"
)
if exist "%~dp0..\Disaster-Relief-Resource-Management-System\package.json" (
    set "PROJECT_DIR=%~dp0..\Disaster-Relief-Resource-Management-System"
)
if exist "C:\Users\shaik thousif\Desktop\Santhu\Disaster-Relief-Resource-Management-System\package.json" (
    set "PROJECT_DIR=C:\Users\shaik thousif\Desktop\Santhu\Disaster-Relief-Resource-Management-System"
)

cd /d "%PROJECT_DIR%"

if not exist "package.json" (
    echo [ERROR] Could not locate Disaster Relief project files!
    echo Current Directory: %CD%
    echo Please make sure the project folder exists.
    pause
    exit /b 1
)

:: Verify Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH.
    echo Please install Node.js from https://nodejs.org/ and restart your terminal.
    pause
    exit /b 1
)

:: Ensure .env configuration exists
if not exist ".env" (
    echo [INFO] Generating default .env environment variables...
    (
        echo DATABASE_URL="file:./dev.db"
        echo JWT_SECRET="super-secret-jwt-disaster-relief-key-2026"
    ) > .env
)

:: Ensure dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing NPM dependencies (one-time setup)...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
)

:: Ensure Prisma Client is generated
if not exist "node_modules\.prisma\client" (
    echo [INFO] Generating Prisma Database Client...
    call npx prisma generate
)

:: Ensure SQLite Database is initialized and seeded
if not exist "prisma\dev.db" (
    echo [INFO] Initializing SQLite database and seeding sample records...
    call npx prisma db push --skip-generate
    call npx prisma db seed
)

echo.
echo ===============================================================================
echo   APPLICATION READY - DEMO CREDENTIALS
echo ===============================================================================
echo   Default Password for all demo accounts: password123
echo.
echo   * Admin:              admin@disaster.org
echo   * Disaster Officer:   officer@disaster.org
echo   * Resource Manager:   manager@disaster.org
echo   * Relief Camp Worker: camp@disaster.org
echo   * Volunteer:          volunteer@disaster.org
echo ===============================================================================
echo.

:: Launch background watcher: polls until port 3000 is open, then opens browser
start /b powershell -NoProfile -Command "$url = 'http://localhost:3000'; for ($i=0; $i -lt 30; $i++) { try { $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1; if ($res.StatusCode -eq 200) { Start-Process $url; break } } catch { Start-Sleep -Milliseconds 700 } }"

echo [INFO] Starting Next.js Web Application on http://localhost:3000 ...
echo [INFO] Your browser will open automatically once the server is ready.
echo [INFO] Press Ctrl+C at any time to stop the server.
echo.

:: Start Next.js server
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Server stopped with error code %ERRORLEVEL%.
    pause
)
