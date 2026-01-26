# Data Model: Docker Desktop MCP Integration

**Phase**: 1 (Design & Contracts)  
**Status**: Complete  
**Date**: 2026-01-26  

## Overview

This document defines the key data structures and relationships for Docker Desktop MCP integration. Entities are derived from functional requirements and clarification decisions.

---

## Core Entities

### 1. MCP Service Registration

**Purpose**: Metadata describing the Clarity Council service as presented to Docker Desktop and MCP clients.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceId` | string | Yes | Unique identifier (format: `clarity-council-docker-{VERSION}`) |
| `name` | string | Yes | Display name in Docker Desktop (e.g., "Clarity Council") |
| `version` | string | Yes | Semantic version (e.g., "1.0.0") |
| `description` | string | Yes | One-line description for Docker Desktop UI |
| `endpoint` | object | Yes | HTTP/HTTPS connection details (see below) |
| `tools` | array | Yes | List of available MCP tools with signatures |
| `healthCheckUrl` | string | Yes | GET endpoint for service health status |
| `registrationTimestamp` | ISO8601 | Yes | When service was registered (UTC) |
| `lastHealthCheckTime` | ISO8601 | No | Last successful health check (UTC) |
| `status` | enum | Yes | Values: `healthy`, `unhealthy`, `stopped`, `registering` |

**endpoint** sub-object:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `protocol` | string | Yes | "http" or "https" |
| `host` | string | Yes | "localhost" or container IP |
| `port` | number | Yes | HTTP (8080) or HTTPS (8000) port |
| `basePath` | string | No | Default: "/" (MCP root path) |

**tools** array (one per MCP tool):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | e.g., "council_consult", "persona_consult" |
| `description` | string | Yes | What the tool does |
| `inputSchema` | object | Yes | JSON Schema for tool input |
| `outputSchema` | object | Yes | JSON Schema for tool output |

**Example**:

```json
{
  "serviceId": "clarity-council-docker-1.0.0",
  "name": "Clarity Council",
  "version": "1.0.0",
  "description": "Multi-persona AI consultation tool for decision-making",
  "endpoint": {
    "protocol": "http",
    "host": "localhost",
    "port": 8080,
    "basePath": "/"
  },
  "tools": [
    {
      "name": "council_consult",
      "description": "Get advice from multiple personas on a problem",
      "inputSchema": { "$ref": "council.consult.input.schema.json" },
      "outputSchema": { "$ref": "council.consult.output.schema.json" }
    },
    {
      "name": "persona_consult",
      "description": "Get advice from a single persona",
      "inputSchema": { "$ref": "persona.consult.input.schema.json" },
      "outputSchema": { "$ref": "persona.consult.output.schema.json" }
    },
    {
      "name": "council_define_personas",
      "description": "Define or override persona configurations",
      "inputSchema": { "$ref": "council.define_personas.input.schema.json" },
      "outputSchema": { "$ref": "council.define_personas.output.schema.json" }
    }
  ],
  "healthCheckUrl": "http://localhost:8080/health",
  "registrationTimestamp": "2026-01-26T10:30:00Z",
  "lastHealthCheckTime": "2026-01-26T10:35:00Z",
  "status": "healthy"
}
```

---

### 2. Health Check Result

**Purpose**: Periodic verification of service availability and MCP protocol compliance.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | Yes | "healthy", "unhealthy" |
| `timestamp` | ISO8601 | Yes | Check time (UTC) |
| `uptime_seconds` | number | Yes | Seconds since container start |
| `http_endpoint_ok` | boolean | Yes | HTTP server responding |
| `https_endpoint_ok` | boolean | Yes | HTTPS server responding (if enabled) |
| `mcp_protocol_ok` | boolean | Yes | MCP JSON-RPC working (test tool call) |
| `schema_validation_ok` | boolean | Yes | Tool schemas loaded and valid |
| `disk_space_free_mb` | number | Yes | Available disk space |
| `memory_usage_mb` | number | Yes | Current process memory (MB) |
| `error_message` | string | No | Reason if status != "healthy" |

**Example**:

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
  "memory_usage_mb": 42,
  "error_message": null
}
```

---

### 3. Persona Configuration Overrides

**Purpose**: Per-persona customization stored in version-controlled workspace file.

**File**: `/.council/personas.overrides.json`

**Structure**:

```json
{
  "version": "1.0",
  "lastModified": "2026-01-26T10:30:00Z",
  "overrides": {
    "growth_strategist": {
      "enabled": true,
      "customSoul": "Focus on market expansion",
      "customFocus": ["M&A", "Geographic expansion"],
      "customConstraints": ["Must maintain 15% EBITDA margin"]
    },
    "devil_advocate": {
      "enabled": true,
      "customFocus": ["Cost risks", "Execution complexity"]
    },
    "custom_persona": {
      "enabled": true,
      "soul": "External advisor perspective",
      "focus": ["Customer feedback", "Market trends"],
      "constraints": ["No access to internal systems"]
    }
  }
}
```

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | File version (for migrations); always "1.0" |
| `lastModified` | ISO8601 | Yes | Timestamp of last change (UTC) |
| `overrides` | object | Yes | Map of persona ID → override config |

**Override Configuration** (per persona):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | boolean | Yes | Include this persona in council consultations |
| `customSoul` | string | No | Override persona's core purpose |
| `customFocus` | array | No | Override focus areas (list of strings) |
| `customConstraints` | array | No | Override decision constraints (list of strings) |

