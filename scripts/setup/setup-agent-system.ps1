# Setup Agent System - PowerShell Script
# This script will set up the database and start the servers

Write-Host "🚀 Setting up Agent Management System..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Database Migration
Write-Host "📊 Step 1: Running database migration..." -ForegroundColor Yellow
Set-Location backend

Write-Host "Running Prisma migration..." -ForegroundColor Gray
npx prisma migrate dev --name add_agent_and_cash_pickup

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Please check your database connection in backend/.env" -ForegroundColor Red
    exit 1
}

Write-Host "Generating Prisma client..." -ForegroundColor Gray
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database migration complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Start Backend
Write-Host "🔧 Step 2: Starting backend server..." -ForegroundColor Yellow
Write-Host "Backend will start on http://localhost:5000" -ForegroundColor Gray
Write-Host ""

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Step 3: Start Frontend
Write-Host "🎨 Step 3: Starting frontend server..." -ForegroundColor Yellow
Write-Host "Frontend will start on http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Set-Location ..
Set-Location frontend

# Start frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Wait for both servers to start (check the new windows)" -ForegroundColor White
Write-Host "2. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "3. Login as admin" -ForegroundColor White
Write-Host "4. Navigate to /admin/agents to see the agents page" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more details, see SETUP_INSTRUCTIONS.md" -ForegroundColor Gray
Write-Host ""

Set-Location ..
