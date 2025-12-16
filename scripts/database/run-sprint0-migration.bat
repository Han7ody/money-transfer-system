@echo off
echo ========================================
echo Sprint 0 & Sprint 1 Security Migration
echo ========================================
echo.

REM Load environment variables
if exist "..\..\backend\.env" (
    for /f "tokens=1,2 delims==" %%a in (..\..\backend\.env) do (
        if "%%a"=="DATABASE_URL" set DATABASE_URL=%%b
    )
)

if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL not found in backend/.env
    pause
    exit /b 1
)

echo Running migration...
echo.

psql "%DATABASE_URL%" -f sprint0-security-tables.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo New tables created:
    echo - admin_sessions
    echo - ip_whitelist
    echo - failed_login_attempts
    echo - transaction_state_transitions
    echo - kyc_state_transitions
    echo - transaction_approvals
    echo.
    echo New columns added to audit_logs:
    echo - session_id
    echo - geolocation
    echo - checksum
    echo.
    echo Audit logs are now immutable (triggers added)
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
