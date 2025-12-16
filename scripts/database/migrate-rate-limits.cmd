@echo off
echo ========================================
echo Sprint-1: Rate Limits Migration
echo ========================================
echo.

cd backend

echo [1/3] Generating Prisma migration...
npx prisma migrate dev --name add_rate_limits_sprint1

echo.
echo [2/3] Generating Prisma Client...
npx prisma generate

echo.
echo [3/3] Migration complete!
echo.
echo ========================================
echo Next Steps:
echo 1. Start the backend server
echo 2. Login as SUPER_ADMIN
echo 3. Navigate to /admin/security/rate-limits
echo 4. Create your first rate limit rule
echo ========================================
echo.

cd ..
pause
