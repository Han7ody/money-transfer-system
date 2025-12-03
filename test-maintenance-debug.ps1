# Maintenance Mode Debug Script (Windows PowerShell)
# Run this to diagnose why users can still login during maintenance

Write-Host "=== Maintenance Mode Debug ===" -ForegroundColor Cyan
Write-Host ""

$API_BASE = "http://localhost:5000/api"

# Step 1: Check debug endpoint
Write-Host "1. Checking actual database values:" -ForegroundColor Yellow
Write-Host "   GET /debug/maintenance-value" -ForegroundColor Gray
$response = Invoke-RestMethod "$API_BASE/debug/maintenance-value" -Method Get
$response | ConvertTo-Json | Write-Host
Write-Host ""

# Step 2: Check system status endpoint
Write-Host "2. Checking system status endpoint:" -ForegroundColor Yellow
Write-Host "   GET /public/system-status" -ForegroundColor Gray
$response = Invoke-RestMethod "$API_BASE/public/system-status" -Method Get
$response | ConvertTo-Json | Write-Host
Write-Host ""

# Step 3: Try normal user login
Write-Host "3. Attempting normal user login:" -ForegroundColor Yellow
Write-Host "   POST /auth/login" -ForegroundColor Gray
Write-Host "   Email: student@example.com" -ForegroundColor Gray
try {
  $response = Invoke-RestMethod "$API_BASE/auth/login" -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body '{"email":"student@example.com","password":"Password123"}'
  $response | ConvertTo-Json | Write-Host
} catch {
  $_.Exception.Response.StatusCode | Write-Host -ForegroundColor Red
  $_.Content | ConvertTo-Json | Write-Host
}
Write-Host ""

# Step 4: Try admin login
Write-Host "4. Attempting admin login:" -ForegroundColor Yellow
Write-Host "   POST /auth/login" -ForegroundColor Gray
Write-Host "   Email: admin@moneytransfer.com" -ForegroundColor Gray
try {
  $response = Invoke-RestMethod "$API_BASE/auth/login" -Method Post `
    -Headers @{"Content-Type" = "application/json"} `
    -Body '{"email":"admin@moneytransfer.com","password":"Admin@123"}'
  $response | ConvertTo-Json | Write-Host
} catch {
  $_.Exception.Response.StatusCode | Write-Host -ForegroundColor Red
  $_.Content | ConvertTo-Json | Write-Host
}
Write-Host ""

Write-Host "=== Check your server logs for [Login] and [System Status] messages ===" -ForegroundColor Cyan
Write-Host "Look for DEBUG output to trace the maintenance check" -ForegroundColor Gray
