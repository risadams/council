# Feature Specification: Interactive Council Chat

**Feature Branch**: `001-interactive-chat-council`  
**Created**: 2026-02-03  
**Status**: Draft  
**Input**: User description: "Next feature, I want to make this more interactive in the VS code chat window, similar to how [https://github.com/github/spec-kit](https://github.com/github/spec-kit) works, I want the council to be able to interact with one another as well as prompt me for clarifying questions."

## Clarifications

### Session 2026-02-03

- Q: When a user submits an ambiguous request and the council identifies multiple possible clarifications needed, how should they be presented to the user? → A: One question at a time in sequential order; user must answer before seeing the next.
- Q: When the council identifies that a request requires input from multiple personas to provide the best answer, how should their discussion be shown to the user: before the final answer, after it, or woven throughout? → A: Show council discussion before the final answer; personas exchange openly, then summarize consensus/tradeoffs.
- Q: If a user skips clarifying questions and the system generates a response with stated assumptions, should the user be able to revisit the skipped questions and refine the answer, or is the response final? → A: User can revisit skipped questions within the session; system regenerates response with new answers incorporated. User can explicitly skip a question by saying "Skip question" or similar phrasing.
- Q: How should the system determine when to initiate a clarification flow versus providing an immediate response? What threshold or heuristic should trigger the clarification mode? → A: Hybrid approach: automatically detect obvious gaps in context; also provide a toggle button for user-initiated clarifications when the request appears complete.
- Q: What is the scope of the "council" in this interactive experience? Should all personas participate in every request, or should the system dynamically select which personas are relevant based on the request type? → A: System dynamically selects relevant personas based on request type; only applicable perspectives are shown. User can also address one or more personas directly by name (e.g., "Ask the Senior Developer and Security Expert about this").
- Q: Should the council debate cycle limit be fixed, configurable, or user-selectable per-request? → A: Two-tier approach: default limit of 10 debate cycles with admin override capability. Users can optionally request "extended debate" when submitting a request to increase the limit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clarification-driven assistance (Priority: P1)

As a user, I want the council to ask clarifying questions when my request is ambiguous so I can provide the missing details and receive a high-quality answer.

**Why this priority**: Clarifying ambiguity is the fastest path to higher-quality outcomes and reduces rework for the user.

**Independent Test**: Can be fully tested by submitting an ambiguous request and verifying that questions are asked and the final response reflects the user's answers.

**Acceptance Scenarios**:

1. **Given** an ambiguous request, **When** the council responds, **Then** it asks focused clarifying questions instead of delivering a final answer.
2. **Given** a user provides answers to the clarifying questions, **When** the council responds again, **Then** it produces a final answer that explicitly reflects those answers.
3. **Given** a clear request, **When** the council responds, **Then** it provides a final answer without asking clarification questions.

---

### User Story 2 - Council-to-council discussion (Priority: P2)

As a user, I want to see the council members interact with one another so I understand tradeoffs, disagreements, and the reasoning behind the final answer.

**Why this priority**: Transparency and multi-perspective reasoning builds trust and helps users choose among alternatives.

**Independent Test**: Can be fully tested by submitting a request with competing priorities and verifying the council exchange is shown before the final answer.

**Acceptance Scenarios**:

1. **Given** a request with competing constraints, **When** the council responds, **Then** the user can see council members exchange perspectives before the final response.
2. **Given** the council identifies disagreements, **When** it resolves them, **Then** the final answer summarizes the agreed approach and any remaining tradeoffs.

---

### User Story 3 - User control of clarification flow (Priority: P3)

As a user, I want to answer, skip, or defer clarifying questions so I can control how much time I spend before receiving a response.

**Why this priority**: Users vary in urgency; giving control prevents friction and keeps the interaction productive.

**Independent Test**: Can be fully tested by skipping questions and verifying that the council still produces a best-effort response with stated assumptions.

**Acceptance Scenarios**:

1. **Given** the council asks clarifying questions, **When** the user skips them, **Then** the council delivers a best-effort response and explicitly states the assumptions used.
2. **Given** the council asks multiple questions, **When** the user answers only a subset, **Then** the council incorporates answered items and assumes defaults for the rest.

---

### Edge Cases

