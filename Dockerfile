# ==========================================
# KubeOps Production Multi-Stage Dockerfile
# ==========================================

# Stage 1: Build frontend assets & bundle server
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (utilizing Docker layer caching)
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build Vite client and bundle server via esbuild into dist/server.cjs
RUN npm run build

# Stage 2: Production runtime image (lightweight Alpine, non-root)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled distribution bundle from builder stage
COPY --from=builder /app/dist ./dist

# Create dedicated non-root user and group (CIS Kubernetes Benchmark compliance)
RUN addgroup -g 1001 -S kubeops && \
    adduser -S kubeops -u 1001 -G kubeops && \
    chown -R kubeops:kubeops /app

USER kubeops

# Port 3000 is the standard ingress port
EXPOSE 3000

# Container healthcheck using backend /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Start the compiled Node.js backend server
CMD ["node", "dist/server.cjs"]
