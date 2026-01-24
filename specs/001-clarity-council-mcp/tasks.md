---

description: "Task list for Clarity Council MCP Tool Suite"
---

# Tasks: Clarity Council MCP Tool Suite (VS Code)

**Input**: Design documents from `/specs/001-clarity-council-mcp/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Per constitution, tests are REQUIRED for new/changed behavior. Include unit, integration, and (when tone/format matters) golden persona-output tests unless explicitly waived.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create `server/` project folder with initial layout
- [X] T002 [P] Create `server/src/index.ts` MCP server bootstrap scaffold
- [X] T003 [P] Create `server/src/tools/` directory
- [X] T004 [P] Create `server/src/personas/` directory
- [X] T005 [P] Create `server/src/schemas/` directory (copy baseline from `specs/001-clarity-council-mcp/contracts/`)
- [X] T006 [P] Create `server/src/utils/` directory
- [X] T007 Initialize `server/package.json` with scripts (`build`, `start`, `test`) and dependencies
- [X] T008 Create `server/tsconfig.json` aligned with TypeScript 5.x and Node 20 targets

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Implement JSON Schema loader in `server/src/utils/schemaLoader.ts` (uses `ajv`)
- [X] T010 [P] Setup structured logging with correlation IDs in `server/src/utils/logger.ts` (uses `pino`)
- [X] T011 [P] Implement validation helpers in `server/src/utils/validation.ts` (wrap `ajv` compile/validate)
- [X] T012 Implement error mapping (validation/permission/internal) in `server/src/utils/errors.ts`
- [X] T013 [P] Implement depth scaling utility in `server/src/utils/depth.ts` (brief 2–3, standard 5–7, deep 10+)
- [X] T014 Implement workspace config manager in `server/src/utils/workspaceConfig.ts` (path: `.council/personas.json`)
- [X] T015 [P] Copy/align input/output schemas to `server/src/schemas/` (from `specs/001-clarity-council-mcp/contracts/`)
- [X] T016 Implement persona contracts registry in `server/src/personas/contracts.ts` per `data-model.md`
- [X] T017 [P] Create Devil’s Advocate constraints and counterpoint rules in `server/src/personas/devilsAdvocate.ts`
- [X] T018 Implement MCP server boot in `server/src/index.ts` (register tools, logging, lifecycle)
- [X] T019 [P] Add README scaffold in `docs/README.md` referencing quickstart and persona matrix
- [X] T020 Configure project tasks: `tests/` folders (`unit`, `integration`, `golden`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Council Consultation and Synthesis (Priority: P1) 🎯 MVP

**Goal**: `council.consult` returns distinct persona outputs and a synthesis (agreements, conflicts, risks/tradeoffs, ordered next_steps)

**Independent Test**: Call `council.consult` with a single prompt; verify schema validity, persona distinction, Devil’s Advocate counterpoints, and synthesis conflict listing.

### Tests for User Story 1


- [X] T021 [P] [US1] Unit: Validate `council.consult` input schema in `tests/unit/council.input.spec.ts`
- [X] T022 [P] [US1] Unit: Validate `council.consult` output schema in `tests/unit/council.output.spec.ts`
- [X] T023 [P] [US1] Integration: MCP request/response roundtrip in `tests/integration/council.consult.spec.ts`
- [X] T024 [P] [US1] Golden: Distinct persona tone/structure & Devil’s Advocate counterpoints in `tests/golden/council.personas.spec.ts`

### Implementation for User Story 1

- [X] T025 [P] [US1] Implement `server/src/tools/council.consult.ts` input parsing and validation
- [X] T026 [P] [US1] Implement persona response formatter in `server/src/utils/personaFormatter.ts`
- [X] T027 [US1] Implement persona generators in `server/src/personas/generators.ts` (Soul/Focus/Constraints aware)
- [X] T028 [US1] Implement Devil’s Advocate response generator in `server/src/personas/devilsAdvocate.ts` (counterpoints/risks)
- [X] T029 [US1] Implement synthesis builder in `server/src/utils/synthesis.ts` (agreements/conflicts/risks_tradeoffs/next_steps)
- [X] T030 [US1] Wire depth scaling across summary/advice/next_steps in `server/src/utils/depth.ts`
- [X] T031 [US1] Add confidence calculation with rationale in `server/src/utils/confidence.ts`
- [X] T032 [US1] Register tool with MCP and logging hooks in `server/src/index.ts`

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Single Persona Consultation (Priority: P2)

**Goal**: `persona.consult` returns contract-aligned guidance for one persona using the same schema

**Independent Test**: Call `persona.consult` with a prompt; verify schema validity, persona contract adherence, and tone/structure consistency.

### Tests for User Story 2

- [X] T033 [P] [US2] Unit: Validate `persona.consult` input schema in `tests/unit/persona.input.spec.ts`
- [X] T034 [P] [US2] Unit: Validate `persona.consult` output schema in `tests/unit/persona.output.spec.ts`
- [X] T035 [P] [US2] Integration: MCP request/response flow in `tests/integration/persona.consult.spec.ts`
- [X] T036 [P] [US2] Golden: Persona tone/structure alignment in `tests/golden/persona.tone.spec.ts`

### Implementation for User Story 2

- [X] T037 [P] [US2] Implement `server/src/tools/persona.consult.ts` input parsing and validation
- [X] T038 [US2] Implement single-persona response generator in `server/src/personas/generators.ts`
- [X] T039 [US2] Add invalid `persona_name` error handling in `server/src/utils/errors.ts`
- [X] T040 [US2] Wire depth scaling & confidence into persona path in `server/src/utils/depth.ts` and `confidence.ts`
- [X] T041 [US2] Register tool with MCP and logging hooks in `server/src/index.ts`
- [X] T042 [US2] Update docs with explicit chat prefixes for `persona.consult` in `docs/README.md`

**Checkpoint**: User Story 2 fully functional and independently testable

---

## Phase 5: User Story 3 - Persona Transparency and Overrides (Priority: P3)

**Goal**: `council.define_personas` exposes contracts and supports validated workspace-level overrides

**Independent Test**: Call `council.define_personas`; verify contracts return; overrides update subsequent consult outputs within the workspace session; invalid overrides rejected.

### Tests for User Story 3

- [X] T043 [P] [US3] Unit: Validate `council.define_personas` input schema in `tests/unit/define.input.spec.ts`
- [X] T044 [P] [US3] Unit: Validate `council.define_personas` output schema in `tests/unit/define.output.spec.ts`
- [X] T045 [P] [US3] Integration: Overrides applied via workspace config in `tests/integration/overrides.spec.ts`
- [X] T046 [P] [US3] Golden: Transparency and permission matrix outputs in `tests/golden/persona.contracts.spec.ts`

### Implementation for User Story 3

- [X] T047 [P] [US3] Implement `server/src/tools/council.define_personas.ts` input parsing and validation
- [X] T048 [US3] Implement overrides application in `server/src/utils/workspaceConfig.ts` (validate allowed fields only)
- [X] T049 [US3] Return current contracts + permission matrix in `server/src/personas/contracts.ts`
- [X] T050 [US3] Register tool with MCP and logging hooks in `server/src/index.ts`
- [X] T051 [US3] Update docs: persona matrix and override policy in `docs/README.md`
- [X] T052 [US3] Add example overrides file: `.council/personas.json.example` at repo root

**Checkpoint**: All user stories independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T053 [P] Documentation updates in `docs/README.md` (examples, prefixes, synthesis conflicts)
- [X] T054 Code cleanup and refactoring across `server/src/`
- [X] T055 Performance tuning for depth `deep` outputs (progressive status messaging)
- [X] T056 [P] Additional unit tests in `tests/unit/` (error mapping, edge cases)
- [X] T057 Security hardening (no secrets; validate overrides strictly)
- [X] T058 Observability: add timing metrics and failure categories in logs
- [X] T059 [P] Quickstart validation against README and scripts in `specs/001-clarity-council-mcp/quickstart.md`
- [X] T060 Release prep: example prompts and tool discovery notes in `docs/README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1; may reuse utilities
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent; leverages workspace config utilities

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Generators before synthesis
- Utilities before tool registration
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational completes, all user stories can start in parallel (team-dependent)
- Tests for a story marked [P] can run in parallel
- Generators/formatters within a story marked [P] can run in parallel

---

## Parallel Examples

### User Story 1

Tasks that can run in parallel:
- T021, T022, T023, T024 (tests)
- T025, T026 (tool + formatter)

### User Story 2

Tasks that can run in parallel:
- T033, T034, T035, T036 (tests)
- T037 (tool) with T039 (error handling)

### User Story 3

Tasks that can run in parallel:
- T043, T044, T045, T046 (tests)
- T047 (tool) with T049 (contracts) and T052 (example file)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. STOP and VALIDATE: Test US1 independently (unit, integration, golden)
5. Demo in VS Code and iterate

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Demo (MVP)
3. Add US2 → Test independently → Demo
4. Add US3 → Test independently → Demo

### Parallel Team Strategy

With multiple developers:
- Team completes Setup + Foundational together
- After Foundational:
  - Developer A: US1
  - Developer B: US2
  - Developer C: US3
- Stories complete and integrate independently
