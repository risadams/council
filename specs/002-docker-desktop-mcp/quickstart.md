# Quickstart: Docker Desktop MCP Integration

**Phase**: 1 (Design)  
**Date**: 2026-01-26  
**Audience**: Developers integrating Clarity Council with Docker Desktop

---

## What You're Building

A Docker Desktop MCP (Model Context Protocol) extension that registers the Clarity Council containerized service with Docker Desktop's built-in MCP Toolkit. This enables:

✅ Zero-config discovery of Clarity Council in GitHub Copilot and VS Code  
✅ Container lifecycle sync (start/stop/restart → service status)  
✅ Environment variable & secrets management via Docker Desktop UI  
✅ Health monitoring and diagnostics in Docker Desktop logs  
✅ Hot-reload of persona customizations from workspace files  

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│     Docker Desktop (host)           │
│  ┌─────────────────────────────────┐│
│  │ MCP Toolkit (Beta)              ││
│  │ ┌──────────────┐                ││
│  │ │ MCP Gateway  │ (JSON-RPC)     ││
│  │ │ MCP Catalog  │ (Service UI)   ││
│  │ └──────────────┘                ││
│  │         ▲                        ││
│  │         │ register on startup    ││
│  │         │ report health checks   ││
│  └─────────┼────────────────────────┘│
│            │                         │
│  ┌─────────▼────────────────────────┐│
│  │ Clarity Council Container         ││
│  │ ┌──────────────────────────────┐ ││
│  │ │ Node.js/TypeScript MCP Server││ ││
│  │ │ - council_consult            ││ ││
│  │ │ - persona_consult            ││ ││
│  │ │ - council_define_personas    ││ ││
│  │ └──────────────────────────────┘ ││
│  │ ┌──────────────────────────────┐ ││
│  │ │ New Components (Phase 1):    ││ ││
│  │ │ - Docker registration        ││ ││
│  │ │ - File watcher (hot-reload)  ││ ││
│  │ │ - Structured JSON logging    ││ ││
│  │ │ - Enhanced health checks     ││ ││
│  │ └──────────────────────────────┘ ││
│  └──────────────────────────────────┘│
│            │                         │
│  ┌─────────▼──────────────────────┐  │
│  │ Docker Volumes                 │  │
│  │ ├── /.council/                 │  │
│  │ │   └── personas.overrides.json │  │
│  │ └── /certs/                    │  │
│  │     ├── cert.pem               │  │
│  │     └── key.pem                │  │
│  └────────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ MCP Client (GitHub Copilot, VS Code)│
│         ▲                           │
│         │ call tools                │
│         │ (council_consult, etc)    │
│         │                           │
└─────────┼───────────────────────────┘
          │
          ▼ (routes through MCP Gateway)
[Clarity Council Container]
```

---

## Implementation Phases

### Phase 1 (Design) - CURRENT

**Deliverables** (this quickstart):
- ✅ research.md - Clarification answers + architectural decisions
- ✅ data-model.md - Entity definitions (Service Registration, Health Check, Persona Overrides, Startup Config)
- ✅ contracts/ - JSON Schemas (mcp-registration, health-check, persona-overrides)
- ✅ quickstart.md - This file

**Key Design Decisions**:
- **Bidirectional persona config** (hot-reload via file watcher)
- **Hybrid registration** (Catalog auto-discovery + manual option)
- **Unauthenticated default** (auth prepared for future via env vars)
- **Structured JSON logging** (Docker Desktop logs viewer integration)

---

### Phase 2 (Implementation Tasks)

**Server-side implementation** (estimated 5-7 days):

**Week 1: Core Registration & Health Checks**
- [ ] Add `dockerRegistration.ts` utility (service registration logic)
- [ ] Add `healthCheck.ts` utility (comprehensive health checks)
- [ ] Modify startup script to register on container start
- [ ] Add `/mcp-metadata` endpoint
- [ ] Add/enhance `/health` endpoint

**Week 1-2: Logging & Config**
- [ ] Add `logger.ts` utility (structured JSON logging with correlation IDs)
- [ ] Update all tool invocations to emit structured logs
- [ ] Support `LOG_LEVEL` and `LOG_FORMAT` environment variables

**Week 2: File Watcher & Hot-Reload**
- [ ] Add `fileWatcher.ts` utility (watch `/.council/personas.overrides.json`)
- [ ] Implement persona override loading + reloading
- [ ] Add error handling (malformed JSON → fallback to previous config)
- [ ] Add `WORKSPACE_DIR` environment variable support

**Week 2-3: Testing & Documentation**
- [ ] Unit tests (logger, file watcher, registration logic)
- [ ] Integration tests (container startup → registration → health checks)
- [ ] Golden tests (persona tone consistency after override reload)
- [ ] docs/setup-docker-desktop.md (setup guide for developers)

**Client-side integration** (estimated 2-3 days):

- Docker Desktop Extension packaging (if required by Docker)
- MCP Toolkit Catalog entry submission
- GitHub Copilot integration verification

---

## Key Implementation Tasks

### 1. Service Registration (FR-001, FR-002)

**File**: `server/src/utils/dockerRegistration.ts`

**Pseudo-code**:

```typescript
class DockerRegistration {
  async registerService(config: MckServiceConfig): Promise<void> {
    // 1. Build registration payload from environment vars + tool schemas
    const payload = {
      serviceId: "clarity-council-docker-1.0.0",
      name: "Clarity Council",
      version: "1.0.0",
      endpoint: {
        protocol: process.env.HTTPS_ENABLED ? "https" : "http",
        host: "localhost",
        port: parseInt(process.env.HTTP_PORT || "8080"),
      },
      tools: [
        { name: "council_consult", ... },
        { name: "persona_consult", ... },
        { name: "council_define_personas", ... }
      ],
      healthCheckUrl: `http://localhost:${port}/health`,
      registrationTimestamp: new Date().toISOString(),
    };

    // 2. Call Docker MCP Gateway API (via docker command or HTTP)
    const result = await dockerGateway.register(payload);
    
    // 3. Log success/failure
    logger.info("Service registered", { serviceId: payload.serviceId, status: result.status });
  }

