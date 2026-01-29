# Docker Desktop MCP Integration Setup Guide

This guide walks through configuring and running Clarity Council as a Model Context Protocol (MCP) service in Docker Desktop.

## Quick Start

### 1. Build the Docker Image

```bash
docker build -t clarity-council:latest .
```

### Docker Desktop MCP Toolkit ("My Servers")

1. Build the image locally (or pull from your registry):

  ```bash
  docker build -t risadams/clarity-council:1.0.0 .
  ```

1. Start the container (ports, workspace, certs mounted):

   ```bash
   docker run -d \
     --name clarity-council \
     -p 8080:8080 \
     -p 8000:8000 \
     -v "$PWD/workspace:/.council" \
     -v "$PWD/certs:/app/certs" \
     -e LOG_LEVEL=info \
     risadams/clarity-council:1.0.0
   ```

1. Import the catalog entry so Docker Desktop can list it:

   ```bash
   # From repo root (Windows PowerShell):
   docker mcp catalog import .\servers\clarity-council\server.yaml
   # Linux/macOS:
   docker mcp catalog import ./servers/clarity-council/server.yaml
   ```

1. Enable the server in Docker MCP:

   ```bash
   docker mcp server enable clarity-council
   docker mcp server list   # should show clarity-council enabled
   ```

1. Open Docker Desktop → MCP Toolkit → My Servers. You should now see **Clarity Council**. If not visible, click refresh in the MCP Toolkit panel or restart Docker Desktop.

If the server still does not appear:

- Verify the catalog entry exists: `docker mcp catalog list`
- Verify the server is enabled: `docker mcp server list`
- Ensure the container is running and healthy: `docker ps` and `curl http://localhost:8080/health`

### 2. Run the Container

```bash
docker run -d \
  --name clarity-council \
  -p 8080:8080 \
  -p 8000:8000 \
  -e HTTP_ENABLED=true \
  -e HTTPS_ENABLED=true \
  -e HTTP_PORT=8080 \
  -e HTTPS_PORT=8000 \
  -e LOG_LEVEL=info \
  -e LOG_FORMAT=json \
  clarity-council:latest
```

### 3. Verify Health

```bash
curl http://localhost:8080/health
```

## Environment Variables

All configuration is done via environment variables. Set these when running the container:

### Network Configuration

| Variable | Default | Description | Example |
| -------- | ------- | ----------- | ------- |
| `HTTP_ENABLED` | `true` | Enable HTTP listener | `true` or `false` |
| `HTTP_PORT` | `8080` | HTTP port (1024-65535) | `8080`, `3000` |
| `HTTPS_ENABLED` | `true` | Enable HTTPS listener | `true` or `false` |
| `HTTPS_PORT` | `8000` | HTTPS port (1024-65535) | `8000`, `8443` |

**Note:** HTTP and HTTPS cannot use the same port. At least one must be enabled.

### Logging Configuration

| Variable | Default | Description | Example |
| -------- | ------- | ----------- | ------- |
| `LOG_LEVEL` | `info` | Log verbosity level | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | `json` | Log output format | `json`, `text` |

**Examples:**

- `LOG_LEVEL=debug` - Verbose logging (development)
- `LOG_FORMAT=text` - Human-readable logs (local testing)
- `LOG_FORMAT=json` - Structured logs (production, Docker Desktop)

### Workspace & Certificates

| Variable | Default | Description | Example |
| -------- | ------- | ----------- | ------- |
| `WORKSPACE_DIR` | `/.council` | Directory for persona overrides and config | `/app/workspace`, `/home/user/.council` |
| `CERT_DIR` | `/app/certs` | Directory containing `cert.pem` and `key.pem` | `/app/certs`, `/etc/ssl/certs` |

**Note:** CERT_DIR must exist and contain valid TLS certificates if HTTPS_ENABLED=true. The Dockerfile generates self-signed certificates by default.

### Authentication (Prepared for Future Use)

| Variable | Default | Description | Example |
| -------- | ------- | ----------- | ------- |
| `AUTH_ENABLED` | `false` | Enable authentication (currently not enforced) | `true` or `false` |
| `AUTH_TOKEN` | (empty) | Bearer token for authentication (future) | `sk-abc123xyz` |

**Status:** Authentication is prepared for future Docker integrations. Currently, tokens are read but not validated.

## Port Validation

Ports must meet these requirements:

- **Range:** 1024 - 65535 (cannot use privileged ports below 1024)
- **Uniqueness:** HTTP and HTTPS ports cannot be the same if both are enabled
- **Availability:** Port must not be in use by another service

### Example: Detecting Port Conflicts

```bash
# Check if port is in use
lsof -i :8080

# Try a different port
docker run -e HTTP_PORT=9080 -e HTTPS_PORT=9443 ...
```

## Volume Mounts

Mount directories for persistence:

```bash
docker run -d \
  --name clarity-council \
  -p 8080:8080 \
  -p 8000:8000 \
  -v /path/to/workspace:/.council \
  -v /path/to/certs:/app/certs \
  clarity-council:latest
```

| Mount Path | Host Path | Purpose |
| --------- | -------- | ------- |
| `/.council` | `$WORKSPACE_DIR` | Persona overrides (`personas.overrides.json`) |
| `/app/certs` | `$CERT_DIR` | TLS certificates (`cert.pem`, `key.pem`) |

## Docker Compose Example

