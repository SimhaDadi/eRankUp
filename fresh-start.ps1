# Run cleanup
.\cleanup.ps1

# Start core services
Write-Host "Starting Postgres and Redis..." -ForegroundColor Green
docker-compose up -d postgres redis

# Wait for database to be ready
Write-Host "Waiting for database..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Run migrations
Write-Host "Running Backend Migrations..." -ForegroundColor Green
cd backend
npm run migration:run
cd ..

# Start backend (consider running this in a new terminal if manual)
Write-Host "Starting Backend..." -ForegroundColor Green
cd backend
Start-Process -NoNewWindow npm -ArgumentList "run start:dev"
cd ..

Write-Host "System fresh start complete. Backend is starting in background." -ForegroundColor Green
