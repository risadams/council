# Data Model: Interactive Council Chat

## Overview

This document defines the core domain entities and their relationships for the Interactive Council Chat feature. All entities are session-scoped (ephemeral per request); no persistent storage is required.

## Core Entities

### 1. ConversationSession

**Purpose**: Container for a single user request with all related clarifications, council discussion, and final response.

**Fields**:
- `sessionId` (string, UUID): Unique session identifier
- `userId` (string): VS Code user identifier (opaque)
- `requestText` (string): Original user request
- `status` (enum): `clarifying | debating | final | completed | cancelled`
- `createdAt` (timestamp): Session start time
- `updatedAt` (timestamp): Last interaction time
- `clarificationRounds` (number): Count of clarification phases completed (0-3)
- `debateCycles` (number): Count of debate cycles completed (0-10 default)
- `extendedDebateRequested` (boolean): User opted into extended debate mode
- `assumptionLog` (array): Assumptions made for skipped questions (see Assumption)
- `participants` (array): List of Participant entities involved
- `messageTurns` (array): Ordered list of all exchanges (see MessageTurn)
- `finalAnswer` (string): Consolidated final response (populated once status = `completed`)
- `metadata` (object): Correlation ID, timing, feature flags, error categories

**State Transitions**:
```
[created] →
  ├─ clarifying (questions presented) →
  │  ├─ debating (user answered, council exchanges shown)
  │  ├─ clarifying (user requested more questions OR revisited skipped)
  │  └─ final (user skipped remaining questions)
  └─ debating (no clarifications needed) →
     └─ completed (final answer + session done)

Any state → cancelled (user cancels mid-session)
```

**Validation**:
- `clarificationRounds` ≤ 3 (enforced on FR-021)
- `debateCycles` ≤ 10 by default; ≤ admin override if `extendedDebateRequested` true
- `participants` must include at least one Persona
- `messageTurns` must be non-empty before `status` transitions to `completed`

---

### 2. Participant

**Purpose**: Represents an actor in the session (user or persona).

**Fields**:
- `participantId` (string, UUID): Unique participant identifier
- `type` (enum): `user | persona`
- `name` (string): Display name ("User" for user; persona name for personas, e.g., "Senior Developer")
- `role` (string, optional): Clarifies role if needed (e.g., "advisor", "questioner", "debater")

**Relationships**:
- Referenced by MessageTurn.sender
- Derived from ConversationSession.participants

**Validation**:
- If `type = user`, only one instance per session
- If `type = persona`, name must match a valid council persona contract

**Derived Attributes**:
- `isPrimaryUser` (boolean): true if type = user
- `isRelevantForRequest` (boolean): Computed at session start based on request classification

---

### 3. MessageTurn

**Purpose**: A single message exchange within a session.

**Fields**:
- `turnId` (string, UUID): Unique turn identifier
- `sessionId` (string): Foreign key to ConversationSession
- `sender` (Participant): Who is sending (user or persona)
- `recipient` (Participant, optional): Targeted recipient (for direct persona requests)
- `messageType` (enum): `question | answer | discussion | conclusion | assumption_statement`
- `content` (string): Message body
- `timestamp` (timestamp): When message was sent/received
- `sequenceNumber` (number): Order within session (1-indexed)
- `relatedCycleOrRound` (object): `{ cycleType: "clarification|debate", number: N }`
- `metadata` (object): Tone, length, LLM model used, latency, feature flag

**Relationships**:
- Belongs to ConversationSession (1:N)
- Sender/Recipient reference Participant

**Validation**:
- `sequenceNumber` must be unique and strictly increasing within session
- `messageType` must align with session status:
  - `question`: only when status = `clarifying`
  - `answer`: when status = `clarifying` and sender = user
  - `discussion`: when status = `debating` and sender = persona
  - `conclusion`: only after all debate cycles; before final answer
  - `assumption_statement`: when clarifications skipped

**State Dependencies**:
- Cannot have message type `answer` after round 3 completes
- Cannot have message type `discussion` after debate cycle limit reached

---

### 4. ClarificationQuestion

**Purpose**: A targeted question asked during clarification phase to resolve ambiguity.

**Fields**:
- `questionId` (string, UUID): Unique question identifier
- `sessionId` (string): Foreign key to ConversationSession
- `roundNumber` (number): Which clarification round (1-3)
- `sequenceInRound` (number): Order within round
- `question` (string): The question text
- `targetAmbiguity` (string): What is being clarified (e.g., "scope", "timeline", "priority")
- `askedBy` (Participant): Which persona(s) or system generated the question
- `userAnswer` (ClarificationAnswer, optional): User's response to this question
- `status` (enum): `pending | answered | skipped | deferred`
- `createdAt` (timestamp)
- `answeredAt` (timestamp, optional)

**Relationships**:
- Belongs to ConversationSession (1:N)
- References ClarificationAnswer (0:1)

**Validation**:
- `roundNumber` ≤ 3
- `sequenceInRound` ≥ 1
- Exactly one question active per session at a time (sequential presentation, FR-004)
- Cannot transition from `pending` to `answered` without a ClarificationAnswer

---

### 5. ClarificationAnswer

**Purpose**: User-provided response to a ClarificationQuestion.

**Fields**:
- `answerId` (string, UUID): Unique answer identifier
- `questionId` (string): Foreign key to ClarificationQuestion
- `sessionId` (string): Foreign key to ConversationSession
- `answer` (string): The user's response text
- `skipCommand` (boolean): true if answer is "Skip question" or equivalent
- `confidence` (enum, optional): `high | medium | low` - user's confidence in answer
- `createdAt` (timestamp)

**Relationships**:
- References ClarificationQuestion (1:1 or 0:1)
- Belongs to ConversationSession (1:N)

