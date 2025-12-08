@echo off
color 0A
echo ========================================
echo PRE-DEPLOYMENT CHECKLIST
echo ========================================
echo.

set /p check1="[1/10] Is PostgreSQL installed and running? (y/n): "
if /i not "%check1%"=="y" goto :incomplete

set /p check2="[2/10] Is Java JDK 21 installed? (y/n): "
if /i not "%check2%"=="y" goto :incomplete

set /p check3="[3/10] Is Node.js 18+ installed? (y/n): "
if /i not "%check3%"=="y" goto :incomplete

set /p check4="[4/10] Have you created the database 'ctu_db'? (y/n): "
if /i not "%check4%"=="y" goto :incomplete

set /p check5="[5/10] Have you imported ctu_db.sql? (y/n): "
if /i not "%check5%"=="y" goto :incomplete

set /p check6="[6/10] Have you configured .env for backend? (y/n): "
if /i not "%check6%"=="y" goto :incomplete

set /p check7="[7/10] Have you configured .env.local for frontend? (y/n): "
if /i not "%check7%"=="y" goto :incomplete

set /p check8="[8/10] Have you changed the default admin password? (y/n): "
if /i not "%check8%"=="y" (
    echo.
    echo WARNING: Default password should be changed after first login!
    echo.
)

set /p check9="[9/10] Have you reviewed DEPLOYMENT.md? (y/n): "
if /i not "%check9%"=="y" goto :incomplete

set /p check10="[10/10] Ready to build for production? (y/n): "
if /i not "%check10%"=="y" goto :incomplete

echo.
echo ========================================
echo ALL CHECKS PASSED!
echo ========================================
echo.
echo Starting production build...
echo.
call build-production.bat
goto :end

:incomplete
echo.
echo ========================================
echo INCOMPLETE SETUP
echo ========================================
echo.
echo Please complete all prerequisites before deployment.
echo Review DEPLOYMENT.md for detailed instructions.
echo.
pause
goto :end

:end
