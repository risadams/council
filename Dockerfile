# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY server/src ./src
COPY server/tsconfig.json ./

# Build the project
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install openssl for HTTPS certificate generation
RUN apk add --no-cache openssl

# Copy package files
COPY server/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder\r\nCOPY --from=builder /app/dist ./dist\r\n\r\n# Copy healthcheck script\r\nCOPY server/healthcheck.js ./healthcheck.js

# Create directory for HTTPS certificates
RUN mkdir -p /app/certs

# Generate self-signed HTTPS certificate (will be overridden if certs are mounted)
RUN openssl req -x509 -newkey rsa:2048 -keyout /app/certs/key.pem -out /app/certs/cert.pem \
    -days 365 -nodes -subj "/CN=localhost"

# Expose HTTPS and HTTP ports
EXPOSE 8000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const https = require('https'); const options = {hostname: 'localhost', port: 8000, path: '/', method: 'GET', rejectUnauthorized: false}; https.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); }).end();" || exit 1

# Start the MCP server with the prebuilt HTTPS bundle (no dev deps needed at runtime)
CMD ["node", "dist/https-server.js"]