**Validation**:
- If `skipCommand = true`, `answer` should contain skip keyword
- `answer` must be non-empty string

---

### 6. Assumption

**Purpose**: Explicit statement of what the system assumed when a clarification was skipped.

**Fields**:
- `assumptionId` (string, UUID): Unique identifier
- `sessionId` (string): Foreign key to ConversationSession
- `relatedQuestion` (ClarificationQuestion, optional): Which question this assumption addresses
- `assumption` (string): What was assumed (e.g., "Assuming timeline is 2 weeks")
- `rationale` (string): Why this assumption was made
- `addedAt` (timestamp)

**Relationships**:
- Belongs to ConversationSession (1:N)

**Usage**:
- Populated when ClarificationAnswer.skipCommand = true
- Included in final answer (FR-004, FR-008)
- Used for session transparency

---

### 7. CouncilDiscussion

**Purpose**: Represents one debate cycle within the session.

**Fields**:
- `discussionId` (string, UUID): Unique discussion identifier
- `sessionId` (string): Foreign key to ConversationSession
- `cycleNumber` (number): Which debate cycle (1-10 by default, extensible)
- `participatingPersonas` (array): List of personas contributing in this cycle
- `exchangeStarts` (timestamp): When cycle began
- `exchangeEnds` (timestamp): When cycle concluded
- `topic` (string): What is being debated (extracted from request or prior discussion)
- `messageTurns` (array): References to MessageTurn entities with type = `discussion`
- `resolutionSummary` (string, optional): How disagreements were resolved (populated at cycle end)
- `status` (enum): `in_progress | concluded | limit_reached`

**Relationships**:
- Belongs to ConversationSession (1:N)
- References multiple Participant entities (personas)
- Contains/references MessageTurn entities

**Validation**:
- `cycleNumber` ≤ session's debate cycle limit
- `participatingPersonas` non-empty
- Must have at least 2 personas for true "discussion"
- `resolutionSummary` required before transition to `concluded`

**Constraints**:
- If `cycleNumber` reaches limit, `status` forced to `limit_reached` (FR-016)
- User notified explicitly when limit reached (FR-019)

---

### 8. PersonaSelection

**Purpose**: Record which personas are selected for a session and why.

**Fields**:
- `selectionId` (string, UUID): Unique identifier
- `sessionId` (string): Foreign key to ConversationSession
- `requestClassification` (string): Inferred request type (e.g., "architecture", "security", "workflow")
- `selectedPersonas` (array): List of Participant (type=persona) selected
- `reason` (string): Rationale for selection (e.g., "request involves security decisions; including Security Expert")
- `userOverride` (boolean): true if user explicitly named personas
- `overriddenPersonas` (array, optional): If user override, which personas were requested by name
- `createdAt` (timestamp)

**Relationships**:
- Belongs to ConversationSession (1:1)
- References Participant entities

**Validation**:
- `selectedPersonas` non-empty
- If `userOverride = true`, `overriddenPersonas` non-empty
- All referenced personas must exist in council persona contracts

---

## Relationships Summary

```
ConversationSession (1)
├── Participant (N) [user + selected personas]
├── ClarificationQuestion (0..3 rounds × M questions per round)
│  └── ClarificationAnswer (0..1 per question)
├── MessageTurn (N) [all exchanges]
├── CouncilDiscussion (1..10 cycles)
│  └── MessageTurn (subset, type=discussion)
├── Assumption (0..N) [for skipped questions]
└── PersonaSelection (1) [selection record]
```

## Validation Rules

### Temporal Ordering
- `MessageTurn.sequenceNumber` strictly increasing
- `ClarificationQuestion.roundNumber` then `sequenceInRound` enforces order
- Cannot answer question before it's asked

### State Consistency
- If ConversationSession.status = `clarifying`, only ClarificationQuestion/Answer/Assumption entities active
- If ConversationSession.status = `debating`, only CouncilDiscussion and MessageTurn entities active
- Cannot transition to `completed` without finalAnswer populated

### Constraint Enforcement
- Clarification rounds ≤ 3 (hard limit, FR-021)
- Debate cycles ≤ 10 by default; respects admin override and extendedDebateRequested (FR-016, FR-017, FR-018)
- Only one MessageTurn per session can have status `final` before `completed`

### Persona Contract Compliance
- All Participant (type=persona) names must match council.personas contracts
- PersonaSelection.selectedPersonas must be valid persona names
- Any persona-specific behavior (tone, tools allowed) follows persona contract

## Enumerations

### MessageType
- `question`: Clarification question
- `answer`: User's answer to question
- `discussion`: Persona contribution to debate
- `conclusion`: Persona's final position after debate
- `assumption_statement`: System statement of skipped-question assumption

### SessionStatus
- `created`: Initial state
- `clarifying`: Asking clarification questions
- `debating`: Council in discussion
- `final`: Presenting final answer
- `completed`: Session ended successfully
- `cancelled`: User cancelled mid-session

### QuestionStatus
- `pending`: Awaiting user response
- `answered`: User provided answer
- `skipped`: User declined to answer
- `deferred`: User skipped and may revisit later

## Notes for Implementation

1. **No Persistence**: All entities are in-memory for a single session; no database required.
2. **VS Code Chat Integration**: MessageTurn entities correspond to chat message protocol; renderer handles presentation.
3. **Persona Contracts**: PersonaSelection validates against existing council.personas contracts (no new persona definitions).
4. **Cycle Counting**: A "debate cycle" = one complete round of exchanges where all contributing personas have spoken.
5. **Idempotency**: Session state can be fully replayed from messageTurns array (audit trail).
6. **Metadata Fields**: Used for observability (correlation IDs, latency, feature flags); not required for core logic.
