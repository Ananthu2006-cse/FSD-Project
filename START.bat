@echo off
title Warehouse IMS — Start

echo Starting Backend (Spring Boot)...
start "Backend - Port 8080" cmd /k "cd /d "%~dp0backend" && "C:\Program Files\Apache\maven\bin\mvn.cmd" spring-boot:run"

echo Waiting for backend to initialize...
timeout /t 12 /nobreak >nul

echo Starting Frontend (React/Vite)...
start "Frontend - Port 5173" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =============================================
echo  App is starting!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8080
echo =============================================
echo  Open http://localhost:5173 in your browser.
echo  Close the two opened terminal windows to stop the app.
echo =============================================
pause
