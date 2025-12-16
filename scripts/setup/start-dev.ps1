# Development Startup Script
# Starts backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Rasid Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
$pg = sc query postgresql-x64-15 2>$null
if ($pg -match "RUNNING") {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL is NOT running" -ForegroundColor Red
    Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
    net start postgresql-x64-15
}

Write-Host ""

# Check if backend .env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "✗ backend/.env file missing!" -ForegroundColor Red
    Write-Host "Please create backend/.env file with database credentials" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Cyan
    Write-Host "DATABASE_URL=postgresql://postgres:password@localhost:5432/money_transfer_db"
    Write-Host "JWT_SECRET=your-super-secret-key"
    Write-Host "PORT=5000"
    Write-Host ""
    exit 1
}

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Backend Server' -ForegroundColor Cyan; npm run dev"

Write-Host "✓ Backend starting on http://localhost:5000" -ForegroundColor Green
Write-Host "  Waiting 5 seconds for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Test backend
Write-Host "Testing backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Backend is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend may still be starting..." -ForegroundColor Yellow
}

Write-Host ""

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Frontend Server' -ForegroundColor Cyan; npm run dev"

Write-Host "✓ Frontend starting on http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Development Environment Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each terminal window to stop servers" -ForegroundColor Gray
Write-Host ""
