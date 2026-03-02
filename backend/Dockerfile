# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace
COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy backend package files
COPY backend/package*.json ./backend/

# Install dependencies from root
RUN npm ci --legacy-peer-deps

# Copy backend source code
COPY backend ./backend

# Build the shared package first
WORKDIR /app/packages/shared
RUN npm run build 2>/dev/null || echo "No build script in shared"

# Build the backend
WORKDIR /app/backend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy root package files
COPY package*.json ./

# Copy shared package (built)
COPY --from=builder /app/packages ./packages

# Copy backend package files
COPY backend/package*.json ./backend/

# Install only production dependencies
WORKDIR /app
RUN npm ci --only=production --legacy-peer-deps --ignore-scripts

# Copy built backend application
COPY --from=builder /app/backend/dist ./backend/dist

# Create uploads directory
RUN mkdir -p backend/uploads && chown -R nestjs:nodejs backend/uploads

WORKDIR /app/backend

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

ENV NODE_ENV=production

# Use dumb-init to handle signals properly
CMD ["dumb-init", "node", "dist/backend/src/main"]
