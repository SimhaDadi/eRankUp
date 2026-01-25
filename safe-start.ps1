# Safe Start Script - PROTECTS DATA
# Usage: .\safe-start.ps1
# This script restarts the application WITHOUT deleting database data.

Write-Host "🛡️ SAFE START - Starting System (Data Preserved)" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# 1. Stop any running Node.js processes (Backend/Frontend) to free ports
Write-Host "[1/4] Freeing ports (Stopping Node processes)..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Start Docker Services (Database)
# using 'up -d' ensures they run; it does NOT destroy volumes like 'down -v'
Write-Host "[2/4] Ensuring Database is running..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker. Is Docker Desktop running?"
    exit
}

# Wait a moment for DB to be ready
Write-Host "      Waiting for database..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 3. Run Migrations (Safe to run repeatedly)
Write-Host "[3/4] Checking Database Migrations..." -ForegroundColor Yellow
Set-Location -Path ".\backend"
try {
    npm run migration:run
} catch {
    Write-Warning "Migration step had issues, but attempting to proceed..."
}

# 4. Start Backend
Write-Host "[4/4] Starting Backend Server..." -ForegroundColor Yellow
Write-Host "      (Open a new terminal for Frontend: npm run dev)" -ForegroundColor Cyan
Write-Host "      Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

# Prefer the built file if it exists (proven to work), otherwise try dev
if (Test-Path "dist\backend\src\main.js") {
    node dist/backend/src/main.js
} else {
    npm run start:dev
}
