#!/bin/bash
# ================================================
# eRankUp Production Deployment Script
# Server: Hetzner CX43 (89.167.49.18)
# Domain: erankup.in
# ================================================

set -e  # Exit on any error

echo "🚀 Starting eRankUp Production Deployment..."
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="erankup.in"
EMAIL="admin@erankup.in"  # Change to your email for SSL notifications
REPO_URL="https://github.com/SimhaDadi/eRankUp.git"
APP_DIR="/opt/erankup"

echo -e "${YELLOW}Step 1: System Update${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Install Docker${NC}"
if ! command -v docker &> /dev/null; then
    apt install -y docker.io docker-compose git curl wget
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

echo -e "${YELLOW}Step 3: Clone Repository${NC}"
if [ -d "$APP_DIR" ]; then
    echo "Removing existing installation..."
    rm -rf $APP_DIR
fi
git clone $REPO_URL $APP_DIR
cd $APP_DIR

echo -e "${YELLOW}Step 4: Create SSL Directory${NC}"
mkdir -p nginx/ssl

echo -e "${YELLOW}Step 5: Create Initial Nginx Config (HTTP only for SSL setup)${NC}"
cat > nginx/nginx-initial.conf << 'NGINX_INITIAL'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name erankup.in www.erankup.in;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 "eRankUp is being configured...";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_INITIAL

echo -e "${YELLOW}Step 6: Start Nginx for SSL Challenge${NC}"
docker run -d --name nginx-temp \
    -p 80:80 \
    -v $(pwd)/nginx/nginx-initial.conf:/etc/nginx/nginx.conf:ro \
    -v $(pwd)/certbot-webroot:/var/www/certbot \
    nginx:alpine

sleep 5

echo -e "${YELLOW}Step 7: Obtain SSL Certificate${NC}"
mkdir -p certbot-webroot
docker run --rm \
    -v $(pwd)/nginx/ssl:/etc/letsencrypt \
    -v $(pwd)/certbot-webroot:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Stop temporary nginx
docker stop nginx-temp && docker rm nginx-temp

echo -e "${YELLOW}Step 8: Build and Start All Services${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

echo -e "${YELLOW}Step 9: Wait for Services to be Healthy${NC}"
echo "Waiting for database..."
sleep 30

echo -e "${YELLOW}Step 10: Run Database Migrations${NC}"
docker exec erankup-backend npm run migration:run || echo "Migrations may already be applied"

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo "Your application is now available at:"
echo "  🌐 https://erankup.in"
echo "  🌐 https://www.erankup.in"
echo ""
echo "Useful commands:"
echo "  View logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart:       docker-compose -f docker-compose.prod.yml restart"
echo "  Stop:          docker-compose -f docker-compose.prod.yml down"
echo "  Rebuild:       docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
