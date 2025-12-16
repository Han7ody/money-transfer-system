@echo off
echo ========================================
echo  Database Migration for Agent System
echo ========================================
echo.

cd backend

echo Running Prisma migration...
call npx prisma migrate dev --name add_agent_and_cash_pickup

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Migration failed!
    echo Please check your database connection in backend/.env
    pause
    exit /b 1
)

echo.
echo Generating Prisma client...
call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Prisma generate failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Migration Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start backend: cd backend ^&^& npm run dev
echo 2. Start frontend: cd frontend ^&^& npm run dev
echo 3. Open http://localhost:3000
echo.

cd ..
pause