**Validation Rules**:

- File MUST be valid JSON (malformed file is logged, previous config kept)
- `lastModified` MUST be RFC3339-formatted ISO8601 timestamp
- Custom soul MUST be ≤500 characters
- Custom focus items MUST be ≤100 characters each
- Custom constraints MUST be ≤200 characters each
- Unknown persona IDs are logged as warnings but don't block file loading

---

### 4. Startup Configuration

**Purpose**: Environment variables and volume mounts defining container behavior.

**Environment Variables**:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `HTTP_ENABLED` | boolean | `true` | Enable HTTP endpoint (port 8080) |
| `HTTP_PORT` | number | `8080` | HTTP server port |
| `HTTPS_ENABLED` | boolean | `true` | Enable HTTPS endpoint (port 8000) |
| `HTTPS_PORT` | number | `8000` | HTTPS server port |
| `CERT_DIR` | string | `/certs` | Directory containing TLS certificates |
| `LOG_LEVEL` | string | `info` | Logging level: `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | string | `json` | Log output format: `json` or `text` |
| `AUTH_ENABLED` | boolean | `false` | Enable authentication (future use) |
| `AUTH_TOKEN` | string | `` (empty) | Bearer token for authentication (if enabled) |
| `WORKSPACE_DIR` | string | `/.council` | Workspace directory (contains persona overrides) |
| `HEALTH_CHECK_INTERVAL_MS` | number | `30000` | Docker health check interval (milliseconds) |

**Volume Mounts**:

| Container Path | Host Path | Read/Write | Purpose |
|---|---|---|---|
| `/.council` | `./council-workspace` | RW | Persona overrides, workspace config |
| `/certs` | `./certs` | RO | TLS certificates (cert.pem, key.pem) |

---

### 5. Service State Transitions

**Purpose**: Valid state changes for service registration status during container lifecycle.

**State Diagram**:

```
┌─────────────┐
│ registering │ (on startup)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  healthy    │ (health checks pass)
└────┬────────┘
     │
     ├──────────────────────────────────┐
     │                                  │
     ▼                                  ▼
┌──────────┐                   ┌──────────────┐
│ stopped  │  (SIGTERM received) unhealthy │ (2 failed health checks)
└──────────┘                   └──────────────┘
     │                                  │
     └──────────────┬───────────────────┘
                    │
                    ▼
          (auto-recover to healthy
           after issue resolved)
```

**Transitions**:

| From | To | Trigger | Action |
|------|----|---------| -------|
| `registering` | `healthy` | Health check passes + schemas valid | Log registration complete |
| `healthy` | `unhealthy` | 2 consecutive failed health checks | Alert Docker Desktop, log error |
| `unhealthy` | `healthy` | Health check passes again | Clear error, log recovery |
| `healthy` / `unhealthy` | `stopped` | SIGTERM signal received | Graceful shutdown, deregister |
| `stopped` | (none) | N/A | Service no longer available |

---

## Relationships

### Service Registration ↔ Health Check Result

- **Direction**: 1:N (one service, many health checks over time)
- **Frequency**: Health check runs every 30 seconds (configurable)
- **Coupling**: Service status in registration is derived from most recent health check result

### Startup Configuration ↔ Service Registration

- **Direction**: 1:1 (configuration values populate service metadata)
- **Example**: `HTTP_PORT` env var → `endpoint.port` in registration
- **Validation**: Invalid config prevents registration (exit code 1)

### Persona Configuration Overrides ↔ Council Tool Output

- **Direction**: N:1 (many persona overrides, one tool invocation)
- **Example**: Disabled persona skipped from council consultation output
- **Hot-reload**: Override file changes trigger persona reload without tool restart

---

## Validation & Constraints

### MCP Service Registration

- `serviceId` MUST be unique per Docker Desktop installation
- `version` MUST follow semantic versioning (X.Y.Z)
- `endpoint.port` MUST be in range 1024–65535 (unprivileged ports)
- `tools` array MUST NOT be empty (at least 1 tool)
- All schema references MUST resolve to existing schema files

### Health Check Result

- `uptime_seconds` MUST be ≥ 0
- `memory_usage_mb` MUST be ≥ 0
- If `status` = `unhealthy`, `error_message` MUST be non-empty

### Persona Configuration Overrides

- File MUST exist and be readable by container process
- File size MUST be ≤ 10MB (to prevent file watcher overhead)
- Custom strings MUST be UTF-8 encoded, no control characters
- Unknown persona IDs in overrides are logged as warnings, not errors

### Startup Configuration

- Ports MUST NOT conflict (HTTP and HTTPS ports must differ)
- Certificates MUST exist in `CERT_DIR` if `HTTPS_ENABLED` = true
- `WORKSPACE_DIR` MUST be a writable directory (for persona overrides file)

---

## Summary

Five core entities capture the Docker Desktop integration requirements:

1. **MCP Service Registration**: Service metadata for discovery and invocation
2. **Health Check Result**: Periodic status verification with resource metrics
3. **Persona Configuration Overrides**: Workspace-managed customizations (bidirectional)
4. **Startup Configuration**: Environment-driven initialization
5. **Service State Transitions**: Valid lifecycle states with recovery logic

All entities are designed for:
- **Idempotent operations** (registration/deregistration can be called multiple times safely)
- **Observability** (all state changes are logged)
- **Fault tolerance** (malformed configs don't crash, invalid state transitions are rejected)
- **Docker Desktop integration** (native support for secrets, volumes, environment variables)
