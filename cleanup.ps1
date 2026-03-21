# Kill all Node.js processes
Write-Host "Killing Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill all npm processes
Write-Host "Killing npm processes..." -ForegroundColor Yellow
Get-Process -Name npm -ErrorAction SilentlyContinue | Stop-Process -Force

# Stop and remove Docker containers
Write-Host "Cleaning up Docker containers..." -ForegroundColor Yellow
docker-compose down -v