```yaml
version: '3.8'
services:
  clarity-council:
    image: clarity-council:latest
    container_name: clarity-council
    ports:
      - "8080:8080"
      - "8000:8000"
    environment:
      HTTP_ENABLED: "true"
      HTTP_PORT: "8080"
      HTTPS_ENABLED: "true"
      HTTPS_PORT: "8000"
      LOG_LEVEL: "info"
      LOG_FORMAT: "json"
      WORKSPACE_DIR: "/.council"
      CERT_DIR: "/app/certs"
    volumes:
      - ./workspace:/.council
      - ./certs:/app/certs
    healthcheck:
      test: ["CMD", "node", "/app/healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

Run with:
```bash
docker-compose up -d
```

## Health Check Endpoint

The `/health` endpoint reports service status:

```bash
curl http://localhost:8080/health
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T16:30:14.434Z",
  "uptime_seconds": 125,
  "http": true,
  "https": true,
  "mcp": true,
  "schemas": true,
  "memory_mb": 52.3,
  "disk_mb": 15823
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-26T16:30:14.434Z",
  "error_message": "HTTPS endpoint unavailable",
  "memory_mb": 52.3,
  "disk_mb": 15823
}
```

Status codes:
- `200 OK` - Service is healthy
- `503 Service Unavailable` - Service is unhealthy

## MCP Metadata Endpoint

The `/mcp-metadata` endpoint returns service information for Docker Desktop discovery:

```bash
curl http://localhost:8080/mcp-metadata
```

**Response:**
```json
{
  "name": "Clarity Council",
  "version": "0.1.0",
  "endpoint": {
    "protocol": "https",
    "host": "localhost",
    "port": 8000
  },
  "tools": [
    {
      "name": "council_consult",
      "description": "Consult multiple personas and produce a synthesis..."
    },
    {
      "name": "persona_consult",
      "description": "Consult a single persona returning structured advice..."
    },
    {
      "name": "council_define_personas",
      "description": "Return current persona contracts and apply validated workspace-level overrides..."
    }
  ]
}
```

## Configuration Examples

### Development Setup (Local Testing)

```bash
docker run -d \
  --name clarity-council-dev \
  -p 8080:8080 \
  -p 8000:8000 \
  -e LOG_LEVEL=debug \
  -e LOG_FORMAT=text \
  clarity-council:latest
```

### Production Setup (Docker Desktop)

```bash
docker run -d \
  --name clarity-council-prod \
  -p 8080:8080 \
  -p 8000:8000 \
  -e LOG_LEVEL=info \
  -e LOG_FORMAT=json \
  -e WORKSPACE_DIR=/var/lib/clarity-council/workspace \
  -v clarity-council-workspace:/var/lib/clarity-council/workspace \
  clarity-council:latest
```

### Custom Ports

```bash
docker run -d \
  --name clarity-council-custom \
  -p 9080:9080 \
  -p 9443:9443 \
  -e HTTP_PORT=9080 \
  -e HTTPS_PORT=9443 \
  clarity-council:latest
```

## Troubleshooting

### Port Already in Use

**Error:** `Error: listen EADDRINUSE :::8080`

**Solution:** Check what's using the port:
```bash
lsof -i :8080
# Kill the process or use a different port
docker run -e HTTP_PORT=9080 ...
```

### Certificate Not Found

**Error:** `Error: ENOENT: no such file or directory, open '/app/certs/cert.pem'`

**Solution:** Ensure certificates exist:
```bash
# Copy your certificates
docker cp /path/to/cert.pem clarity-council:/app/certs/
docker cp /path/to/key.pem clarity-council:/app/certs/

# Or use docker-compose volume mounts
volumes:
  - ./certs:/app/certs
```

### Health Check Failing

**Issue:** `/health` returns 503

**Diagnosis:**
1. Check logs: `docker logs clarity-council`
2. Verify ports: `docker port clarity-council`
3. Test endpoints manually:
   ```bash
   curl -v http://localhost:8080/
   curl -v -k https://localhost:8000/
   ```

### Memory Usage High

Monitor memory:
```bash
docker stats clarity-council
```

If consistently > 100MB, check:
- `LOG_FORMAT=json` (vs `text`)
- `LOG_LEVEL=debug` (reduce to `info`)
- Volume mounts for workspace

## Service Registration & Discovery

When running, Clarity Council automatically:
1. **Registers** itself with Docker Desktop MCP on startup (POST to Docker MCP Gateway)
2. **Polls health** every 30 seconds
3. **Auto-recovers** if health checks fail 2+ times (fresh re-registration)
4. **Deregisters** on graceful shutdown (SIGTERM/SIGINT)

Monitor registration in logs:
```bash
docker logs clarity-council | grep "service.registration"
```

Expected log sequence:
```
{"event":"service.registration.success",...} Service registered with Docker Desktop MCP
{"event":"health_check.polling.start",...} Starting periodic health check polling
{"event":"shutdown.signal","signal":"SIGTERM",...} Shutdown signal received: SIGTERM
{"event":"service.deregistration.success",...} Service deregistered successfully
{"event":"shutdown.complete",...} Graceful shutdown completed
```

## Next Steps

- **Configuration Customization:** Adjust LOG_LEVEL and LOG_FORMAT for your environment
- **Volume Mounting:** Mount workspace and cert directories for persistence
- **Persona Customization:** Create `personas.overrides.json` in `WORKSPACE_DIR`
- **Docker Desktop Integration:** Register the service in Docker Desktop's MCP settings

For more details, see [docs/personas.md](personas.md) for persona customization and [docs/docker-troubleshooting.md](docker-troubleshooting.md) for diagnostics.
