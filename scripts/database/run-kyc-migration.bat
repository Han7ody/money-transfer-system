@echo off
echo Running KYC and Fraud Detection Tables Migration...
echo.

psql -U postgres -d money_transfer_db -f kyc-fraud-tables.sql

echo.
echo Migration complete!
pause
