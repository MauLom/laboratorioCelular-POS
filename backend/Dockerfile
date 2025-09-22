# Multi-stage build for backend Node.js application
FROM node:18-alpine AS base

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Production dependencies stage
FROM base AS production-deps
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage (for building if needed)
FROM base AS build-deps
RUN npm ci

# Production stage
FROM base AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=production-deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]