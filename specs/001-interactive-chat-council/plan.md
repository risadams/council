# Implementation Plan: Interactive Council Chat

**Branch**: `001-interactive-chat-council` | **Date**: 2026-02-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-interactive-chat-council/spec.md`

## Summary

Enable interactive multi-turn council conversations in the VS Code chat window with three core capabilities:

1. **Clarification-driven assistance**: The system detects ambiguous requests and asks focused questions one-at-a-time before delivering a final answer; users can skip questions or revisit them to refine responses.
2. **Council-to-council discussion**: When multiple personas contribute, their debate is shown before the final consolidated answer, building transparency and trust.
3. **Smart persona selection**: The system dynamically selects relevant personas by request type, or users can explicitly request specific personas by name.

Technical approach: Extend the existing council.consult tool with an interactive session orchestrator that manages multi-turn flows (clarification → debate → final answer), enforces debate cycle limits (default 10, admin-configurable), and tracks session context across exchanges.

## Technical Context

**Language/Version**: TypeScript/JavaScript (Node.js 18+) - aligns with existing server codebase  
**Primary Dependencies**: VS Code Chat API (existing), council personas framework (existing), LLM inference (existing council.consult)  
**Storage**: Session-based in-memory; no persistent data layer required (chat history managed by VS Code)  
**Testing**: vitest (existing test framework) + integration tests for multi-turn flows  
**Target Platform**: VS Code extension (chat window); server-side orchestration via existing MCP server  
**Project Type**: Extension enhancement (server-side TypeScript)  
**Performance Goals**: <2s for question presentation; <5s for debate cycles; sub-30s for full session (user story success metric: 90% <5 min)  
**Constraints**: Max 10 debate cycles default (configurable); max 3 clarification rounds per request; single session per user request  
**Scale/Scope**: Per-session (single user request); no scaling issues anticipated for alpha/beta phases

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Persona-first UX**: ✅ PASS
- Council discussion explicitly attributes each message to a persona with rationale.
- Clarification questions tagged with which personas are asking and why.
- Final answer consolidation shows persona consensus/tradeoff resolution.

**Tool scope**: ✅ PASS
- New tool: `council.discuss` (interactive session orchestrator) - single responsibility: manage multi-turn exchanges.
- Reuses existing `council.consult` and persona contracts; no breaking changes.
- Input/output schemas versioned (v1 for Phase 1).

**Determinism**: ✅ PASS
- Persona selection logic is deterministic (based on request classification).
- Clarification question ordering deterministic (sequential, first-to-last).
- Debate cycle limit enforced deterministically; nondeterminism (LLM generation) explicitly disclosed in session metadata.

**Performance**: ✅ PASS
- Progressive results: questions streamed one-at-a-time; debate shown incrementally; final answer after discussion complete.
- User story targets <5 min for full session.

**Idempotency**: ✅ PASS
- User can "restart" clarification at any point (re-ask skipped questions).
- Session state is fully replayed if needed (no side effects beyond session context).

**Observability**: ✅ PASS
- Structured logs for each session turn: session ID, persona acting, cycle count, question/answer pairs.
- Timing tracked per phase (clarification, debate, final answer).

**Security**: ✅ PASS
- Data minimization: no external API calls; only internal persona inference.
- No secrets logged; session context scoped to single request.
- Timeouts: debate cycles bounded; user input parsed safely (no code execution).

**Testing**: ✅ PASS
- Unit: clarification detection, question sequencing, cycle counting, persona selection logic.
- Integration: end-to-end session flows (e.g., ambiguous request → 2 questions → debate → final answer).
- Golden tests: verify persona-specific tone/framing in discussion and final answers (e.g., "Senior Developer suggests..." vs "Security Expert flags...").

**Documentation**: ✅ PASS
- Tool spec: council.discuss example calls, failure modes, latency (fast/medium for questions, medium for debate).
- Quickstart: example sessions for P1, P2, P3 user stories.
- Persona matrix: which personas participate in which request types.

**PR checklist**: ✅ PASS
- All tests required (unit + integration + golden).
- Schema versioning from day 1 (v1).
- Rollback: feature flag to disable interactive mode (fallback to existing council.consult).

---

**Gate Status: PASS - No violations. Proceed to Phase 0.**

---

## Phase 1 Constitution Check (Post-Design Re-evaluation)

*After data-model.md, contracts, and quickstart are complete*

All Phase 0 gates remain satisfied. Design confirms:

✅ **Persona-first UX**
- data-model.md: MessageTurn explicitly attributes sender and senderType
- data-model.md: CouncilDiscussion tracks which personas contributed
- OpenAPI: ConsultResponse includes persona selections and debate exchange objects
- quickstart.md: Examples show "Senior Developer:", "Security Expert:" attribution
- finalAnswer includes consensus and attribution

✅ **Tool scope (single responsibility)**
- New tool: `council.discuss` (orchestrates multi-turn flow)
- Reuses existing council.consult and persona contracts (no breaking changes)
- Input/output schemas versioned (v1 in council-discuss-v1.openapi.json)

✅ **Determinism**
- data-model.md: Persona selection logic is deterministic (request classification → persona filtering)
- Clarification sequencing deterministic (round → sequence in round)
- Debate cycle count deterministic; cycle limit enforced server-side
- LLM nondeterminism (generation) explicitly disclosed in SessionState.metadata

✅ **Progressive results**
- Clarification questions streamed one-at-a-time (FR-004)
- Debate exchanges shown incrementally (CouncilDiscussion.exchangeStarts/Ends)
- Final answer after discussion (FR-015)

✅ **Idempotency**
- Session state fully replayed from messageTurns array
- User can revisit skipped questions (FR-009) → regenerate response
- No side effects beyond session context

✅ **Observability**
- data-model.md: SessionState includes metadata (correlationId, timing, feature flags)
- MessageTurn tracks timing, sequence, sender
- ConversationSession tracks clarificationRounds, debateCycles, status transitions

✅ **Security**
- No external API calls (only internal persona inference)
- No secrets logged (session context scoped to request)
- Timeouts: debate cycles bounded (10 default, configurable); user input parsing safe
- Data minimization: session expires when chat window closes

✅ **Testing Strategy**
- Unit: clarification detection, question sequencing, cycle counting, persona selection
- Integration: end-to-end flows (ambiguous → clarifications → debate → answer)
- Golden: verify persona tone/framing in discussion and consolidation
- quickstart.md includes "Testing Scenarios" section

✅ **Documentation**
- council-discuss-v1.openapi.json: complete tool spec, failure modes, latency notes
- data-model.md: 8 entities with relationships, validation rules, state transitions
- quickstart.md: example sessions for each user story, API usage, persona behaviors
- Implementation checklist included

✅ **PR Checklist Readiness**
- Tests specified (unit + integration + golden)
- Schema versioned (v1)
- Rollback via feature flag documented
- No breaking persona contracts

---

**Phase 1 Gate Status: PASS - Design confirmed, ready for Phase 2 (implementation planning via /speckit.tasks)**

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
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
