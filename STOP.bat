@echo off
title Warehouse IMS — Stop

echo Stopping Backend (Java/Maven)...
taskkill /F /IM java.exe /T >nul 2>&1

echo Stopping Frontend (Node/Vite)...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo =============================================
echo  All servers stopped.
echo =============================================
pause
