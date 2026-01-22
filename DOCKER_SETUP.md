# Docker Setup and Testing Guide

## Quick Start

### 1. Start Docker Services
```powershell
# Navigate to project root
cd C:\Users\dadim\OneDrive\Desktop\eRankUp

# Start PostgreSQL and Redis
docker-compose up -d

# Verify containers are running
docker ps
```

### 2. Run Database Migrations
```powershell
cd backend
npm run migration:run
```

### 3. Start Backend
```powershell
npm run start:dev
```

### 4. Start Frontend (New Terminal)
```powershell
cd frontend
npm run dev
```

---

## Docker Commands Reference

### Start Services
```powershell
docker-compose up -d              # Start all services in background
docker-compose up -d postgres     # Start only PostgreSQL
docker-compose up -d redis        # Start only Redis
```

### Stop Services
```powershell
docker-compose down               # Stop all services
docker-compose down -v            # Stop and remove volumes (fresh start)
```

### View Logs
```powershell
docker-compose logs               # View all logs
docker-compose logs -f postgres   # Follow PostgreSQL logs
docker-compose logs -f redis      # Follow Redis logs
```

### Check Status
```powershell
docker ps                         # List running containers
docker-compose ps                 # List project containers
```

### Restart Services
```powershell
docker-compose restart            # Restart all services
docker-compose restart postgres   # Restart PostgreSQL only
```

---

## Database Management

### Connect to PostgreSQL
```powershell
# Using Docker exec
docker exec -it erankup-postgres psql -U admin -d erankup_db

# Common psql commands:
\dt                  # List tables
\d table_name        # Describe table
\q                   # Quit
```

### Reset Database
```powershell
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Run migrations
cd backend
npm run migration:run
```

### Backup Database
```powershell
docker exec erankup-postgres pg_dump -U admin erankup_db > backup.sql
```

### Restore Database
```powershell
docker exec -i erankup-postgres psql -U admin -d erankup_db < backup.sql
```

---

## Redis Management

### Connect to Redis
```powershell
docker exec -it erankup-redis redis-cli

# Common Redis commands:
PING                 # Test connection
KEYS *               # List all keys
FLUSHALL             # Clear all data
```

### Monitor Redis
```powershell
docker exec -it erankup-redis redis-cli MONITOR
```

---

## Troubleshooting

### Port Already in Use
```powershell
# Check what's using port 5432
netstat -ano | findstr :5432

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml:
ports:
  - "5433:5432"  # Use 5433 instead
```

### Container Won't Start
```powershell
# View error logs
docker-compose logs postgres

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Database Connection Refused
```powershell
# Check container is running
docker ps

# Check health status
docker inspect erankup-postgres | findstr Health

# Restart container
docker-compose restart postgres
```

### Clear Everything and Start Fresh
```powershell
# Stop and remove everything
docker-compose down -v

# Remove containers
docker rm -f erankup-postgres erankup-redis

# Remove volumes
docker volume prune

# Start fresh
docker-compose up -d
```

---

## Testing Workflow

### 1. Fresh Start
```powershell
# Clean slate
docker-compose down -v
docker-compose up -d

# Wait for health checks
timeout /t 10

# Run migrations
cd backend
npm run migration:run
```

### 2. Run Tests
```powershell
# Unit tests
npm test

# Integration tests
cd ..
chmod +x test-integration.sh
./test-integration.sh
```

### 3. Manual Testing
```powershell
# Start backend
cd backend
npm run start:dev

# Start frontend (new terminal)
cd frontend
npm run dev

# Open browser
start http://localhost:3001
```

---

## Environment Variables

Ensure your `backend/.env` matches Docker settings:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=password
DB_NAME=erankup_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Other
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

---

## Health Checks

### Check if services are healthy
```powershell
# PostgreSQL
docker exec erankup-postgres pg_isready -U admin

# Redis
docker exec erankup-redis redis-cli ping
```

### Expected output:
- PostgreSQL: `localhost:5432 - accepting connections`
- Redis: `PONG`

---

## Production Notes

For production deployment:
1. Use strong passwords (not 'password')
2. Use environment variables for secrets
3. Enable SSL for PostgreSQL
4. Set up automated backups
5. Use managed database services (AWS RDS, etc.)

---

## Quick Reference

```powershell
# Start everything
docker-compose up -d && cd backend && npm run migration:run && npm run start:dev

# Stop everything
docker-compose down

# Fresh restart
docker-compose down -v && docker-compose up -d && cd backend && npm run migration:run

# View all logs
docker-compose logs -f
```

---

**Your Docker environment is now ready for testing!** 🐳
