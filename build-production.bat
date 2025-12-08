@echo off
echo ========================================
echo Production Build Script
echo ========================================
echo.

echo [1/3] Building Backend...
cd CTU_DB_API
call gradlew.bat clean build -x test
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed!
    cd ..
    pause
    exit /b 1
)
echo Backend build successful!
cd ..
echo.

echo [2/3] Building Frontend...
cd CTU_DaanBantayan_UI
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    cd ..
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    cd ..
    pause
    exit /b 1
)
echo Frontend build successful!
cd ..
echo.

echo [3/3] Build Summary
echo ========================================
echo Backend JAR: CTU_DB_API\build\libs\CTU_DB_API-0.0.1-SNAPSHOT.jar
echo Frontend: CTU_DaanBantayan_UI\.next
echo ========================================
echo.
echo SUCCESS: Production build complete!
echo.
echo Next steps:
echo 1. Configure production environment variables
echo 2. Deploy backend JAR to server
echo 3. Deploy frontend or run: npm start
echo.
pause