  async deregisterService(serviceId: string): Promise<void> {
    const result = await dockerGateway.deregister(serviceId);
    logger.info("Service deregistered", { serviceId });
  }
}
```

**Startup integration** (`server/src/index.ts`):

```typescript
const registration = new DockerRegistration();
// After server starts listening:
await registration.registerService(config);

// On SIGTERM:
process.on("SIGTERM", async () => {
  await registration.deregisterService(config.serviceId);
  process.exit(0);
});
```

---

### 2. Health Checks (FR-006)

**File**: `server/src/utils/healthCheck.ts`

**Endpoint**: `GET /health`

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T10:35:00Z",
  "uptime_seconds": 300,
  "http_endpoint_ok": true,
  "https_endpoint_ok": true,
  "mcp_protocol_ok": true,
  "schema_validation_ok": true,
  "disk_space_free_mb": 5000,
  "memory_usage_mb": 42
}
```

**Implementation**:

```typescript
async function healthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const result = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - containerStartTime) / 1000),
    http_endpoint_ok: await testHttpEndpoint(),
    https_endpoint_ok: await testHttpsEndpoint(),
    mcp_protocol_ok: await testMcpProtocol(),
    schema_validation_ok: await validateSchemas(),
    disk_space_free_mb: await getDiskSpace(),
    memory_usage_mb: process.memoryUsage().heapUsed / 1024 / 1024,
  };

  if (!result.http_endpoint_ok || !result.mcp_protocol_ok) {
    result.status = "unhealthy";
    result.error_message = "Primary endpoints unavailable";
  }

  logger.debug("Health check completed", { result, duration_ms: Date.now() - startTime });
  return result;
}
```

---

### 3. Persona Overrides & Hot-Reload (FR-010, Q4)

**File**: `server/src/utils/fileWatcher.ts` + `server/src/utils/workspaceConfig.ts`

**Startup** (`loadPersonaOverrides`):

```typescript
function loadPersonaOverrides(workspaceDir: string): PersonaOverrides {
  const overridesPath = path.join(workspaceDir, "personas.overrides.json");
  if (!fs.existsSync(overridesPath)) {
    logger.info("No persona overrides found", { path: overridesPath });
    return { version: "1.0", lastModified: new Date().toISOString(), overrides: {} };
  }

  try {
    const content = fs.readFileSync(overridesPath, "utf-8");
    const overrides = JSON.parse(content);
    logger.info("Persona overrides loaded", { path: overridesPath, count: Object.keys(overrides.overrides).length });
    return overrides;
  } catch (error) {
    logger.error("Failed to parse persona overrides", { path: overridesPath, error: error.message });
    return { version: "1.0", lastModified: new Date().toISOString(), overrides: {} };
  }
}
```

**Hot-reload** (`startFileWatcher`):

