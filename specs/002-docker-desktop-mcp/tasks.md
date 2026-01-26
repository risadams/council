# Implementation Tasks: Docker Desktop MCP Integration

**Feature**: Docker Desktop MCP Integration (002-docker-desktop-mcp)  
**Branch**: `002-docker-desktop-mcp`  
**Date**: 2026-01-26  
**Spec**: [spec.md](spec.md) | [Plan**: [plan.md](plan.md) | **Design**: [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

---

## Overview

Implement Docker Desktop MCP Toolkit integration for Clarity Council. Tasks are organized by user story (P1 → P2a → P2b → P3) with independent setup and foundational phases. All tasks follow strict checklist format for LLM execution.

**Task Format**: `- [ ] [TaskID] [P?] [Story?] Description with file path`

---

## Phase 1: Project Setup & Initialization

> **Duration**: 1 day | **Blockers**: None | **Entry point**: All following phases depend on these

### Setup Infrastructure

- [x] T001 Initialize Docker registration utilities directory structure in `server/src/utils/` (create dockerRegistration.ts, healthCheck.ts, fileWatcher.ts, logger.ts)
- [x] T002 Update `server/package.json` to add dependencies: `chokidar@^3.6.0` (file watcher), `uuid@^9.0.0` (correlation IDs)
- [x] T003 Update `server/package.json` npm scripts: add `npm run build:utils` (build utilities TypeScript) separate from main build
- [x] T004 Create `server/src/types/docker.ts` with TypeScript interfaces for MCP Service Registration, Health Check Result, Persona Overrides (align with data-model.md)
- [x] T005 Update `Dockerfile` to include optional environment variables: `HTTP_PORT`, `HTTPS_PORT`, `LOG_LEVEL`, `LOG_FORMAT`, `WORKSPACE_DIR`, `AUTH_ENABLED` (set defaults)
- [x] T006 Update `docker-compose.yml` to add volume mounts: `/.council/` → `./council-workspace/`, `/certs/` → `./certs/` (read-only)
- [x] T007 Create `server/scripts/docker-register.cjs` entry point script (registers service on container startup)
- [x] T008 Update `server/src/index.ts` to call registration on startup and handle SIGTERM/SIGINT signals for graceful shutdown

---

## Phase 2: Core Logging & Configuration (Foundational)

> **Duration**: 2 days | **Blockers**: Phase 1 complete | **Downstream**: All user stories depend on logging

### Structured JSON Logging

- [x] T009 Implement `server/src/utils/logger.ts` with structured JSON logging: timestamps, request IDs, correlation IDs, log levels (debug/info/warn/error), metadata fields (no secrets)
- [x] T010 Add logger initialization in `server/src/index.ts` before server startup (set log level from `LOG_LEVEL` env var)
- [x] T011 Update all MCP tool handlers (`council_consult.ts`, `persona_consult.ts`, `council_define_personas.ts`) to emit structured logs on invocation start/end, including input character count, output character count, duration, and tool name
- [x] T012 Add structured error logging to all error paths: tool failures, schema validation errors, registration failures (include error category, message, stack trace)
- [x] T013 Add `LOG_FORMAT` env var support: if `LOG_FORMAT=json` (default), output structured JSON; if `LOG_FORMAT=text`, pretty-print for local development
- [x] T014 Create `tests/unit/logger.spec.ts` unit tests: validate JSON output format, test all log levels, verify no secrets in logs, test correlation ID generation
- [x] T015 Add request-scoped correlation ID to MCP request context: generate on tool invocation, include in all logs for that request, return in response metadata (if MCP spec supports)

### Environment Configuration

- [x] T016 Create `server/src/utils/config.ts` to load and validate startup configuration from environment variables: `HTTP_PORT`, `HTTPS_PORT`, `HTTP_ENABLED`, `HTTPS_ENABLED`, `LOG_LEVEL`, `WORKSPACE_DIR`, `AUTH_ENABLED`, `CERT_DIR`
- [x] T017 Add configuration validation: port range (1024-65535), directory existence, certificate file checks (if HTTPS enabled), conflicts between ports
- [x] T018 Implement `validateConfig()` function that exits with code 1 and logs clear error message if configuration is invalid (prevent container startup with bad config)
- [x] T019 Create `tests/unit/config.spec.ts` unit tests: valid config parsing, invalid port handling, missing cert detection, port conflict detection

---

## Phase 3: User Story 1 - Service Discovery & Registration (P1)

> **Duration**: 3 days | **Blockers**: Phase 2 complete | **Story goal**: Developers discover Clarity Council in Docker Desktop without manual configuration

### MCP Service Registration

- [x] T020 [P] [US1] Implement `server/src/utils/dockerRegistration.ts` class `DockerRegistration` with methods: `registerService()`, `deregisterService()`, `updateServiceStatus()`
- [x] T021 [P] [US1] Implement `registerService()`: build MCP Service Registration payload (serviceId, name, version, endpoint from config, tools list, healthCheckUrl, timestamp)
- [x] T022 [P] [US1] Implement service payload to match [contracts/mcp-registration.schema.json](contracts/mcp-registration.schema.json): all required fields, correct enum values, valid JSON structure
- [ ] T023 [P] [US1] Add Docker MCP Gateway integration: call `docker mcp gateway register` command (or HTTP POST if API available) with registration payload
- [x] T024 [P] [US1] Add error handling for registration failures: log error with category (network, validation, timeout), retry logic with exponential backoff (up to 3 attempts), exit container if fatal
- [x] T025 [US1] Integrate registration into `server/src/index.ts` startup flow: after server listening, call `dockerRegistration.registerService()`, log success/failure
- [ ] T026 [US1] Create `server/scripts/docker-register.cjs` to load tool schemas and call registration (used in container startup before Node.js server starts, if Docker requires pre-startup registration)

### Health Check Endpoint

- [x] T027 [P] [US1] Implement `server/src/utils/healthCheck.ts` class `HealthChecker` with method `performHealthCheck(): Promise<HealthCheckResult>`
- [x] T028 [P] [US1] Implement health check logic: test HTTP endpoint (GET /health-ok), test HTTPS endpoint (GET /health-ok), test MCP protocol (tool invocation), validate schemas, compute memory usage, compute disk space
- [x] T029 [P] [US1] Implement health check result structure matching [contracts/health-check.schema.json](contracts/health-check.schema.json): status (healthy/unhealthy), timestamp, all boolean fields, memory/disk fields
- [x] T030 [P] [US1] Add `/health` HTTP endpoint in `server/src/https-server.ts` or `server/src/index.ts`: GET /health returns health check result as JSON, status code 200 if healthy, 503 if unhealthy
- [x] T031 [US1] Add `/mcp-metadata` HTTP endpoint: returns service metadata (name, version, tools list, endpoint config) for Docker Desktop discovery
- [x] T032 [US1] Add health check logging: emit structured log after each health check with result, duration, and any errors detected
- [x] T033 [US1] Create `tests/unit/healthCheck.spec.ts` unit tests: validate result format, test endpoint detection, test schema validation, test memory/disk computation
- [ ] T034 [US1] Create `tests/integration/service-discovery.spec.ts` integration test: start server, verify /health endpoint returns healthy status within 5 seconds, verify /mcp-metadata includes all 3 tools

---

## Phase 4: User Story 2a - Container Lifecycle Sync (P2)

> **Duration**: 2 days | **Blockers**: Phase 3 complete (health checks required) | **Story goal**: Container start/stop/restart automatically sync with MCP service registration status

### Service Status Updates & Recovery

- [x] T035 [P] [US2] Implement periodic health check polling in `server/src/utils/dockerRegistration.ts`: start background task on registration, call health check every 30s, update service status via Docker API
- [x] T036 [P] [US2] Implement stale registration recovery logic: if health check fails 2 consecutive times, re-register service fresh (Option C from Q3)
- [x] T037 [P] [US2] Add service status state machine: track `registering` → `healthy` → `unhealthy` → `healthy` (with explicit recovery) or `stopped` transitions
- [x] T038 [US2] Implement graceful shutdown: catch SIGTERM and SIGINT signals, call `deregisterService()`, close all connections, exit cleanly with code 0
- [x] T039 [US2] Add shutdown logging: emit structured log when shutdown signal received, log deregistration success/failure, log graceful shutdown completion
- [x] T040 [US2] Create `tests/integration/container-lifecycle.spec.ts` integration test: start server → verify healthy → simulate health check failure → verify unhealthy → recover → verify healthy again
- [x] T041 [US2] Create `tests/integration/graceful-shutdown.spec.ts` integration test: start server → send SIGTERM → verify deregistration called → verify clean exit

---

## Phase 5: User Story 2b - Environment & Secrets Configuration (P2)

> **Duration**: 2 days | **Blockers**: Phase 2 complete (config parsing required) | **Story goal**: Developers configure ports, logging, and secrets via Docker Desktop UI; changes reflect immediately

### Environment Variable Support

- [x] T042 [P] [US2] Implement dynamic port configuration: read `HTTP_PORT` and `HTTPS_PORT` env vars at startup, use in server listeners and registration payload
- [x] T043 [P] [US2] Implement logging configuration: read `LOG_LEVEL` (debug/info/warn/error) and `LOG_FORMAT` (json/text) env vars, apply to logger on startup
- [x] T044 [P] [US2] Implement workspace directory configuration: read `WORKSPACE_DIR` env var (default `/.council`), use for persona overrides file path
- [x] T045 [P] [US2] Add environment variable validation: if HTTP_PORT == HTTPS_PORT, fail startup with clear error; if ports < 1024 or > 65535, fail with clear error
- [x] T046 [US2] Document all supported environment variables in `docs/setup-docker-desktop.md`: HTTP_PORT, HTTPS_PORT, HTTP_ENABLED, HTTPS_ENABLED, LOG_LEVEL, LOG_FORMAT, WORKSPACE_DIR, AUTH_ENABLED, AUTH_TOKEN, CERT_DIR
- [x] T047 [US2] Create `tests/unit/environment-config.spec.ts` unit tests: valid port parsing, invalid port detection, logging level application, workspace directory resolution

### Docker Secrets Support (Prepared for Future)

- [x] T048 [US2] Implement Docker Secrets reading in `server/src/utils/config.ts`: check for `/run/secrets/` directory, load secrets if auth enabled (future use)
- [x] T049 [US2] Add AUTH_ENABLED and AUTH_TOKEN env vars to configuration (default: false and empty); if AUTH_ENABLED, validate requests contain Bearer token matching AUTH_TOKEN (future implementation)
- [x] T050 [US2] Create `tests/unit/secrets-prepared.spec.ts` unit test: verify /run/secrets/ path checked, verify auth env vars are read (not applied, just prepared)
- [x] T051 [US2] Document auth preparation in docs: "Authentication is prepared for future integrations. Currently unauthenticated. To enable: set AUTH_ENABLED=true, provide AUTH_TOKEN via Docker Secrets"

---

## Phase 6: User Story 3 - Persona Configuration & Hot-Reload (P2)

> **Duration**: 3 days | **Blockers**: Phase 2 complete (config, logging required) | **Story goal**: Persona customizations persist across restarts and hot-reload when files change (Option C from Q4)

### File Watcher & Hot-Reload Infrastructure

- [x] T052 [P] [US3] Implement `server/src/utils/fileWatcher.ts` class `PersonaConfigWatcher` with methods: `loadPersonaOverrides()`, `watchForChanges()`, `applyOverrides()`, `reloadOnChange()`
- [x] T053 [P] [US3] Implement `loadPersonaOverrides()`: read `/.council/personas.overrides.json` (from WORKSPACE_DIR), parse JSON, validate against [contracts/persona-overrides.schema.json](contracts/persona-overrides.schema.json)
- [x] T054 [P] [US3] Add error handling for malformed files: if JSON parse fails, log error, use previous config, don't crash server (fault tolerance per Q4)
- [x] T055 [P] [US3] Implement `watchForChanges()`: use `chokidar` library to watch `personas.overrides.json` file, trigger reload on any change event
- [x] T056 [P] [US3] Implement `reloadOnChange()`: on file change detected, call `loadPersonaOverrides()`, apply to persona definitions in memory, emit structured log (file change timestamp, affected persona count, success/failure)
- [x] T057 [US3] Integrate file watcher into `server/src/index.ts`: on startup, load initial overrides, start file watcher, log initial persona config state
- [x] T058 [US3] Update `council_define_personas.ts` tool handler: when persona overrides are modified via tool, write to `/.council/personas.overrides.json` atomically (write to temp file, rename), file watcher detects and reloads

### Persona Override Data Model

- [x] T059 [US3] Create `server/src/types/personaOverrides.ts` TypeScript interface matching [contracts/persona-overrides.schema.json](contracts/persona-overrides.schema.json): version, lastModified, overrides map with enabled/customSoul/customFocus/customConstraints fields
- [x] T060 [US3] Implement override application logic: for each overridden persona, replace soul/focus/constraints if provided, keep original if not provided, merge with existing persona definition
- [x] T061 [US3] Add override validation: customSoul ≤500 chars, customFocus items ≤100 chars, customConstraints items ≤200 chars (per data-model.md)
- [x] T062 [US3] Create `tests/unit/file-watcher.spec.ts` unit tests: load valid overrides file, load malformed JSON, detect file changes, apply overrides, test fallback on error
- [x] T063 [US3] Create `tests/integration/persona-hotreload.spec.ts` integration test: start server with overrides file, call council_consult (verify override applied), modify file externally, wait for reload, call council_consult again (verify new override applied)
- [x] T064 [US3] Create golden test `tests/golden/persona-override-tone.spec.ts`: override a persona's soul, call person_consult, verify output tone/content reflects override

---

## Phase 7: User Story 4 - Health Monitoring & Diagnostics (P3)

> **Duration**: 2 days | **Blockers**: Phase 3 + 4 complete | **Story goal**: Developers view health status, logs, and resource metrics in Docker Desktop UI (no terminal needed)

### Structured Logging for Diagnostics

- [x] T065 [US4] Enhance structured logging: add request ID to all tool invocation logs, include input/output summaries, include persona count in council_consult logs, include tool execution duration
- [x] T066 [US4] Add filtered log endpoints (if Docker supports): `/logs?level=error` (return last N error logs), `/logs?tool=council_consult` (return tool-specific logs) - optional if Docker UI doesn't support
- [x] T067 [US4] Create structured error responses for failures: include error category (validation, network, timeout), error message, request ID, suggestion for recovery
- [x] T068 [US4] Add health check metadata to /health endpoint: include memory usage (MB), disk space (MB), uptime (seconds), last check timestamp (allows Docker Desktop to display trends)

### Metrics & Resource Monitoring

- [x] T069 [P] [US4] Add memory usage tracking: in health check, compute process memory via `process.memoryUsage().heapUsed`, log if memory > 80MB (warning threshold)
- [x] T070 [P] [US4] Add disk space tracking: in health check, compute available disk in workspace directory, log if < 1GB (warning threshold)
- [x] T071 [US4] Add uptime tracking: record container start time at startup, compute uptime in health check, include in /health response
- [x] T072 [US4] Create `tests/unit/health-check-metrics.spec.ts` unit tests: validate memory computation, validate disk space computation, validate uptime calculation

### Diagnostics Documentation

- [x] T073 [US4] Create `docs/setup-docker-desktop.md` setup guide: step-by-step Docker Desktop configuration, environment variables, volume mounts, health check behavior, troubleshooting section
- [x] T074 [US4] Create `docs/docker-troubleshooting.md` diagnostics guide: common issues (port conflicts, registration failures, hot-reload failures), how to interpret logs, how to collect logs for support
- [x] T075 [US4] Update `docs/personas.md`: add note about persona overrides and how to customize via `/.council/personas.overrides.json`

---

## Phase 8: Integration & Cross-Cutting Concerns

> **Duration**: 2 days | **Blockers**: All user story phases complete | **Dependencies**: Tested independently; now verify interaction

### End-to-End Integration Testing

- [x] T076 [P] Create `tests/integration/e2e-docker-workflow.spec.ts`: full workflow test (start container → register → verify health → call tools → check logs → stop container → deregister)
- [x] T077 [P] Create `tests/integration/schema-validation.spec.ts`: verify all MCP requests/responses conform to schemas (council.consult.input/output, persona.consult.input/output, council_define_personas.input/output)
- [x] T078 [P] Create `tests/integration/error-handling.spec.ts`: test all error paths (invalid config, registration failure, unhealthy status, malformed overrides file, port conflict)
- [x] T079 Create `tests/integration/docker-compose-startup.spec.ts`: start server via docker-compose.yml (with volume mounts, env vars), verify service registrable, health checks working

### Cross-Platform Testing

- [x] T080 [P] Test on Windows: verify paths work with backslashes in Dockerfile and docker-compose.yml, verify file watcher works with Windows file system events
- [x] T081 [P] Test on macOS: verify paths work with /Volumes mount points, verify file watcher latency acceptable
- [x] T082 [P] Test on Linux: verify paths work with standard Linux mounts, verify Docker daemon interaction correct
- [x] T083 Update CI/CD pipeline (if exists): add Docker integration tests to GitHub Actions, test across platforms

### Rollback & Versioning

- [x] T084 Tag initial Docker image version: `clarity-council:1.0.0` (matching spec version)
- [x] T085 Document version compatibility: MCP Protocol version, Docker Desktop MCP Toolkit version requirement, Node.js 22 LTS requirement
- [x] T086 Create upgrade guide: document breaking changes (none in 1.0.0), document migration path if persona overrides format changes in future

### Code Quality & Polish

- [x] T087 Run lint checks: `npm run lint` on all new TypeScript files (dockerRegistration, healthCheck, fileWatcher, logger, config)
- [ ] T088 Verify test coverage: aim for >80% coverage on new utilities (coverage report in CI)
- [ ] T089 Code review checklist: verify all FRs implemented, all SCs testable, all error messages clear, no secrets in logs, no hardcoded paths
- [ ] T090 Performance validation: verify startup time <10s, health check <1s, file watcher change detection <5s, memory footprint <100MB

---

## Phase 9: Documentation & Release

> **Duration**: 1 day | **Blockers**: All testing complete | **Deliverable**: Complete feature ready for Docker Desktop listing

### Final Documentation

- [ ] T091 Create `DOCKER_DESKTOP_MCP_README.md`: one-page overview of Docker Desktop MCP feature, links to setup guide, prerequisites (Docker Desktop with MCP Toolkit beta)
- [ ] T092 Update root `README.md`: add Docker Desktop section, link to Docker MCP integration docs
- [ ] T093 Create `docs/mcp-compliance.md`: document MCP protocol compliance, tool schema versions, JSON-RPC implementation details
- [ ] T094 Create `docs/docker-mcp-faq.md`: frequently asked questions about Docker Desktop integration, persona customization, troubleshooting

### Release Artifacts

- [ ] T095 Update `package.json` version: bump to match Docker Desktop release version (e.g., 1.0.0)
- [ ] T096 Update `Dockerfile` labels: add version label, description, maintainer info for Docker Hub / Docker Desktop Catalog
- [ ] T097 Create GitHub release notes: summarize feature, link to docs, document known limitations (if any)
- [ ] T098 Prepare Docker Desktop Catalog submission (if required): provide description, icon, links to GitHub repo, docs

---

## Task Dependency Graph

```
Phase 1 (Setup)
  ↓
Phase 2 (Logging & Config) [Foundational]
  ├─→ Phase 3 (US1: Service Discovery)
  │   ├─→ Phase 4 (US2: Lifecycle Sync)
  │   │   ├─→ Phase 4b (US2: Environment Config)
  │   │   ├─→ Phase 5 (US3: Persona Hot-Reload)
  │   │   └─→ Phase 6 (US4: Diagnostics) [P3]
  │   └─→ Phase 8 (Integration Testing)
  │
  └─→ Phase 9 (Documentation & Release)
```

**Parallel Opportunities**:
- Phase 3 (health checks) and Phase 4 (environment config) can run in parallel after Phase 2
- Phase 5 (persona hot-reload) can run in parallel with Phase 4
- Phase 6 (US4) tasks can be parallelized (metrics, logging enhancements, docs)
- Testing (unit/integration/golden) can run incrementally as each component completes

---

## Success Criteria Checklist

✅ **SC-001**: MCP clients discover Clarity Council → Verify /mcp-metadata endpoint (T031) and registration payload (T021-T022)  
✅ **SC-002**: Startup <10s → Test in T034 (integration test verifies healthy within 5s)  
✅ **SC-003**: Status sync <5s → Implement in T035-T036 (health check polling 30s, stale recovery)  
✅ **SC-004**: 95% first-attempt success → Documentation (T073, T074) enables user success  
✅ **SC-005**: Alerts <30s → Health check polling 30s (T035) ensures detection  
✅ **SC-006**: Zero port conflicts → Validation (T017, T044) prevents conflicts  
✅ **SC-007**: Diagnose without terminal → Structured logs (T009, T065, T067) + Docker UI integration  

---

## Total Task Count: 98

| Phase | Focus | Tasks | Duration | Effort |
|-------|-------|-------|----------|--------|
| 1 | Setup | T001-T008 | 1 day | Low |
| 2 | Logging & Config | T009-T019 | 2 days | Medium |
| 3 | US1 (P1) | T020-T034 | 3 days | High |
| 4 | US2a (P2) | T035-T041 | 2 days | Medium |
| 5 | US2b (P2) | T042-T051 | 2 days | Medium |
| 6 | US3 (P2) | T052-T064 | 3 days | High |
| 7 | US4 (P3) | T065-T075 | 2 days | Medium |
| 8 | Integration | T076-T090 | 2 days | Medium |
| 9 | Release | T091-T098 | 1 day | Low |
| **TOTAL** | **Docker Desktop MCP** | **T001-T098** | **18 days** | **~130 story points** |

---

## MVP Scope (Recommended First Increment)

For fastest MVP delivery (1 week):

**Minimum Viable Product** includes:
- Phase 1: Setup (T001-T008)
- Phase 2: Logging & Config (T009-T019)
- Phase 3: Service Discovery (T020-T034) — Core registration & health checks
- Phase 4a: Lifecycle Sync (T035-T041) — SIGTERM handling essential
- **Deliverable**: Developers can manually register Clarity Council in Docker Desktop, start/stop works, health checks visible

Then Phase 5+ in subsequent sprints (hot-reload, advanced diagnostics, etc.)

---

## Notes

- **Test-First Approach**: Each task includes corresponding unit/integration tests (can be written in parallel)
- **Cross-Platform**: All tasks tested on Windows, macOS, Linux (see T080-T082)
- **Constitution Compliance**: All tasks align with constitution gates (logging, security, idempotency, observability)
- **Documentation-Driven**: Documentation tasks (T046, T073-T075) ensure developer success
- **Incremental Validation**: Each phase can be validated independently before moving to next
