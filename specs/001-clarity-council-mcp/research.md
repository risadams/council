# Research: Clarity Council MCP Tool Suite

**Date**: 2026-01-21
**Branch**: 001-clarity-council-mcp

## Decisions

- **MCP SDK (Node)**
  - Decision: Use official MCP SDK for Node.
  - Rationale: Deterministic tool interface, schema alignment, easier VS Code integration.
  - Alternatives: Custom protocol wiring (more work, harder to test), Python SDK (team prefers TS).

- **Validation (Ajv)**
  - Decision: Use `ajv` for JSON Schema validation.
  - Rationale: Mature, fast, good error mapping; supports strict schemas.
  - Alternatives: `zod` (DX-friendly but not pure JSON Schema), custom validators (non-standard).

- **Logging (Pino)**
  - Decision: Use `pino` for structured logs.
  - Rationale: JSON logs, low overhead, supports correlation IDs and timing metrics.
  - Alternatives: `winston` (heavier), console logs (insufficient observability).

- **Workspace Config Path**
  - Decision: `.council/personas.json` in workspace root.
  - Rationale: Transparent, local-only, no secrets; aligns with data minimization.
  - Alternatives: VS Code settings (user-level, less transparent for workspaces), session-only (accepted earlier for conversations; overrides persist per workspace).

- **Golden Tests Scope**
  - Decision: Golden persona-output tests for all six personas.
  - Rationale: Ensures tone/structure consistency and challenge/assumption checks.
  - Alternatives: Spot checks (risk of drift), fully dynamic outputs (hard to test).

## Patterns & Best Practices

- **Persona Contracts**: Define `Soul`, `Focus`, `Constraints`, and allowed actions per tool. If not explicitly allowed, treat as disallowed.
- **No Silent Collusion**: Each persona must include at least one challenge/assumption check; Devil’s Advocate always surfaces counterpoints.
- **Depth Scaling**: Brief 2–3, Standard 5–7, Deep 10+ across summary, advice, and next_steps.
- **Discoverability**: Support standard MCP discovery and explicit chat prefixes (e.g., /council.consult) consistently documented.
- **Security/Privacy**: No conversation persistence; workspace config stores persona contract overrides only; no secrets.
- **Observability**: Emit correlation IDs, start/end timings, and failure categories.

## Open Questions

- None. All prior NEEDS CLARIFICATION items addressed in Clarifications.