- User provides partial or ambiguous answers to clarifying questions.
- User answers out of order or combines multiple answers in one message.
- User cancels mid-clarification and requests a final answer immediately.
- Multiple clarification rounds risk a long conversation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically detect when a user request is ambiguous or missing key inputs based on context analysis.
- **FR-002**: System MUST automatically initiate clarifying questions when obvious gaps in context are detected.
- **FR-003**: System MUST provide a user-accessible toggle or button to initiate clarifying questions even when the request appears complete.
- **FR-004**: System MUST present clarifying questions one at a time in sequential order, requiring the user to answer each question before presenting the next.
- **FR-005**: System MUST allow the user to respond to clarifying questions and use those answers in the final response.
- **FR-006**: System MUST allow the user to explicitly skip a question by saying "Skip question" or similar phrasing instead of providing an answer.
- **FR-007**: System MUST allow the user to skip or defer clarifying questions and still receive a best-effort response.
- **FR-008**: System MUST clearly state any assumptions used when questions are skipped or unanswered.
- **FR-009**: System MUST allow users to revisit and answer previously skipped questions within the same session and regenerate the response incorporating the new answers.
- **FR-010**: System MUST dynamically select relevant council personas based on request type and content; only personas with applicable perspectives are included in the response.
- **FR-011**: System MUST allow users to explicitly request responses from specific persona(s) by name (e.g., "Ask the Senior Developer and Security Expert about this").
- **FR-012**: System MUST show council member interactions whenever two or more personas contribute to a response, displayed before the final answer.
- **FR-013**: Council discussion MUST include open exchange of perspectives, identification of tradeoffs, and resolution of disagreements between personas.
- **FR-014**: Council member interactions MUST be attributed to individual personas so users can trace perspectives and reasoning.
- **FR-015**: System MUST follow council discussion with a consolidated final answer that reflects the discussion and user-provided clarifications.
- **FR-016**: System MUST enforce a maximum of 10 debate cycles per council discussion by default; after the limit is reached, personas MUST move to final deliberation.
- **FR-017**: System MUST allow administrators to override the default 10-cycle debate limit via configuration.
- **FR-018**: System MUST allow users to optionally request "extended debate" when submitting a request, which invokes the admin-configured override limit (if applicable).
- **FR-019**: System MUST clearly indicate to the user when a debate cycle limit has been reached and the council is moving to final deliberation.
- **FR-020**: System MUST keep the interactive session context across multiple turns within the same request.
- **FR-021**: System MUST limit clarification rounds to no more than 3 per user request.
- **FR-022**: System MUST ensure the interactive experience is available within the VS Code chat window.

### Scope

- **In Scope**: Clarification questions, council-to-council exchanges, and multi-turn interactions for a single user request in the VS Code chat window.
- **Out of Scope**: Changes to persona definitions, non-chat interfaces, or new external integrations.

### Assumptions

- Clarifying questions are presented one at a time in sequential order to reduce cognitive load and interaction friction.
- Each clarifying question targets a single ambiguity to ensure focused, answerable queries.
- Users can skip individual questions and still receive a best-effort response with stated assumptions.
- Council personas are selected dynamically based on request relevance; persona selection logic is deterministic and reviewable.
- Users can override automatic selection by explicitly naming personas; all existing council personas remain available for direct addressing.
- Debate cycles are counted as complete rounds of persona exchanges; a cycle ends when all contributing personas have contributed to the current debate turn.
- The default 10-cycle limit prevents runaway discussions while allowing sufficient depth for most decisions; the admin override enables tuning based on operational experience.
- Users who request "extended debate" are opting into longer council discussions and accept potential increased response time.
- Existing council personas are used without requiring new persona definitions for this feature.

### Dependencies

- The VS Code chat experience supports multi-turn exchanges with the user within a single session.
- Council personas and their contracts remain available and stable.

### Key Entities *(include if feature involves data)*

- **Conversation Session**: A single user request with its related clarifications, council discussion, and final response.
- **Participant**: The user or a council persona taking part in the conversation.
- **Message Turn**: A single message from a participant within a session.
- **Clarification Question**: A targeted question asked to resolve ambiguity.
- **Clarification Answer**: A user-provided response that resolves a question.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of interactive sessions with clarifications are completed in under 5 minutes.
- **SC-002**: At least 80% of ambiguous requests receive clarifying questions before a final response is delivered.
- **SC-003**: At least 90% of sessions that involve multiple perspectives show a council-to-council exchange.
- **SC-004**: 85% of users report that the clarifying questions improved the quality of the final answer.
