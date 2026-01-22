# System Cleanup Script for Fresh Testing
# Kills all Node.js, Docker, and related processes

Write-Host "Starting System Cleanup..." -ForegroundColor Cyan
Write-Host ""

# Function to safely kill processes
function Kill-ProcessSafely {
    param($ProcessName)
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "Killing $($processes.Count) $ProcessName process(es)..." -ForegroundColor Yellow
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Write-Host "Done: $ProcessName processes killed" -ForegroundColor Green
    } else {
        Write-Host "Done: No $ProcessName processes found" -ForegroundColor Gray
    }
}

# 1. Kill Node.js processes
Write-Host "1. Cleaning Node.js processes..." -ForegroundColor Cyan
Kill-ProcessSafely -ProcessName "node"
Kill-ProcessSafely -ProcessName "npm"

# 2. Stop Docker containers
Write-Host ""
Write-Host "2. Stopping Docker containers..." -ForegroundColor Cyan
try {
    $containers = docker ps -q 2>$null
    if ($containers) {
        docker stop $containers 2>$null
        Write-Host "Done: Docker containers stopped" -ForegroundColor Green
    } else {
        Write-Host "Done: No Docker containers running" -ForegroundColor Gray
    }
}
catch {
    Write-Host "Done: Docker not running or no containers" -ForegroundColor Gray
}

# 3. Remove Docker containers
Write-Host ""
Write-Host "3. Removing Docker containers..." -ForegroundColor Cyan
try {
    docker-compose down -v 2>$null
    Write-Host "Done: Docker containers removed" -ForegroundColor Green
}
catch {
    Write-Host "Done: No containers to remove" -ForegroundColor Gray
}

# 4. Check and free ports
Write-Host ""
Write-Host "4. Checking ports..." -ForegroundColor Cyan

$ports = @(3000, 3001, 5432, 6379)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  Port $port used by $($process.ProcessName) - freeing..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "  Done: Freed port $port" -ForegroundColor Green
        }
    } else {
        Write-Host "  Done: Port $port is free" -ForegroundColor Gray
    }
}

# 5. Clear npm cache
Write-Host ""
Write-Host "5. Clearing npm cache..." -ForegroundColor Cyan
try {
    npm cache clean --force 2>$null
    Write-Host "Done: npm cache cleared" -ForegroundColor Green
}
catch {
    Write-Host "Done: npm cache clean skipped" -ForegroundColor Gray
}

Write-Host ""
Write-Host "System cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. docker-compose up -d" -ForegroundColor White
Write-Host "2. cd backend" -ForegroundColor White
Write-Host "3. npm run migration:run" -ForegroundColor White
Write-Host "4. npm run start:dev" -ForegroundColor White
Write-Host ""
