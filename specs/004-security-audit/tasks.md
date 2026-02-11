# Tasks: 004-Security-Audit

**Input**: Design documents from `/specs/004-security-audit/`
**Prerequisites**: plan.md, spec.md, quickstart.md (available), data-model.md (not present), research.md (not present), contracts/ (empty)

**Tests**: No new tests requested. Use existing `npm test` suite for verification per spec.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic audit structure

- [x] T001 Create audit artifacts index in specs/004-security-audit/artifacts/README.md
- [x] T002 Create audit tracking log in specs/004-security-audit/audit-log.md
- [x] T003 [P] Create GitHub issue tracker log in specs/004-security-audit/issue-links.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Baseline evidence required before any user story work

- [x] T004 Capture baseline test results in specs/004-security-audit/baseline-test-results.md
- [x] T005 Capture dependency tree snapshot in specs/004-security-audit/dependency-tree.txt

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Identify All CVE Vulnerabilities in Dependencies (Priority: P1) 🎯 MVP

**Goal**: Discover all npm and base-image CVEs with severity classification

**Independent Test**: Run npm audit and base image review, then confirm discovery summary is complete and consistent with outputs.

### Implementation for User Story 1

- [x] T006 [P] [US1] Save npm audit JSON output to specs/004-security-audit/audit-initial.json
- [x] T007 [P] [US1] Save human-readable npm audit output to specs/004-security-audit/audit-initial.txt
- [x] T008 [P] [US1] Record base image digest and OS CVEs in specs/004-security-audit/os-cve-inventory.md
- [x] T009 [US1] Summarize CVE counts in specs/004-security-audit/discovery-summary.md
- [x] T010 [US1] Update specs/004-security-audit/audit-log.md with discovery totals and notes

**Checkpoint**: User Story 1 is complete and independently verifiable

---

## Phase 4: User Story 2 - Prioritize and Fix Critical/High Vulnerabilities (Priority: P1)

**Goal**: Remediate all critical/high npm CVEs that are fixable without breaking behavior

**Independent Test**: Package updates applied, build/test succeed, and audit-after-patches shows no remediable critical/high CVEs.

### Implementation for User Story 2

- [x] T011 [US2] Draft remediation decisions in specs/004-security-audit/remediation-plan.md
- [x] T012 [US2] Update vulnerable dependencies in server/package.json
- [x] T013 [US2] Regenerate lockfile in server/package-lock.json after updates
- [x] T014 [US2] Record update notes and conflicts in specs/004-security-audit/remediation-log.md
- [x] T015 [P] [US2] Capture build output in specs/004-security-audit/build-after-patches.md
- [x] T016 [P] [US2] Capture test results in specs/004-security-audit/test-results-after-patches.md
- [x] T017 [P] [US2] Capture Docker rebuild results in specs/004-security-audit/docker-build-after-patches.md
- [x] T018 [US2] Save post-remediation audit JSON to specs/004-security-audit/audit-after-patches.json
- [x] T019 [US2] Update specs/004-security-audit/audit-log.md with remediation outcomes

**Checkpoint**: User Story 2 is complete and independently verifiable

---

## Phase 5: User Story 3 - Document Unfixable Vulnerabilities with Impact Analysis (Priority: P2)

**Goal**: Document unfixable npm and OS CVEs with justification and impact analysis

**Independent Test**: docs/SECURITY_FINDINGS.md lists all unfixable CVEs with reasons, impact, and issue links.

### Implementation for User Story 3

- [x] T020 [US3] Compile unfixable CVE analysis in specs/004-security-audit/unfixable-analysis.md
- [x] T021 [US3] Draft compliance findings in docs/SECURITY_FINDINGS.md
- [x] T022 [US3] Add mitigation and impact analysis to docs/SECURITY_FINDINGS.md
- [x] T023 [P] [US3] Record GitHub issue URLs in specs/004-security-audit/issue-links.md
- [x] T024 [US3] Update specs/004-security-audit/audit-log.md with documentation completion

**Checkpoint**: User Story 3 is complete and independently verifiable

---

## Phase 6: User Story 4 - Verify Clean Security State Post-Remediation (Priority: P1)

**Goal**: Confirm zero critical/high npm CVEs and produce final audit report

**Independent Test**: Final audit JSON, build, test, and Docker outputs confirm compliance and are linked in docs/SECURITY_AUDIT.md.

### Implementation for User Story 4

- [x] T025 [US4] Save final npm audit JSON to specs/004-security-audit/audit-final.json
- [x] T026 [P] [US4] Capture final build output in specs/004-security-audit/build-final.md
- [x] T027 [P] [US4] Capture final test results in specs/004-security-audit/test-results-final.md
- [x] T028 [P] [US4] Capture final Docker rebuild results in specs/004-security-audit/docker-build-final.md
- [x] T029 [US4] Create docs/SECURITY_AUDIT.md with methodology, evidence, and links
- [x] T030 [US4] Update specs/004-security-audit/audit-log.md with final verification status

**Checkpoint**: User Story 4 is complete and independently verifiable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story cleanup, link integrity, and final indexing

- [x] T031 [P] Update specs/004-security-audit/artifacts/README.md with links to all audit artifacts
- [x] T032 Update docs/SECURITY_AUDIT.md and docs/SECURITY_FINDINGS.md with cross-links to specs/004-security-audit/issue-links.md
- [x] T033 Update specs/004-security-audit/audit-log.md with final checklist and sign-off

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion and proceed in priority order (P1 → P2 → P1)
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational
- **User Story 2 (P1)**: Depends on User Story 1 discovery outputs
- **User Story 3 (P2)**: Depends on User Story 2 remediation outcomes
- **User Story 4 (P1)**: Depends on User Stories 1-3 to verify final state

---

## Parallel Execution Examples

### User Story 1

```text
T006 Save npm audit JSON output to specs/004-security-audit/audit-initial.json
T007 Save human-readable npm audit output to specs/004-security-audit/audit-initial.txt
T008 Record base image digest and OS CVEs in specs/004-security-audit/os-cve-inventory.md
```

### User Story 2

```text
T015 Capture build output in specs/004-security-audit/build-after-patches.md
T016 Capture test results in specs/004-security-audit/test-results-after-patches.md
T017 Capture Docker rebuild results in specs/004-security-audit/docker-build-after-patches.md
```

### User Story 3

```text
T023 Record GitHub issue URLs in specs/004-security-audit/issue-links.md
```

### User Story 4

```text
T026 Capture final build output in specs/004-security-audit/build-final.md
T027 Capture final test results in specs/004-security-audit/test-results-final.md
T028 Capture final Docker rebuild results in specs/004-security-audit/docker-build-final.md
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate discovery artifacts and stop for review

### Incremental Delivery

1. Setup + Foundational → Baseline evidence ready
2. User Story 1 → Discovery complete
3. User Story 2 → Remediation complete
4. User Story 3 → Documentation complete
5. User Story 4 → Verification complete

### Parallel Team Strategy

Once User Story 1 is complete, documentation tasks (User Story 3) can proceed in parallel with remediation verification tasks if staffing allows.
