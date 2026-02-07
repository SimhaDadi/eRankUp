# Production Dockerfile for eRankUp Backend
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json ./
COPY backend/package*.json ./backend/
COPY packages/shared/package*.json ./packages/shared/

RUN npm install

# Copy source and build
COPY backend ./backend
COPY packages/shared ./packages/shared

WORKDIR /app/backend
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules

# Expose backend port
EXPOSE 3001

CMD ["npm", "run", "start:prod"]
