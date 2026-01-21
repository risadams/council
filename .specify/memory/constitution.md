<!--
Sync Impact Report
- Version change: unset → 1.0.0
- Modified principles: N/A (initial adoption)
- Added sections: Persona Contract; MCP Tool Design Standards; Security/Privacy; Quality Gates; Accessibility & Clarity; Performance Budgets; Versioning & Compatibility; No Weird Stuff
- Removed sections: Template placeholder for Principle 5
- Templates requiring updates:
	- ✅ Updated: .specify/templates/plan-template.md (Constitution Check gates)
	- ✅ Updated: .specify/templates/spec-template.md (testing and persona golden outputs advisory)
	- ✅ Updated: .specify/templates/tasks-template.md (tests required note)
	- ⚠ Pending: .specify/templates/commands/*.md (folder not present)
- Deferred TODOs:
	- TODO(RATIFICATION_DATE): original adoption date unknown; requires project owner input
-->

# Persona-Driven MCP Tool Suite (VS Code) Constitution

## Core Principles

### Persona-first UX
- Outputs MUST clearly identify which persona is acting and why.
- Persona behavior MUST be consistent across tools (tone, detail level,
	defaults, refusal patterns).
- Outputs MUST be actionable (next steps, commands, or clear options),
	traceable (inputs and assumptions explicit), and degrade gracefully under
	failure with calm, useful responses.

### Tools are sharp knives, not kitchen sinks
- Each MCP tool MUST do one job well.
- Prefer multiple small tools over one mega-tool when scope expands.
- Tool input/output schemas MUST be stable and versioned.

### Determinism over surprises
- Tools MUST behave predictably given identical inputs.
- Where nondeterminism exists (e.g., network, time), tools MUST make it
	explicit in outputs (flags, notes, or fields) and use documented, safe
	defaults.

### “Fast enough” is a feature
- Optimize for responsiveness in chat-driven workflows.
- Provide progressive results when feasible (quick summary first, then details).

## Persona Contract (required for every persona)

Define and keep current for each persona:

- Name, Purpose, Primary user outcomes
- Allowed actions: which MCP tools it may call; what it can read/write (workspace,
	settings, external APIs)
- Disallowed actions: sensitive operations it MUST NOT perform
- Communication style: brevity vs depth defaults; tone constraints; how it
	handles uncertainty
- Decision rules: how tradeoffs are prioritized (speed vs correctness, etc.)
- Failure behavior: handling when dependencies fail; what is logged vs surfaced
	to the user

Rule: If a behavior is not explicitly allowed in the persona contract, it is
treated as disallowed.

## MCP Tool Design Standards (VS Code) and Operational Policies

### 4.1 Tool interface requirements
- Every tool MUST publish: a clear verb–object name; precise description of
	what it does and does not do; strict input/output schemas.
- Outputs MUST be machine-checkable (structured fields) with optional
	human-readable summaries, and MUST be explicit about side effects
	(what changed).

### 4.2 Idempotency & side effects
- Prefer idempotent operations.
- For write operations: provide a dry-run mode when feasible; summarize changes
	before applying; return a diff or change summary after applying.

### 4.3 Observability
- Tools MUST emit structured logs suitable for debugging:
	correlation IDs per request; timing (start/end); failure categories
	(validation, network, permission, internal).

### Security, privacy, and data handling
- Data minimization: collect/process only the minimum needed to fulfill
	the request; do not persist user content unless explicitly required and
	documented.
- Secrets hygiene: NEVER log secrets; NEVER echo tokens/keys in tool output;
	prefer environment-based configuration for credentials.
- External calls: any network call MUST be explicit in tool description,
	timeout-bounded, retry-bounded with backoff, and fail closed for ambiguous
	permission states.

### Quality gates (tests, docs, and reviews)
- Testing strategy (required):
	- Unit tests for input validation, core logic, and error mapping
		(what the user sees).
	- Integration tests for MCP server/tool boundaries and VS Code interaction
		patterns (request/response).
	- Golden tests for persona outputs when tone/format matters.
- Documentation (required):
	- Each tool: example calls and outputs, failure modes, expected latency class
		(fast/medium/slow).
	- Each persona: a one-page “how it behaves” reference and a
		tool-permission matrix.
- PR acceptance checklist:
	- Tests for new/changed behavior.
	- Updated docs (tool + persona).
	- No breaking schema changes without versioning.
	- Clear rollback path for risky changes.

### Accessibility & clarity (chat UX)
- Prefer plain language, short paragraphs, and structured lists.
- Avoid jargon unless defined.
- If the user is blocked, provide: what happened; 2–3 options for next steps;
	what specific information is needed from the user.

### Performance budgets (baseline expectations)
- “Fast path” tools SHOULD respond within a couple seconds where possible.
- Tools that may exceed this MUST indicate that they may take time and MUST
	offer progressive output or a clear status update pattern.

### Versioning and compatibility
- Tool schemas MUST be versioned.
- Breaking changes REQUIRE a new tool version or new tool name and migration
	notes.
- Maintain backward compatibility for at least one minor release cycle unless
	explicitly waived in the spec.

### The “No Weird Stuff” rule (pragmatic sanity)
- Prefer boring, readable code with sharp interfaces over clever solutions that
	are hard to debug at 2:00 AM.

## Governance

### Hierarchy of constraints
Conflicts are resolved in this order:
1. User intent in the current request
2. Persona contract (capabilities and limitations)
3. Repository architecture constraints and security rules
4. Performance and developer experience

### Change control for personas
- Persona definitions are treated like an API.
- Any persona change MUST include: updated persona contract documentation;
	updated tests (golden outputs or behavior tests); a migration note explaining
	what changed and why.

### Spec-kit workflow alignment
- This constitution is the source of truth for decisions during
	specification, planning, and implementation phases.
- If implementation reveals a missing rule, update this constitution first,
	then continue.

### Amendment procedure, versioning policy, and compliance review
- Amendments: propose changes via PR; document rationale and migration notes;
	update version per semantic rules; ratify on merge; record LAST_AMENDED_DATE.
- Versioning: follow semantic versioning—MAJOR for incompatible governance/
	principle removals or redefinitions; MINOR for new principles/sections or
	materially expanded guidance; PATCH for clarifications/typos/non-semantic
	refinements.
- Compliance reviews: PRs MUST verify constitution compliance, include tests for
	changed behavior, update docs, avoid breaking schema changes without
	versioning, and provide a clear rollback path for risky changes.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-01-21
# [PROJECT_NAME] Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### [PRINCIPLE_1_NAME]
<!-- Example: I. Library-First -->
[PRINCIPLE_1_DESCRIPTION]
<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->

### [PRINCIPLE_2_NAME]
<!-- Example: II. CLI Interface -->
[PRINCIPLE_2_DESCRIPTION]
<!-- Example: Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats -->

### [PRINCIPLE_3_NAME]
<!-- Example: III. Test-First (NON-NEGOTIABLE) -->
[PRINCIPLE_3_DESCRIPTION]
<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### [PRINCIPLE_4_NAME]
<!-- Example: IV. Integration Testing -->
[PRINCIPLE_4_DESCRIPTION]
<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

### [PRINCIPLE_5_NAME]
<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->
[PRINCIPLE_5_DESCRIPTION]
<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## [SECTION_2_NAME]
<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

[SECTION_2_CONTENT]
<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## [SECTION_3_NAME]
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

[GOVERNANCE_RULES]
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
