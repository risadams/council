# Build stage
FROM dhi.io/node AS builder

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and build scripts
COPY server/src ./src
COPY server/tsconfig.json ./
COPY server/scripts ./scripts

# Build the project
RUN npm run build

# Runtime stage
FROM dhi.io/node

WORKDIR /app

# Default runtime configuration (overridable via Docker Desktop env vars)
ENV HTTP_ENABLED=true \
  HTTP_PORT=8080 \
  HTTPS_ENABLED=true \
  HTTPS_PORT=8000 \
  LOG_LEVEL=info \
  LOG_FORMAT=json \
  WORKSPACE_DIR=/.council \
  AUTH_ENABLED=false \
  CERT_DIR=/app/certs \
  HEALTH_CHECK_INTERVAL_MS=30000

# Install openssl for HTTPS certificate generation
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and scripts needed for build
COPY server/package*.json ./
COPY server/scripts ./scripts

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy schemas
COPY --from=builder /app/dist/schemas ./dist/schemas

# Copy healthcheck script
COPY server/healthcheck.js ./healthcheck.js

# Create directory for HTTPS certificates
RUN mkdir -p /app/certs

# Generate self-signed HTTPS certificate (will be overridden if certs are mounted)
RUN openssl req -x509 -newkey rsa:2048 -keyout /app/certs/key.pem -out /app/certs/cert.pem \
    -days 365 -nodes -subj "/CN=localhost"

# Expose HTTPS and HTTP ports
EXPOSE 8000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ["node", "/app/healthcheck.js"]

# Start the MCP server with the prebuilt HTTPS bundle (no dev deps needed at runtime)
CMD ["node", "dist/https-server.js"]

