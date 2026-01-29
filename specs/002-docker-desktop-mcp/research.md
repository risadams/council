# Research: Docker Desktop MCP Integration

**Phase**: 0 (Research & Clarification)  
**Status**: Complete  
**Date**: 2026-01-26  

## Overview

This research document consolidates findings from specification development (spec.md) and clarification workflow (5 architectural questions). All clarifications have been answered with rationale; no remaining unknowns block implementation.

---

## Q1: Docker MCP Toolkit API Availability

**Question**: Is there a published API for registering MCP services with Docker Desktop, or is the toolkit still in beta with fluid APIs?

**Decision**: **Option A** - Documented beta API with Catalog + Gateway.

**Rationale**:

- Docker Desktop MCP Toolkit is officially in Beta (announced 2024, ongoing development)
- Published API consists of:
  - **MCP Gateway** (`docker mcp gateway run`) - aggregates multiple MCP servers, provides unified JSON-RPC endpoint
  - **MCP Catalog** - service discovery UI showing registered MCP servers and their tools
  - **OAuth support** - for future auth integrations (client credentials flow)
  - **Resource isolation** - CPU (1), memory (2GB), configurable limits

- API is stable enough for production use with Docker's public documentation
- Changes to API are communicated in Docker release notes (stable versioning)

**Alternatives Considered**:

- Direct socket communication to Docker daemon (too low-level, not MCP standard)
- Kubernetes Operator pattern (overkill for single container, requires K8s)
- Custom Docker extension (requires VS Code integration, higher complexity)

**Implementation Impact**:

- Service registration via `docker-mcp-register` script calling MCP Gateway API
- Health checks report to Catalog via standard MCP health check schema
- No proprietary Docker APIs required—uses published MCP protocol and Docker secrets

---

## Q2: Container Registration Method

**Question**: Should the container register itself automatically with Docker Desktop on startup, or should registration be manual via Docker Desktop UI?

**Decision**: **Option C** - Both Catalog discovery (automatic) + manual registration (optional).

**Rationale**:
- **Automatic (Catalog Discovery)**: Container exposes health check endpoint; Docker Desktop MCP Toolkit discovers it automatically if running on same Docker daemon
- **Manual Registration**: Developers can explicitly register the Clarity Council endpoint in Docker Desktop settings for explicit control
- This hybrid approach maximizes flexibility:
  - Zero-config for users who want auto-discovery
  - Explicit control for users in complex network setups (port forwarding, custom hosts)

