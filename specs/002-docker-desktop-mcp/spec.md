# Feature Specification: Docker Desktop MCP Integration

**Feature Branch**: `002-docker-desktop-mcp`  
**Created**: 2026-01-26  
**Status**: Draft  
**Input**: User description: "integrate with docker desktop mcp toolkit feature"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer configures Clarity Council in Docker Desktop (Priority: P1)

A developer opens Docker Desktop, navigates to the Extensions marketplace, finds the MCP (Model Context Protocol) toolkit, and configures the Clarity Council MCP server so it's available to GitHub Copilot and other MCP clients through Docker Desktop's built-in discovery service.

**Why this priority**: Core integration - enables MCP clients to automatically discover and connect to the containerized Clarity Council server without manual URL configuration. This is the foundation for all other scenarios.

**Independent Test**: Install Docker Desktop extension, configure Clarity Council endpoint, verify it appears in Docker Desktop's MCP services list and is reachable by Copilot.

**Acceptance Scenarios**:

1. **Given** Docker Desktop is running with the MCP toolkit extension installed, **When** the user configures the Clarity Council container endpoint in Docker Desktop settings, **Then** the service appears in the MCP services list with status "healthy"
2. **Given** Clarity Council is registered in Docker Desktop MCP services, **When** a GitHub Copilot client queries available MCP servers, **Then** Clarity Council tools (council_consult, persona_consult, council_define_personas) are discoverable and callable
3. **Given** the Clarity Council container is not running, **When** Docker Desktop polls the MCP service, **Then** the service status shows "unavailable" with clear error messaging

---

### User Story 2 - Container lifecycle management through Docker Desktop (Priority: P2)

A developer starts, stops, and restarts the Clarity Council container directly from Docker Desktop UI, and the MCP service registration automatically updates to reflect the container state.

**Why this priority**: Improves developer experience by syncing container lifecycle with MCP service availability, preventing stale connections and timeout errors.

**Independent Test**: Stop the Clarity Council container via Docker Desktop, verify MCP clients receive service unavailable status; restart container, verify automatic re-registration.

**Acceptance Scenarios**:

1. **Given** Clarity Council container is running and registered, **When** the developer stops the container via Docker Desktop, **Then** MCP service status updates to "stopped" within 5 seconds
2. **Given** Clarity Council container is stopped, **When** the developer starts the container, **Then** MCP service auto-registers and becomes available within 10 seconds
3. **Given** container is restarting, **When** MCP clients attempt to connect, **Then** they receive a "temporarily unavailable" response with retry-after hint

---

### User Story 3 - Environment variable and secrets management (Priority: P2)

A developer configures environment variables (log level, ports) and secrets (API keys for future integrations) for the Clarity Council container through Docker Desktop's UI, and the MCP server respects these configurations.

**Why this priority**: Essential for production-like usage - developers need to configure logging, network settings, and prepare for future auth/API integrations without editing docker-compose.yml manually.

**Independent Test**: Set LOG_LEVEL=debug via Docker Desktop UI, restart container, verify debug logs appear; change HTTP_PORT, verify MCP endpoint updates.

**Acceptance Scenarios**:

1. **Given** Docker Desktop environment editor is open, **When** the developer sets LOG_LEVEL=debug and restarts the container, **Then** Clarity Council outputs debug-level logs visible in Docker Desktop logs viewer
2. **Given** the developer changes HTTP_PORT from 8080 to 9000, **When** the container restarts, **Then** the MCP service endpoint updates to http://localhost:9000 automatically
3. **Given** secrets are configured via Docker Desktop secrets management, **When** the container starts, **Then** environment variables referencing secrets are properly injected (future-proofing for auth)

---

### User Story 4 - Container health monitoring and diagnostics (Priority: P3)

A developer views real-time health status, logs, and resource usage of the Clarity Council container within Docker Desktop, helping diagnose issues without needing terminal access.

**Why this priority**: Nice-to-have for troubleshooting - improves debuggability but core functionality works without it.

**Independent Test**: Open Docker Desktop, navigate to Clarity Council container, verify health check status, view logs showing recent tool calls, check CPU/memory graphs.

**Acceptance Scenarios**:

