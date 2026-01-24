# Feature Specification: Clarity Council MCP Tool Suite (VS Code)

**Feature Branch**: `001-clarity-council-mcp`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: Build a VS Code MCP server and tool suite implementing Clarity Council personas (Growth Strategist, Financial Officer, Devil’s Advocate, Ops Architect, Customer Advocate, Culture Lead) with strict JSON schemas, clear persona contracts, and docs/tests for confident iteration.

## Clarifications

### Session 2026-01-21
- Q: Should overrides persist per workspace or session-only? → A: Workspace-level persistence in a local config file
- Q: Should tool discovery rely on MCP listing or prefixes? → A: Support both standard MCP discovery and explicit chat prefixes
- Q: Confirm output depth ranges? → A: Brief 2–3, Standard 5–7, Deep 10+

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently

  If persona output tone/format is material to value, include references to
  golden-output tests and VS Code request/response interaction patterns.
-->

### User Story 1 - Council Consultation and Synthesis (Priority: P1)

A user invokes `council.consult` in VS Code chat to receive structured, persona-specific advice plus a merged "council synthesis" highlighting agreements, disagreements, risks, and tradeoffs. Output includes persona name, summary, advice, assumptions, questions, next_steps, and confidence.

**Why this priority**: This delivers the core value—multi-perspective guidance that is actionable and transparent, with explicit challenge mechanisms to avoid silent collusion.

**Independent Test**: Can be fully tested by calling `council.consult` with a single prompt; verify schema validity, persona distinction, Devil’s Advocate counterpoints, and synthesis conflict listing without requiring any other feature.

**Acceptance Scenarios**:

1. **Given** a valid problem, context, desired outcome, and constraints, **When** the user calls `council.consult` with default depth, **Then** the tool returns per-persona responses that are distinct in focus/tone and a synthesis that lists agreements and conflicts, with ordered next_steps.
2. **Given** selected_personas specifies a subset, **When** the user calls `council.consult`, **Then** only those personas respond, Devil’s Advocate still provides counterpoints, and synthesis is computed over that subset.
3. **Given** constraints include a budget or timeline, **When** responses are generated, **Then** each persona’s advice explicitly references constraints and any tradeoffs.

---

### User Story 2 - Single Persona Consultation (Priority: P2)

A user invokes `persona.consult` to get structured guidance from a single persona adhering to its contract (Soul, Focus, Constraints) with the same output schema.

**Why this priority**: Enables targeted deep-dives and faster iteration when one perspective is desired.

**Independent Test**: Can be fully tested by calling `persona.consult` with a prompt; verify schema validity, persona contract adherence, and tone/structure consistency.

**Acceptance Scenarios**:

1. **Given** persona_name is valid, **When** the user calls `persona.consult`, **Then** the output includes required fields and aligns with the persona’s Soul/Focus/Constraints.
2. **Given** persona_name is invalid, **When** the user calls `persona.consult`, **Then** the tool returns a validation error with actionable guidance to list available personas.

---

### User Story 3 - Persona Transparency and Overrides (Priority: P3)

A user invokes `council.define_personas` to view current persona contracts (Soul, Focus, Constraints) and optionally provide runtime overrides to tune behavior.

**Why this priority**: Makes behavior transparent and testable; supports controlled customization.

**Independent Test**: Can be fully tested by calling `council.define_personas`; verify contracts are returned and overrides update subsequent consult outputs within the current session.

**Acceptance Scenarios**:

1. **Given** no overrides, **When** the user calls `council.define_personas`, **Then** the response returns all persona contracts and a permission matrix.
2. **Given** overrides for one persona’s Constraints, **When** `council.consult` is invoked afterwards, **Then** that persona’s response reflects updated Constraints and others remain unchanged.
3. **Given** overrides include disallowed actions, **When** applied, **Then** the tool validates and rejects with clear error and alternatives.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Missing or malformed fields (e.g., empty `user_problem`, invalid `depth`).
- Unknown `persona_name` or empty `selected_personas` list.
- Conflicting constraints (e.g., "launch tomorrow" and "no risk" if infeasible).
- Overly broad context: system returns clarifying questions and a minimal actionable plan.
- Persona overrides that attempt to permit disallowed actions: validation error.
- Disagreement detection: synthesis surfaces conflicting recommendations explicitly.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: Provide an MCP server usable in VS Code chat that exposes tools `council.consult`, `persona.consult`, and `council.define_personas`.
- **FR-002**: Each tool MUST validate inputs against strict JSON schemas and return structured outputs with fields: persona, summary, advice, assumptions, questions, next_steps, confidence.
- **FR-003**: Devil’s Advocate MUST always include explicit counterpoints and surface risks/tradeoffs relevant to constraints.
- **FR-004**: `council.consult` MUST produce distinct persona outputs and a synthesis that lists agreements, conflicts, and ordered next_steps.
- **FR-005**: Tools MUST document and enforce safe defaults; nondeterminism (e.g., time sensitivity) MUST be explicit in outputs when present.
- **FR-006**: `council.define_personas` MUST return the current persona contracts and accept runtime overrides with validation (no disallowed actions).
- **FR-007**: Tools MUST avoid network access unless explicitly enabled and documented in the tool description; fail closed on ambiguous permissions.
- **FR-008**: Tools MUST not persist user conversations beyond the current request; persona overrides persist per workspace in a local config file. Only persona contract fields (Soul/Focus/Constraints, allowed actions) may be stored; no secrets or user conversation content. The storage path and format MUST be documented.
- **FR-009**: Outputs MUST include at least one challenge/assumption-check per persona to reduce silent collusion; synthesis MUST explicitly list conflicts.
- **FR-010**: Discoverability in VS Code: tools MUST be listable and callable from chat and tool palettes; support both standard MCP discovery and explicit chat prefixes (e.g., /council.consult). Prefixes MUST be documented and consistent across tools; example prompts MUST be provided in docs.
- **FR-011**: Depth parameter (brief/standard/deep) MUST scale output detail: brief (2–3 bullets), standard (5–7 bullets), deep (10+ bullets) across summary, advice, and next_steps.

### Key Entities *(include if feature involves data)*

- **PersonaContract**: Name, Soul (background/expertise), Focus (priorities), Constraints (disallowed actions, challenge rules), Allowed actions/tools.
- **ToolInput**: For `council.consult`: user_problem, context, desired_outcome, constraints, selected_personas (optional), depth. For `persona.consult`: persona_name + same fields. For `council.define_personas`: optional overrides.
- **ToolResponse**: Fields: persona, summary, advice, assumptions, questions, next_steps, confidence; error shape with validation details when applicable.
- **CouncilSynthesis**: Aggregated agreements, conflicts, risks/tradeoffs, consolidated next_steps, notes on nondeterminism.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 95% of `persona.consult` and `council.consult` calls return valid structured outputs (schema-compliant) on first attempt.
- **SC-002**: 90% of `council.consult` responses include at least one explicit conflict/tradeoff surfaced across personas.
- **SC-003**: Users can invoke any tool from VS Code and get actionable next_steps within 3 minutes end-to-end.
- **SC-004**: Documentation enables a new developer to set up and run locally in under 10 minutes following the README.
- **SC-005**: Golden tests confirm persona tone/structure consistency and presence of challenge/assumption checks in 95% of tested prompts.

## Assumptions

- Default depth is `standard` if not specified.
- `council.consult` defaults to all personas when `selected_personas` is omitted.
- Persona overrides persist per workspace in a local config file; session behavior may temporarily override in-memory state but MUST reconcile with workspace config on next run.
- Tool discovery leverages standard MCP tool listing in VS Code; example prompts will be provided in docs.
- Prefix-based invocation is also supported and MUST be documented consistently across tools.
