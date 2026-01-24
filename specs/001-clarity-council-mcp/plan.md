# Implementation Plan: Clarity Council MCP Tool Suite (VS Code)

**Branch**: `001-clarity-council-mcp` | **Date**: 2026-01-21 | **Spec**: [specs/001-clarity-council-mcp/spec.md](specs/001-clarity-council-mcp/spec.md)
**Input**: Feature specification from `/specs/001-clarity-council-mcp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a local VS Code MCP server that exposes persona-driven tools for The Clarity Council: `council.consult`, `persona.consult`, and `council.define_personas`. Each tool validates JSON inputs, returns structured outputs (persona, summary, advice, assumptions, questions, next_steps, confidence), and adheres to persona contracts (Soul, Focus, Constraints). Devil’s Advocate always stress-tests assumptions and surfaces risks/tradeoffs. Implementation uses Node.js + TypeScript with strict schemas, local workspace config for persona overrides, golden tests for persona consistency, and clear docs.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 20+, TypeScript 5.x  
**Primary Dependencies**: MCP SDK (Node), `ajv` for JSON Schema validation, `pino` for structured logs  
**Storage**: Local workspace config file (persona overrides only), no conversation persistence  
**Testing**: Vitest (unit + integration), golden-output tests for persona tone/structure  
**Target Platform**: VS Code MCP server (local usage)  
**Project Type**: Single project (server + tools + personas + tests + docs)  
**Performance Goals**: Tool responses within a few seconds for standard depth; progressive status when longer  
**Constraints**: Offline-first; no network calls by default; explicit nondeterminism flags when applicable  
**Scale/Scope**: MVP tool suite (3 tools), 6 personas; designed for extensibility

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following gates are derived from the constitution and MUST be satisfied:
- Persona-first UX: outputs identify acting persona and rationale.
- Tool scope: one job per tool; stable, versioned schemas.
- Determinism: predictable outputs; any nondeterminism explicitly disclosed.
- Performance: progressive results or status updates for long-running actions.
- Idempotency: write operations support dry-run, pre-change summary, and diff.
- Observability: structured logs with correlation IDs, timing, failure categories.
- Security: data minimization; no secret logging; bounded timeouts/retries; fail-closed.
- Testing: unit, integration, and golden persona-output tests where tone/format matters.
- Documentation: tool examples, failure modes, latency class; persona one-pager + permissions matrix.
- PR checklist: tests + docs updated; no breaking schemas without versioning; rollback path present.

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
server/
├── src/
│   ├── index.ts            # MCP server bootstrap
│   ├── tools/              # Tool implementations (council.consult, persona.consult, define_personas)
│   ├── personas/           # Persona contracts (Soul, Focus, Constraints)
│   ├── schemas/            # JSON Schemas for inputs/outputs
│   └── utils/              # Validation, logging, synthesis, depth scaling
├── package.json
└── tsconfig.json

tests/
├── unit/                   # schema validation, persona formatter
├── integration/            # tool invocation flows (MCP request/response)
└── golden/                 # persona tone/structure and challenge checks

docs/
└── README.md               # setup, usage, examples, persona matrix
```

**Structure Decision**: Single project with clear separation for tools, personas, and schemas; aligns with constitution’s sharp interfaces, observability, and testing gates.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Phase 0: Research (Resolve Unknowns)

Decisions and rationale captured in [specs/001-clarity-council-mcp/research.md](specs/001-clarity-council-mcp/research.md):
- MCP SDK (Node) vs custom wire: choose SDK for determinism, schema alignment, and VS Code integration.
- Validation via `ajv`: fast, widely used, good error mapping.
- Logging via `pino`: structured JSON logs; supports correlation IDs and timing.
- Workspace config path: `.council/personas.json` (documented, no secrets, local only).
- Golden tests scope: cover all 6 personas for tone/structure and challenge checks.

## Phase 1: Design & Contracts

Artifacts:
- Data model: [specs/001-clarity-council-mcp/data-model.md](specs/001-clarity-council-mcp/data-model.md)
- Contracts (JSON Schemas): [specs/001-clarity-council-mcp/contracts/](specs/001-clarity-council-mcp/contracts)
- Quickstart: [specs/001-clarity-council-mcp/quickstart.md](specs/001-clarity-council-mcp/quickstart.md)

Agent context update:
- Run `.specify/scripts/bash/update-agent-context.sh copilot` to sync agent guidance with chosen tech.

Constitution Check Re-evaluation:
- Gates satisfied: persona-first UX, determinism, performance budgets, idempotent behavior, observability, security/privacy, testing strategy, documentation, PR checklist.

## Phase 2: Planning (Tasks outline)

Tasks will be generated by `/speckit.tasks` based on this plan and contracts.
