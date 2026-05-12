# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY web/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY web/ ./

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY web/package*.json ./
RUN npm ci --only production

# Copy build artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
