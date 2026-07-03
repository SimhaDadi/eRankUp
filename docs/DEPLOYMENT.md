# eRankUp Deployment Guide

This guide covers the complete deployment process for the eRankUp application on a Hetzner (or any Linux) server.

---

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Initial Server Setup](#initial-server-setup)
3. [Environment Variables](#environment-variables)
4. [First-Time Deployment](#first-time-deployment)
5. [Deploying Code Changes](#deploying-code-changes)
6. [Switching Git Branches](#switching-git-branches)
7. [Managing Services](#managing-services)
8. [Database Operations](#database-operations)
9. [Troubleshooting](#troubleshooting)
10. [SSL Certificate Renewal](#ssl-certificate-renewal)

---

## Server Requirements

- **OS**: Ubuntu 22.04 LTS or similar
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: 40GB+ SSD
- **Docker**: v24+
- **Docker Compose**: v2+
- **Git**: Installed

---

## Initial Server Setup

### 1. Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
# Example: ssh root@89.167.49.18
```

### 2. Install Docker and Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 3. Clone the Repository

```bash
cd /opt
git clone https://github.com/SimhaDadi/eRankUp.git erankup
cd erankup
```

---

## Environment Variables

### Backend Environment Variables

Create/edit the `.env` file on the server at `/opt/erankup/.env`:

```bash
nano /opt/erankup/.env
```

**Required Environment Variables:**

```env
# Database
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=erankup_db
DATABASE_URL=postgres://admin:your_secure_password_here@postgres:5432/erankup_db

# JWT Authentication
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# AI Services
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://erankup.in/api/auth/google/callback

# Environment
NODE_ENV=production
```

### Frontend Environment Variables

Frontend environment variables are set in `docker-compose.prod.yml`:

```yaml
frontend:
  environment:
    - NEXT_PUBLIC_API_URL=/api
    - NODE_ENV=production
```

**Important**: `NEXT_PUBLIC_*` variables are baked into the build at build time, so you must rebuild the frontend when changing them.

---

## First-Time Deployment

### Step 1: Set Up Environment

```bash
cd /opt/erankup

# Copy example env and edit
cp .env.example .env
nano .env
# Fill in all required values
```

### Step 2: Build and Start All Services

```bash
# Build all images and start containers
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 3: Verify All Services Are Running

```bash
docker ps

# Expected output:
# erankup-backend    Up X minutes
# erankup-frontend   Up X minutes
# erankup-nginx      Up X minutes
# erankup-postgres   Up X minutes (healthy)
# erankup-redis      Up X minutes (healthy)
```

### Step 4: Check Logs for Errors

```bash
# Check backend logs
docker logs erankup-backend

# Check frontend logs
docker logs erankup-frontend

# Check nginx logs
docker logs erankup-nginx
```

---

## Deploying Code Changes

### Quick Commands Reference

| What Changed | Command to Run |
|--------------|----------------|
| Backend code only | `docker-compose -f docker-compose.prod.yml up -d --build backend` |
| Frontend code only | `docker-compose -f docker-compose.prod.yml up -d --build frontend` |
| Both frontend & backend | `docker-compose -f docker-compose.prod.yml up -d --build backend frontend` |
| Nginx config only | `docker-compose -f docker-compose.prod.yml restart nginx` |
| Everything | `docker-compose -f docker-compose.prod.yml up -d --build` |

### Full Deployment Process (Recommended)

#### Step 1: Connect to Server

```bash
ssh root@89.167.49.18
```

#### Step 2: Navigate to Project Directory

```bash
cd /opt/erankup
```

#### Step 3: Pull Latest Changes

```bash
git pull origin Main-111

git pull origin Stable_Product
# Replace 'Main-111' with your branch name
```

#### Step 4: Rebuild and Restart Services

**Option A: Rebuild Everything (Safe, Recommended)**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**Option B: Rebuild Only Backend**
```bash
docker-compose -f docker-compose.prod.yml up -d --build backend
```

**Option C: Rebuild Only Frontend**
```bash
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

**Option D: Force Rebuild Without Cache** (Use when you have issues)
```bash
docker-compose -f docker-compose.prod.yml build --no-cache backend frontend
docker-compose -f docker-compose.prod.yml up -d
```

#### Step 5: Verify Deployment

```bash
# Check all containers are running
docker ps

# Check backend logs for errors
docker logs erankup-backend --tail 50

# Test endpoints
curl -I http://localhost
curl http://localhost/api/exams
```

---

## Switching Git Branches

### Step 1: Check Current Branch

```bash
cd /opt/erankup
git branch
```

### Step 2: Fetch All Remote Branches

```bash
git fetch origin
```

### Step 3: List All Available Branches

```bash
git branch -a
```

### Step 4: Switch to Desired Branch

```bash
# If the branch exists locally
git checkout branch-name

# If switching to a remote branch for the first time
git checkout -b branch-name origin/branch-name

# Example: Switch from Main-111 to main
git checkout main
```

### Step 5: Pull Latest Changes

```bash
git pull origin branch-name
```

### Step 6: Rebuild All Services

```bash
# Full rebuild recommended when switching branches
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 7: Verify

```bash
docker ps
docker logs erankup-backend --tail 30
```

---

## Managing Services

### Start All Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop All Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart a Specific Service
```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend
docker-compose -f docker-compose.prod.yml restart nginx
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service with follow
docker logs -f erankup-backend

# Last 100 lines
docker logs erankup-backend --tail 100
```

### Check Container Status
```bash
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Enter Container Shell
```bash
# Backend
docker exec -it erankup-backend sh

# Database
docker exec -it erankup-postgres psql -U admin -d erankup_db
```

---

## Database Operations

### Run Migrations Manually
```bash
docker exec erankup-backend npm run migration:run
```

### Access PostgreSQL
```bash
docker exec -it erankup-postgres psql -U admin -d erankup_db
```

### Common SQL Commands
```sql
-- List all tables
\dt

-- Check migrations
SELECT * FROM migrations;

-- Count users
SELECT COUNT(*) FROM "user";

-- Exit
\q
```

### Backup Database
```bash
# Create backup
docker exec erankup-postgres pg_dump -U admin erankup_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
cat backup_file.sql | docker exec -i erankup-postgres psql -U admin erankup_db
```

### Reset Database (DANGER - Deletes All Data)
```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Container Keeps Restarting

1. Check logs:
```bash
docker logs erankup-backend 2>&1 | tail -50
```

2. Common causes:
   - Missing environment variables
   - Database connection issues
   - Missing database tables (migration issues)

### 502 Bad Gateway

1. Check if backend is running:
```bash
docker ps | grep backend
```

2. Restart nginx:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

3. Check nginx can reach backend:
```bash
docker exec erankup-nginx curl http://backend:3001
```

### Database Migration Errors

1. Check which migrations have run:
```bash
docker exec erankup-postgres psql -U admin -d erankup_db -c "SELECT * FROM migrations;"
```

2. Run pending migrations:
```bash
docker exec erankup-backend npm run migration:run
```

### Clear Docker Cache (Last Resort)
```bash
# Stop all containers
docker-compose -f docker-compose.prod.yml down

# Remove unused images
docker image prune -a

# Rebuild everything
docker-compose -f docker-compose.prod.yml up -d --build
```

### View Real-Time Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker logs -f erankup-backend
```

---

## Quick Reference Commands

```bash
# SSH to server
ssh root@89.167.49.18

# Navigate to project
cd /opt/erankup

# Pull latest code
git pull origin Main-111

# Rebuild and start
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker ps

# View logs
docker logs erankup-backend --tail 50

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

---

## SSL Certificate Renewal

The SSL certificates for `erankup.in` and `www.erankup.in` are managed via Let's Encrypt Certbot running inside a Docker container.

### 1. Manual Renewal Process

If you ever need to manually force check and renew the certificates, connect to the server, navigate to `/opt/erankup`, and run:

```bash
# Force check and renew certificates (uses the saved webroot configuration)
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Reload Nginx to read the newly generated certificate files
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 2. Auto-Renewal Configuration

Certbot is configured to check for renewal every 12 hours in the background. To automate reloading Nginx after a successful renewal, set up a weekly cron job on the host server:

1. Open the cron editor:
   ```bash
   crontab -e
   ```
2. Add the following line at the bottom of the file (reloads Nginx every Sunday at 00:00 UTC):
   ```cron
   0 0 * * 0 docker exec erankup-nginx nginx -s reload > /dev/null 2>&1
   ```
3. Save and exit.

---

## Server Details

| Item | Value |
|------|-------|
| Server IP | 89.167.49.18 |
| SSH User | root |
| Project Path | /opt/erankup |
| Current Branch | Main-111 |
| Docker Compose File | docker-compose.prod.yml |

---

*Last Updated: July 2026*