```typescript
function startFileWatcher(workspaceDir: string) {
  const overridesPath = path.join(workspaceDir, "personas.overrides.json");
  
  fs.watch(overridesPath, (eventType, filename) => {
    if (eventType === "change") {
      logger.debug("Persona overrides file changed", { path: overridesPath });
      try {
        const newOverrides = loadPersonaOverrides(workspaceDir);
        applyPersonaOverrides(newOverrides);
        logger.info("Persona overrides reloaded", { count: Object.keys(newOverrides.overrides).length });
      } catch (error) {
        logger.error("Failed to reload persona overrides", { error: error.message });
        // Keep previous config; don't crash
      }
    }
  });
}
```

---

### 4. Structured JSON Logging (FR-005)

**File**: `server/src/utils/logger.ts`

**Log Entry Format**:

```json
{
  "timestamp": "2026-01-26T10:35:00.123Z",
  "level": "info",
  "requestId": "req-abc123",
  "correlationId": "corr-xyz789",
  "message": "Tool call succeeded",
  "tool": "council_consult",
  "duration_ms": 1250,
  "success": true,
  "userId": null,
  "error": null,
  "metadata": {
    "input_chars": 156,
    "output_chars": 8234,
    "personaCount": 6
  }
}
```

**Implementation**:

```typescript
class StructuredLogger {
  private requestId = generateId();

  info(message: string, meta?: Record<string, any>) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      requestId: this.requestId,
      message,
      ...meta,
    }));
  }

  error(message: string, error: Error, meta?: Record<string, any>) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      requestId: this.requestId,
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...meta,
    }));
  }
}
```

---

### 5. Environment Variable Support (FR-004, Q5)

**Update `Dockerfile`**:

```dockerfile
ENV HTTP_ENABLED=true
ENV HTTP_PORT=8080
ENV HTTPS_ENABLED=true
ENV HTTPS_PORT=8000
ENV CERT_DIR=/certs
ENV LOG_LEVEL=info
ENV LOG_FORMAT=json
ENV AUTH_ENABLED=false
ENV AUTH_TOKEN=""
ENV WORKSPACE_DIR=/.council
ENV HEALTH_CHECK_INTERVAL_MS=30000
```

**Update `docker-compose.yml`**:

```yaml
services:
  clarity-council:
    image: risadams/clarity-council:1.0.0
    ports:
      - "8080:8080"
      - "8000:8000"
    environment:
      LOG_LEVEL: info
      WORKSPACE_DIR: /.council
    volumes:
      - ./council-workspace:/.council
      - ./certs:/certs:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Testing Strategy

### Unit Tests

**File**: `tests/unit/`

- `dockerRegistration.spec.ts`: Service registration logic, error handling
- `healthCheck.spec.ts`: Health check computation, endpoint testing
- `fileWatcher.spec.ts`: File change detection, override parsing, fault tolerance
- `logger.spec.ts`: Structured log formatting, correlation IDs

### Integration Tests

**File**: `tests/integration/`

- `mcp-docker-lifecycle.spec.ts`: Container start → register → health check → stop → deregister
- `persona-hotreload.spec.ts`: Persona override file change → reload → tool response updates

### Golden Tests

**File**: `tests/golden/`

- Verify persona tone consistency after override reload (existing pattern)

---

## Success Criteria (from spec.md)

✅ **SC-001**: MCP clients discover Clarity Council via Docker Desktop without manual config  
✅ **SC-002**: Startup to MPC availability in <10 seconds  
✅ **SC-003**: Service status updates within 5 seconds of container state change  
✅ **SC-004**: 95% first-attempt success rate for developers  
✅ **SC-005**: Health check failures trigger Docker Desktop alerts in <30 seconds  
✅ **SC-006**: Zero port conflicts with default Docker Desktop settings  
✅ **SC-007**: Developers can diagnose issues via Docker Desktop logs (no terminal)  

---

## Resources & References

- [Docker Desktop MCP Toolkit Docs](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [data-model.md](data-model.md) - Entity definitions
- [research.md](research.md) - Architectural decisions
- [spec.md](spec.md) - Feature specification
- [plans.md](plan.md) - Implementation timeline (generated post-planning)

---

## Next Steps

1. **Code Review**: Review this quickstart + data-model.md with team
2. **Dependency Selection**: Finalize file watcher library (chokidar vs fs.watch) and logging framework
3. **Phase 2 Start**: Begin implementation with registration + health checks
4. **Integration Testing**: Set up Docker Desktop for manual testing as features complete
5. **Documentation**: Create `docs/setup-docker-desktop.md` for end users