1. **Given** the container is running, **When** the developer opens the container details in Docker Desktop, **Then** health check status displays "healthy" with last check timestamp
2. **Given** a tool call fails, **When** the developer views container logs in Docker Desktop, **Then** structured error logs with request IDs are visible and filterable
3. **Given** the container has been running for 1 hour, **When** the developer views resource usage graphs, **Then** CPU and memory trends are displayed with alerts if thresholds exceeded

---

### Edge Cases

- What happens when Docker Desktop loses connection to the container mid-request? (Service shows "unhealthy", MCP clients get timeout, clear error message guides restart)
- How does the system handle port conflicts when HTTP_PORT is already in use? (Container fails to start with explicit port conflict error, suggests alternative ports)
- What if the container is running but the MCP service registration is stale? (Auto-refresh mechanism detects stale registration and re-registers, max staleness 30 seconds)
- How does upgrade/migration work when switching from manual docker-compose to Docker Desktop managed? (Migration guide in docs, detect existing container, offer import/adopt workflow)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose MCP service metadata (name, version, available tools) via Docker Desktop's MCP toolkit discovery API
- **FR-002**: System MUST register the containerized MCP server endpoint (HTTP and HTTPS) with Docker Desktop on container startup
- **FR-003**: System MUST update service registration status (healthy/unhealthy/stopped) based on container health checks
- **FR-004**: Container MUST accept environment variable configuration for HTTP_PORT, HTTPS_PORT, HTTP_ENABLED, LOG_LEVEL, and CERT_DIR
- **FR-005**: System MUST expose structured logs (JSON format with timestamps, request IDs, tool names) accessible via Docker Desktop logs viewer
- **FR-006**: Container health check MUST verify both HTTP endpoint availability and MCP protocol responsiveness
- **FR-007**: System MUST support Docker Desktop secrets and environment variables for future authentication mechanisms (OAuth tokens, API keys); default deployment mode SHALL be unauthenticated for simplicity
- **FR-008**: Container MUST gracefully handle SIGTERM and SIGINT signals for clean shutdown during Docker Desktop stop operations
- **FR-009**: System MUST provide clear error messages in Docker Desktop UI when ports are unavailable or configuration is invalid
- **FR-010**: Container MUST persist .council workspace configuration (persona overrides) across restarts via Docker volume mounts, and MUST support hot-reloading persona overrides when configuration files change on the host volume (file watcher on `.council/personas.overrides.json`)

### Key Entities

- **MCP Service Registration**: Metadata describing the Clarity Council service (name, version, endpoints, health status) registered with Docker Desktop's MCP toolkit
- **Container Configuration**: Environment variables and volume mounts defining ports, logging, certificates, and persona overrides
- **Health Check Result**: Periodic verification of HTTP/HTTPS endpoint availability and MCP protocol compliance, reported to Docker Desktop
- **Structured Log Entry**: JSON-formatted log records containing timestamp, request ID, tool name, success/failure, and duration for debugging via Docker Desktop logs

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: MPC clients (GitHub Copilot, VS Code) can discover and connect to Clarity Council via Docker Desktop without manual endpoint configuration
- **SC-002**: Container startup to MCP service availability completes in under 10 seconds on standard hardware
- **SC-003**: Service registration status accurately reflects container state within 5 seconds of any lifecycle change (start/stop/restart)
- **SC-004**: 95% of developers successfully configure and connect to Clarity Council through Docker Desktop on first attempt (measured via telemetry opt-in)
- **SC-005**: Health check failures trigger visible alerts in Docker Desktop UI within 30 seconds
- **SC-006**: Zero port conflicts or configuration errors when using default Docker Desktop managed settings
- **SC-007**: Developers can diagnose tool call failures using Docker Desktop logs without needing terminal/SSH access to container

## Clarifications

### Session 2026-01-26

- Q: What persistence strategy should be used for persona configuration overrides across container restarts? → A: **Option C** (Bidirectional hot-reload). The system will support both reading persona overrides from host volume mounts (one-way on startup) and hot-reloading configuration changes detected from external modifications to the volume during runtime. This requires implementing a file watcher on the `.council/personas.overrides.json` file that triggers re-initialization of affected personas without restarting the entire server.
- Q: What should be the primary authentication approach for future external API integrations? → A: **Option A** (Docker Secrets + Environment Variables, unauthenticated default). Authentication infrastructure will be prepared via Docker Secrets and environment variables, enabling future integrations to authenticate with external APIs. The default deployment mode operates unauthenticated for simplicity; auth is opt-in via environment variable flags.
