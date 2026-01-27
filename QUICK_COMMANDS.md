# Quick Commands Reference

## System Cleanup & Fresh Start

### Option 1: Complete Fresh Start (Recommended)
```powershell
cd D:\eRankUp
.\fresh-start.ps1
```
This will:
- Kill all zombie processes
- Stop and remove Docker containers
- Free up all ports
- Start Docker services
- Run migrations
- Start backend server

### Option 2: Manual Cleanup Only
```powershell
cd D:\eRankUp
.\cleanup.ps1
```
Then manually start services.

---

## Individual Commands

### Kill Zombie Processes
```powershell
# Kill all Node.js processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill all npm processes
Get-Process -Name npm -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Docker Management
```powershell
# Stop all containers
docker stop $(docker ps -q)

# Remove all containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Check status
docker ps
```

### Port Management
```powershell
# Check what's using port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Kill process using port 3000
$conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }

# Check all important ports
3000, 3001, 5432, 6379 | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($conn) { 
        Write-Host "Port $_ in use by PID $($conn.OwningProcess)"
    } else {
        Write-Host "Port $_ is free"
    }
}
```

### Database Management
```powershell
# Fresh database
docker-compose down -v
docker-compose up -d postgres redis
timeout /t 15
cd backend
npm run migration:run
```

---

## Testing Workflow

### 1. Fresh Start
```powershell
.\fresh-start.ps1
```

### 2. Start Frontend (New Terminal)
```powershell
cd D:\eRankUp\frontend
npm run dev
```

### 3. Run Tests
```powershell
# Unit tests
cd backend
npm test

# Integration tests
cd ..
.\test-integration.sh
```

---

## Troubleshooting

### "Scripts disabled" Error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use
```powershell
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Docker Won't Start
```powershell
# Restart Docker Desktop
Restart-Service docker

# Or restart via GUI
# Right-click Docker Desktop icon → Restart
```

### Migration Fails
```powershell
# Check database is running
docker exec erankup-postgres pg_isready -U admin

# View logs
docker logs erankup-postgres

# Reset database
docker-compose down -v
docker-compose up -d
timeout /t 15
cd backend
npm run migration:run
```

---

## Emergency Reset

If everything is broken:

```powershell
# Nuclear option - reset everything
Get-Process node,npm -ErrorAction SilentlyContinue | Stop-Process -Force
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker volume prune -f
docker-compose up -d
timeout /t 20
cd backend
npm run migration:run
npm run start:dev
```

---

## Files Created

- `cleanup.ps1` - System cleanup script
- `fresh-start.ps1` - Complete fresh start
- `QUICK_COMMANDS.md` - This reference guide

---

**For a fresh start, just run:**
```powershell
.\fresh-start.ps1
```
