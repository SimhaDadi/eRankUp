# Production Dockerfile for eRankUp Frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (from root to leverage workspaces if needed, 
# but for simplicity we will copy what is needed)
COPY package.json ./
COPY frontend/package*.json ./frontend/
COPY packages/shared/package*.json ./packages/shared/

# Install from root to handle workspaces
RUN npm install

# Copy source
COPY frontend ./frontend
COPY packages/shared ./packages/shared

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start"]
