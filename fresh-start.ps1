# Fresh Start Script - Complete Reset and Testing Setup

Write-Host "🚀 Fresh Start - Complete System Reset" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
Set-Location -Path "C:\Users\dadim\OneDrive\Desktop\eRankUp"

# Step 1: Cleanup
Write-Host "Step 1: Running cleanup..." -ForegroundColor Yellow
& .\cleanup.ps1

# Step 2: Start Docker
Write-Host ""
Write-Host "Step 2: Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to start (15 seconds)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Check if containers are running
Write-Host ""
Write-Host "Checking Docker containers..." -ForegroundColor Yellow
docker ps

# Step 3: Run migrations
Write-Host ""
Write-Host "Step 3: Running database migrations..." -ForegroundColor Yellow
Set-Location -Path ".\backend"
npm run migration:run

# Step 4: Start backend
Write-Host ""
Write-Host "Step 4: Starting backend server..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""
npm run start:dev
