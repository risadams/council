# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Integrate Clarity Council MCP server with Docker Desktop's MCP Toolkit (beta) to enable seamless service discovery and configuration management through the Docker Desktop UI. Implementation requires: (1) MCP service registration via Docker Desktop's MCP Gateway and Catalog, (2) container lifecycle sync (startup/stop/restart → service status), (3) environment variable & secrets management through Docker Desktop UI, (4) health checks and structured logging for diagnostics, and (5) bidirectional hot-reload for persona overrides via file watchers. Technically: enhance existing Node.js/TypeScript containerized service with Docker Desktop integration points, file watchers for config changes, structured JSON logging, and explicit shutdown signal handling.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9.3, Node.js 22 LTS  
**Primary Dependencies**: Docker Desktop MCP Toolkit (beta), MCP Protocol, node:22-bookworm-slim base image, Docker Compose  
**Storage**: Docker volumes (.council workspace, persona.overrides.json), ephemeral container logs  
**Testing**: Vitest 4.0.18 (unit, integration, golden tests)  
**Target Platform**: Docker Desktop (Windows, macOS, Linux with Docker Engine), MCP Gateway aggregator  
**Project Type**: Single containerized service (TypeScript/Node.js)  
**Performance Goals**: Service startup <10s, status sync <5s, health checks sub-second  
**Constraints**: <5MB startup latency variance, <100MB memory footprint, graceful SIGTERM handling  
**Scale/Scope**: Single containerized server, 3 MCP tools (council_consult, persona_consult, council_define_personas), 14 personas, Docker Desktop Extension integration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Persona-first UX**: Council consult tool returns formatted markdown with acting persona identified; synthesis output attributes recommendations to specific personas.

✅ **Tool scope**: Three tools, each focused (council_consult = multi-persona advice; persona_consult = single persona; council_define_personas = configuration). Schemas stable, versioned (1.0.0).

✅ **Determinism**: MCP Gateway and container lifecycle are deterministic; Docker Desktop API is documented. Nondeterminism (network, timing) is explicitly disclosed in FRs (timeout bounds, health check intervals).

✅ **Performance**: Health checks return sub-second; progressive results via structured logs visible in Docker Desktop. MCP service registration happens at startup (no long polling).

✅ **Idempotency**: Service registration is idempotent (re-register on health check success). Persona overrides (bidirectional, Option C) support atomic file writes + fallback to previous config on parse error.

✅ **Observability**: Structured JSON logging (FR-005) with timestamps, request IDs, tool names, durations. Containers expose logs via Docker Desktop logs viewer (native observability).

✅ **Security**: No secrets in logs (FR-005 structured logs exclude sensitive fields). Docker Secrets + environment variables (Option A, FR-007). Timeout-bounded health checks (sub-second). Fail-closed: if MCP registration fails, container logs error and exits on startup (prevents stale registration).

✅ **Testing**: Unit tests for config parsing, health checks, schema validation. Integration tests for MCP tool calls via JSON-RPC. Golden tests for persona tone consistency in council outputs. All required by constitution.

✅ **Documentation**: Tool examples in docs/tools.md (curl, PowerShell). Failure modes documented in edge cases (port conflicts, stale registration, startup timeout). Persona reference in docs/personas.md (14-row table + permission matrix implicit in tool definitions).

✅ **PR checklist**: No breaking schema changes (extending FR-010 and FR-007 only). Rollback path: revert to prior container image if hot-reload file watcher causes issues. Tests + docs updated in parallel.

**Phase 1 Design Validation**:
- ✅ research.md consolidates all clarification decisions (5 Qs answered)
- ✅ data-model.md defines 5 core entities (Service Registration, Health Check, Persona Overrides, Startup Config, State Transitions)
- ✅ contracts/ provides 3 JSON Schemas for integration
- ✅ quickstart.md breaks down implementation into testable tasks
- ✅ Agent context updated with Docker Desktop MCP Toolkit + Node.js 22 LTS tech

**Gate Evaluation Result**: ✅ PASS (Phase 1 Design) - All constitutional gates satisfied. No new violations introduced. Specification is production-ready for Phase 2 implementation planning.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
server/                                    # Existing Node.js/TypeScript service
├── src/
│   ├── index.ts                          # Entry point
│   ├── https-server.ts                   # HTTPS server + MCP listener
│   ├── personas/                         # Persona definitions (existing)
│   ├── tools/                            # MCP tool implementations
│   │   ├── council.consult.ts           # Multi-persona advice tool
│   │   ├── persona.consult.ts           # Single-persona consultation tool
│   │   └── council.define_personas.ts   # Persona config override tool
│   ├── schemas/                          # JSON Schema definitions (existing)
│   └── utils/
│       ├── logger.ts                    # [NEW] Structured JSON logging
│       ├── dockerRegistration.ts        # [NEW] MCP service registration to Docker
│       ├── healthCheck.ts               # [NEW/ENHANCED] Health check for MCP + HTTP
│       ├── fileWatcher.ts               # [NEW] Hot-reload persona overrides
│       └── [existing utilities]
├── package.json                          # [MODIFY] Add health check, file watcher dependencies
├── vitest.config.ts                      # [EXISTING] Test runner config
└── scripts/
    ├── copy-schemas.cjs                  # [EXISTING] Schema copy
    └── docker-register.cjs               # [NEW] Register with Docker Desktop MCP Catalog on startup

tests/
├── unit/
│   ├── logger.spec.ts                   # [NEW] Structured logging validation
│   ├── fileWatcher.spec.ts              # [NEW] File watcher behavior + edge cases
│   ├── dockerRegistration.spec.ts       # [NEW] Service registration logic
│   └── [existing unit tests]
├── integration/
│   ├── mcp-docker-lifecycle.spec.ts     # [NEW] Container start/stop/restart sync
│   ├── persona-hotreload.spec.ts        # [NEW] Config file change → reload
│   └── [existing integration tests]
└── golden/
    └── [existing persona tone tests]

Dockerfile                                 # [EXISTING] node:22-bookworm-slim base
docker-compose.yml                        # [MODIFY] Add volume mount for .council workspace

docs/                                      # [EXISTING] Documentation
├── index.md
├── usage.md
├── tools.md
└── personas.md

specs/002-docker-desktop-mcp/             # Feature documentation (this feature)
├── spec.md                               # [DONE] Feature specification
├── plan.md                               # This file
├── research.md                           # [TO GENERATE] Phase 0 research findings
├── data-model.md                         # [TO GENERATE] Phase 1 entity definitions
├── quickstart.md                         # [TO GENERATE] Phase 1 developer quickstart
├── contracts/                            # [TO GENERATE] Phase 1 contract definitions
│   ├── mcp-registration.schema.json     # Service registration request/response
│   ├── health-check.schema.json         # Health check request/response
│   └── persona-overrides.schema.json    # Persona config file structure
└── checklists/
    └── requirements.md                   # Quality checklist (existing)
```

**Structure Decision**: Single containerized service (Option 1). Leverages existing Node.js/TypeScript service architecture. New functionality (Docker registration, file watchers, structured logging) is added as utility modules in `utils/`, called from startup and request handlers. Tests follow existing pattern (unit/integration/golden in `tests/`). Docker Desktop integration uses existing Dockerfile and docker-compose.yml with minimal additions (volume mounts, startup scripts).


