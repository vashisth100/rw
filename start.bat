@echo off
title RoadWatch AI - Startup
color 0A
cls

echo.
echo  =====================================================
echo    RoadWatch AI v4 - Smart Road Intelligence System
echo  =====================================================
echo.

set ROOT=%~dp0

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js not found. Install from https://nodejs.org
  pause & exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo  [OK] Node.js %%i

:: Install dependencies
echo.
echo  [1/3] Installing backend dependencies...
cd /d "%ROOT%backend" && call npm install --silent
echo  [OK] Backend ready

echo  [2/3] Installing frontend dependencies...
cd /d "%ROOT%frontend" && call npm install --silent
echo  [OK] Frontend ready

:: Start MongoDB
echo  [3/3] Starting MongoDB...
net start MongoDB >nul 2>&1
echo  [OK] MongoDB ready

timeout /t 2 /nobreak >nul

:: Launch all services
start "RoadWatch - Backend" cmd /k "cd /d "%ROOT%backend" && node src/server.js"
timeout /t 3 /nobreak >nul

python --version >nul 2>&1
if %errorlevel%==0 (
  start "RoadWatch - AI Service" cmd /k "cd /d "%ROOT%ai-service" && uvicorn main:app --host 0.0.0.0 --port 8000"
  timeout /t 2 /nobreak >nul
) else (
  echo  [SKIP] Python not found - AI service skipped (mock detection active)
)

start "RoadWatch - Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"
timeout /t 6 /nobreak >nul

cls
echo.
echo  =====================================================
echo    RoadWatch AI is running!
echo  =====================================================
echo.
echo    Frontend   ->  http://localhost:5173
echo    Backend    ->  http://localhost:3001
echo    AI Service ->  http://localhost:8000
echo    API Docs   ->  http://localhost:8000/docs
echo.
echo    Demo:  demo@roadwatch.ai  /  demo1234
echo.
echo    TIP: Run seed to load 50 real incidents:
echo         cd backend ^&^& node src/seed.js
echo.
echo  =====================================================
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5173
pause
