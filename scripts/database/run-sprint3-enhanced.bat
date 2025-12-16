@echo off
echo ========================================
echo Sprint 3 Enhanced Migration
echo ========================================
echo.

cd /d "%~dp0"

echo Running migration script...
node run-sprint3-enhanced.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. cd backend
    echo 2. npx prisma generate
    echo 3. Restart backend server
    echo.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo Please check the error messages above.
    echo.
)

pause