**Alternatives Considered**:
- Catalog discovery only (can't handle non-standard network configs)
- Manual registration only (requires documentation, less discoverable)
- Service discovery via mDNS (not supported by Docker Desktop MCP Toolkit)

**Implementation Impact**:
- Container exposes `/health` endpoint (existing); MCP Toolkit polls this
- Container exposes `/mcp-metadata` endpoint (new) with service name, version, available tools
- Docker Desktop UI allows entering endpoint URL for manual registration (no code changes needed for this)

---

## Q3: Stale Registration Recovery

**Question**: If the container crashes mid-request or becomes temporarily unavailable, how should stale service registrations be cleaned up?

**Decision**: **Option C** - Hybrid recovery strategy (startup + health check + explicit refresh).

**Rationale**:
- **On Startup**: Container self-registers with fresh metadata and health check timestamp
- **Health Checks**: Docker Desktop polls health endpoint every 30 seconds; if endpoint returns error for 2 consecutive checks, mark service as "unhealthy" in UI
- **Explicit Refresh**: Developers can manually trigger re-registration via Docker Desktop UI (button in service settings)
- **Max Staleness**: Stale registration exists for at most 60 seconds (2 health check cycles)

**Alternatives Considered**:
- Aggressive cleanup (every 5s) - wastes resources, chatty network
- Passive recovery (wait for cleanup daemon) - slow, unclear recovery time
- TTL-based expiration (too coupled to timing assumptions)

**Implementation Impact**:
- Health check endpoint response includes timestamp and uptime
- Startup script registers service and records registration timestamp
- Health check failure counter triggers "unhealthy" state in Catalog after 2 failures
- Manual refresh button in Docker Desktop UI calls re-registration endpoint

---

## Q4: Persona Configuration Overrides Persistence

**Question**: How should persona configuration overrides persist across container restarts, especially in Docker Desktop where volumes are managed by the platform?

**Decision**: **Option C** - Bidirectional hot-reload.

**Rationale**:
- **Startup (One-way load)**: Container reads `/.council/personas.overrides.json` from volume mount; applies overrides to persona definitions
- **Runtime (Hot-reload)**: Container watches for changes to `personas.overrides.json` file; when modified (by developer editing volume mount), reload affected personas without restarting server
- **Bidirectional**: Changes to persona overrides can originate from:
  - **Inside container**: via `council_define_personas` tool (updates file on volume)
  - **Outside container**: developer directly editing file on host (change detected, reloaded)
- **Fault tolerance**: If file parse fails, log error and keep previous config (no server crash)

**Alternatives Considered**:
- Persist only (one-way, no hot-reload) - requires server restart to pick up external changes
- Export only (tool writes changes back to host) - doesn't reload external changes
- Environment variables only (no filesystem persistence) - config lost on restart

**Implementation Impact**:
- Add `chokidar` or `fs.watch` module to detect `.council/personas.overrides.json` changes
- Implement `loadPersonaOverrides()` and `reloadPersonaOverrides()` functions
- Add structured logging for hot-reload events (timestamp, affected personas, success/failure)
- Docker volume mount for `/.council/` in docker-compose.yml (maps to host `./council-workspace/`)

---

## Q5: Authentication Strategy

**Question**: What authentication approach should be used for future integrations where Clarity Council might authenticate with external APIs?

**Decision**: **Option A** - Docker Secrets + Environment Variables, unauthenticated default.

**Rationale**:
- **Prepared Infrastructure**: Container reads environment variables (set via Docker Desktop secrets or docker-compose.yml)
- **Default Mode**: Unauthenticated (no auth required out-of-box)
- **Future Path**: When auth is needed:
  - Docker Secrets (`docker secret create`) for sensitive credentials
  - Environment variables (`AUTH_TOKEN`, `OAUTH_CLIENT_ID`) in container config
  - Code already prepared to check for these variables and enable auth on startup
- **Portable**: No Docker-specific auth APIs; standard environment variable pattern works on any platform

**Alternatives Considered**:
- OAuth 2.0 server (too heavyweight for beta feature, adds deployment complexity)
- Mutual TLS (requires certificate management, harder to debug)
- API key validation in headers (weak security, secrets in logs)

**Implementation Impact**:
- Add optional environment variables to Dockerfile: `AUTH_ENABLED` (default: false), `AUTH_TOKEN` (empty)
- Modify startup script to check `AUTH_ENABLED` flag; if true, validate requests against `AUTH_TOKEN`
- Update docs with auth setup instructions (for future use)
- No breaking changes to public API (auth is optional, off by default)

---

## Non-Research Items (Clarified During Specification)

The following architectural decisions were made during specification development and are captured in spec.md, not requiring separate research:

- **Edge Cases**: 4 documented in spec.md (port conflicts, stale registration, upgrade migration)
- **Functional Requirements**: 10 derived from user stories, refined with Docker MCP Toolkit architecture
- **Success Criteria**: 7 measurable outcomes with acceptance thresholds
- **Quality Checklist**: 9-item checklist passed (all requirements testable, SCs measurable)

---

## Dependencies & Constraints

### External Dependencies
- **Docker Desktop MCP Toolkit**: Beta (documented API, Docker-maintained)
- **Node.js 22 LTS**: Long-term stable, widely available
- **chokidar or fs.watch**: File change detection (3KB library, MIT license, well-maintained)

### Constraints from Docker Desktop Integration
- Service registration must complete in <10 seconds (startup deadline)
- Health checks must respond in <1 second (polling overhead)
- Container memory footprint must stay <100MB (Docker Desktop resource isolation default)
- Persona overrides file size must stay <10MB (file watcher overhead)

### Development Constraints
- Tests must run on Windows, macOS, Linux (cross-platform Vitest config already in place)
- Docker Desktop required for manual testing (assumption: developers have Docker Desktop installed)
- MCP Toolkit API may change before GA; implementation should pin Docker Desktop version (documented in docs/)

---

## Summary: Readiness for Phase 1 Design

✅ All 5 clarification questions answered with rationale and alternatives  
✅ No contradictory decisions across architectural choices  
✅ Dependencies documented and available  
✅ Constraints captured and measurable  
✅ Integration points with Docker Desktop defined (health check, service registration, secrets)  
✅ Fallback behavior documented (stale registration recovery, config hot-reload fault tolerance)

**Phase 1 can proceed** to generate data models, API contracts, and quickstart documentation.
