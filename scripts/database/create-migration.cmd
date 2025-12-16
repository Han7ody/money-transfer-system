@echo off
cd backend
npx prisma migrate dev --name add_agent_and_cash_pickup
cd ..
pause
