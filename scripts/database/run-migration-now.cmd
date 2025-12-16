@echo off
echo ========================================
echo  Running Database Migration
echo ========================================
echo.
echo This will reset your database and create all tables.
echo All existing data will be lost.
echo.
pause

cd backend
echo.
echo Running: npx prisma migrate reset
echo.
call npx prisma migrate reset --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  Migration Complete!
    echo ========================================
    echo.
    echo The backend should restart automatically.
    echo If not, press Ctrl+C in the backend terminal and run: npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo  Migration Failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
)

cd ..
pause
