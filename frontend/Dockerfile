# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace
COPY package*.json ./

# Copy shared package
COPY packages ./packages

# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install dependencies from root
RUN npm ci --legacy-peer-deps

# Copy frontend source code
COPY frontend ./frontend

# Build the shared package first
WORKDIR /app/packages/shared
RUN npm run build 2>/dev/null || echo "No build script in shared"

# Build the frontend with increased memory
WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy root package files
COPY package*.json ./

# Copy shared package (built)
COPY --from=builder /app/packages ./packages

# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install only production dependencies for the workspace
RUN npm ci --only=production --legacy-peer-deps --ignore-scripts

# Copy built frontend files
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/next.config.mjs ./frontend/

WORKDIR /app/frontend

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["dumb-init", "npm", "start"]
