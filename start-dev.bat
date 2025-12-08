@echo off
echo ========================================
echo Academia de San Martin - Development Server
echo ========================================
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd CTU_DB_API && gradlew.bat bootRun"

timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd CTU_DaanBantayan_UI && npm run dev"

echo.
echo ========================================
echo Servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop all servers...
pause > nul

taskkill /FI "WindowTitle eq Backend Server*" /T /F
taskkill /FI "WindowTitle eq Frontend Server*" /T /F
