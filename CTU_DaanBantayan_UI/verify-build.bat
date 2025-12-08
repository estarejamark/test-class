@echo off
echo ========================================
echo Build Verification Script
echo ========================================
echo.

echo [1/4] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    exit /b 1
)
echo.

echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    exit /b 1
)
echo.

echo [3/4] Running build...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    exit /b 1
)
echo.

echo [4/4] Build verification complete!
echo ========================================
echo SUCCESS: Application is ready for deployment
echo ========================================
echo.
echo Next steps:
echo 1. Configure environment variables
echo 2. Start backend server
echo 3. Run: npm start
echo.
pause
