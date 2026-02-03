---

description: "Task list for Interactive Council Chat implementation"
---

# Tasks: Interactive Council Chat

**Input**: Design documents from `/specs/001-interactive-chat-council/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, quickstart.md

**Tests**: Per constitution, tests are REQUIRED for new/changed behavior. Include unit, integration, and golden persona-output tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and integration points

- [x] T001 Add feature flag for interactive mode in server/src/config.ts
- [x] T002 [P] Add admin config for debate cycle limits in server/src/config.ts
- [x] T003 [P] Register new MCP tool definition in servers/clarity-council/tools.json
- [x] T004 [P] Add tool schema files for council.discuss in server/src/schemas/
- [x] T005 [P] Add TypeScript types for session entities in server/src/types/session.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core session orchestration and shared services required by all stories

- [x] T006 Create ConversationSession state manager in server/src/services/sessionManager.ts
- [x] T007 Create ClarificationQuestion/Answer models in server/src/models/clarification.ts
- [x] T008 Create CouncilDiscussion models in server/src/models/discussion.ts
- [x] T009 Implement persona selection logic in server/src/services/personaSelector.ts
- [x] T010 Implement debate cycle limiter in server/src/services/debateLimiter.ts
- [x] T011 Add session persistence (in-memory store) in server/src/services/sessionStore.ts
- [x] T012 Add observability logging helpers in server/src/utils/sessionLogger.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Clarification-driven assistance (Priority: P1) 🎯 MVP

**Goal**: Ask sequential clarifying questions for ambiguous requests and generate a final answer incorporating user responses.

**Independent Test**: Submit an ambiguous request; verify sequential questions, final answer reflects user inputs; clear requests bypass clarification.

### Tests for User Story 1

- [x] T013 [P] [US1] Contract test for /council/consult/interactive in tests/integration/council.discuss.spec.ts
- [x] T014 [P] [US1] Unit tests for ambiguity detection in tests/unit/clarification-detection.spec.ts
- [x] T015 [P] [US1] Unit tests for question sequencing in tests/unit/clarification-sequencing.spec.ts
- [x] T016 [P] [US1] Integration test for clarification flow in tests/integration/clarification-flow.spec.ts
- [x] T017 [P] [US1] Golden persona output test for clarification prompts in tests/golden/clarification-prompts.spec.ts

### Implementation for User Story 1

- [x] T018 [US1] Implement ambiguity detection in server/src/services/ambiguityDetector.ts
- [x] T019 [US1] Implement sequential question delivery in server/src/services/clarificationOrchestrator.ts
- [x] T020 [US1] Add skip-question handling in server/src/services/clarificationOrchestrator.ts
- [x] T021 [US1] Wire clarification flow into tool handler in server/src/tools/council.discuss.ts
- [x] T022 [US1] Update tool schemas with clarification response objects in server/src/schemas/

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Council-to-council discussion (Priority: P2)

**Goal**: Show persona discussion before final answer, including tradeoffs and resolution.

**Independent Test**: Submit a request with competing constraints; verify persona exchange is shown before final response and includes tradeoff summary.

### Tests for User Story 2

- [x] T023 [P] [US2] Unit tests for persona selection filtering in tests/unit/persona-selection.spec.ts
- [x] T024 [P] [US2] Unit tests for debate cycle counting in tests/unit/debate-cycle.spec.ts
- [x] T025 [P] [US2] Integration test for council discussion flow in tests/integration/council-discussion.spec.ts
- [x] T026 [P] [US2] Golden persona output test for debate exchanges in tests/golden/debate-exchanges.spec.ts

### Implementation for User Story 2

- [x] T027 [US2] Implement council discussion orchestrator in server/src/services/discussionOrchestrator.ts
- [x] T028 [US2] Enforce debate cycle limits in server/src/services/debateLimiter.ts
- [x] T029 [US2] Add debate exchange rendering to tool response in server/src/tools/council.discuss.ts
- [x] T030 [US2] Ensure persona attribution in discussion output in server/src/tools/council.discuss.ts

**Checkpoint**: User Story 2 functional and testable independently

---

## Phase 5: User Story 3 - User control of clarification flow (Priority: P3)

**Goal**: Allow users to skip, defer, or revisit clarification questions; support extended debate requests.

**Independent Test**: User skips questions and receives assumption-stated answer; user revisits skipped question and response is regenerated; extended debate requests increase cycle limit.

### Tests for User Story 3

- [x] T031 [P] [US3] Unit tests for skip/defer handling in tests/unit/clarification-skip.spec.ts
- [x] T032 [P] [US3] Unit tests for revisit skipped questions in tests/unit/clarification-revisit.spec.ts
- [x] T033 [P] [US3] Integration test for extended debate mode in tests/integration/extended-debate.spec.ts
- [x] T034 [P] [US3] Golden test for assumption statements in tests/golden/assumption-statements.spec.ts

### Implementation for User Story 3

- [x] T035 [US3] Implement assumption recording in server/src/services/assumptionManager.ts
- [x] T036 [US3] Add revisit-skipped-question flow in server/src/services/clarificationOrchestrator.ts
- [x] T037 [US3] Add extended debate flag handling in server/src/services/discussionOrchestrator.ts
- [x] T038 [US3] Add user control toggles in tool input schema in server/src/schemas/

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality, documentation, and operational hardening

- [x] T039 [P] Update docs and tool examples in docs/usage.md
- [x] T040 [P] Add performance instrumentation in server/src/utils/sessionLogger.ts
- [x] T041 Add error mapping and user-facing error messages in server/src/utils/errors.ts
- [x] T042 [P] Expand integration test coverage in tests/integration/session-recovery.spec.ts
- [x] T043 Run quickstart.md validation checklist in specs/001-interactive-chat-council/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion; can proceed in parallel
- **Polish (Phase 6)**: Depends on user stories completion

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational; no dependencies on other stories
- **US2 (P2)**: Can start after Foundational; uses persona selection and session manager
- **US3 (P3)**: Can start after Foundational; depends on clarification orchestrator from US1

### Dependency Graph

```
Setup → Foundational → US1
                    → US2
                    → US3 (depends on US1 clarification orchestrator)
US1 + US2 + US3 → Polish
```

### Parallel Execution Examples

**US1 Parallel Tasks**
- T013, T014, T015, T016, T017 can run in parallel (tests)
- T018, T019, T020 can run in parallel (implementation modules)

**US2 Parallel Tasks**
- T023, T024, T025, T026 can run in parallel
- T027, T028 can run in parallel

**US3 Parallel Tasks**
- T031, T032, T033, T034 can run in parallel
- T035, T036, T037 can run in parallel

---

## Implementation Strategy

**MVP Scope**: User Story 1 only (clarification-driven assistance). Deliver sequential questions, skip handling, and final answer with incorporated clarifications.

**Incremental Delivery**:
1. **Phase 1-2**: Setup + Foundational session orchestration
2. **Phase 3 (US1)**: Clarification-driven assistance MVP
3. **Phase 4 (US2)**: Council-to-council debate visibility
4. **Phase 5 (US3)**: User control for skip/revisit and extended debate
5. **Phase 6**: Polish, performance, documentation, and additional tests
