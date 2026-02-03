# Quickstart: Interactive Council Chat

## Overview

This guide demonstrates how to use the Interactive Council Chat feature in the VS Code chat window. The feature enables multi-turn conversations where the council asks clarifying questions, debates internally, and delivers transparent answers.

## Architecture

```
User Request (chat input)
    ↓
[Session Created] → ConversationSession (sessionId)
    ↓
[Ambiguity Detection] → System analyzes request
    ├─ Clear → proceed to Persona Selection
    └─ Ambiguous → Clarification Phase
    ↓
[Clarification Phase] → Present questions 1-at-a-time
    ├─ User answers → next question
    ├─ User skips → record assumption & proceed
    └─ All questions answered OR skipped
    ↓
[Persona Selection] → Dynamic selection OR user override
    ↓
[Debate Phase] → Council-to-council exchange (≤10 cycles)
    ├─ Personas exchange perspectives
    ├─ Identify tradeoffs
    └─ Reach consensus
    ↓
[Consolidation] → Final answer reflecting discussion + clarifications
    ↓
Session Complete
```

## Example 1: Ambiguous Request with Clarifications (User Story 1)

**User Scenario**: A developer submits an ambiguous request about API design.

### Input
```
User: "How should I design the API for my data processing service?"
```

### Interaction Flow

**Step 1: Request received, ambiguity detected**
```
[Session created: sess-abc123]
System: "I need to clarify a few things to give you a high-quality answer.
         Let's start with the first question..."
```

**Step 2: Question 1 presented (one at a time)**
```
Senior Developer: "What's the primary data volume you expect 
                   (e.g., KB/sec, MB/sec, GB/sec)?"

User: "Around 1 MB/sec steady state, with 10x spikes during reporting."
```

**Step 3: Question 2 presented**
```
Senior Developer: "Are you prioritizing latency, throughput, or cost optimization?"

User: "Latency is critical - sub-100ms p95."
```

**Step 4: Question 3 presented**
```
Product Owner: "Do you need support for real-time subscriptions, or is polling sufficient?"

User: "Skip question"  
→ System records assumption: "Assuming polling is sufficient"
```

**Step 5: Debate begins**
```
[Debate Cycle 1]
Senior Developer: "Given sub-100ms latency and high throughput, 
                   I recommend a gRPC-based streaming design 
                   with connection pooling."

Security Expert: "Agreed on gRPC, but we need mutual TLS. 
                  The certificate rotation strategy becomes critical at this scale."

Senior Architect: "Both valid. gRPC + mTLS adds complexity; 
                   consider the ops burden. REST with HTTP/2 might 
                   be simpler if latency target is achievable."

[Debate Cycle 2]
Security Expert: "mTLS burden is justified given the data sensitivity 
                  implied by 'data processing service'. Ops should plan for it."

Senior Architect: "Fair point. If data is sensitive, gRPC + mTLS is justified."
```

**Step 6: Final Answer (Consolidated)**
```
[Council Resolution]
The council recommends a gRPC-based streaming API with mutual TLS:

DECISION: gRPC + HTTP/2 + mutual TLS
- Meets sub-100ms p95 latency requirement via connection reuse
- Handles 1 MB/sec baseline + 10x spike capacity
- Security Expert confirms mTLS security posture for data processing

TRADEOFF: Increased operational complexity vs. security/performance gains
- Ops team should establish certificate rotation automation
- Use gRPC gateway for REST fallback if needed

ASSUMPTION: Polling is sufficient (you skipped subscription question)

NEXT STEP: Prototype with gRPC libraries (e.g., grpc-go, protobuf v3)
```

---

## Example 2: Council-to-Council Debate (User Story 2)

**User Scenario**: Competing constraints trigger debate.

### Input
```
User: "Should we migrate our monolith to microservices?"
```

### Interaction Flow

**Step 1: Clarifications (brief)**
```
Scrum Master: "What's your current team size and deployment frequency?"

User: "8 engineers, deploy daily."

Product Owner: "What's the main pain point - scalability, team velocity, or something else?"

User: "Scalability - we're hitting limits with the monolith."
```

**Step 2: Debate begins with competing views**
```
[Debate Cycle 1]
Senior Architect: "Microservices is overcomplicited for 8 engineers. 
                   You'll spend more time on distributed systems 
                   than on scaling the core product."

DevOps Engineer: "Agreed, plus operational overhead. Monitoring, 
                  logging, and deployment complexity multiply."

Product Owner: "But monolith is becoming a bottleneck. New feature 
                velocity is suffering because teams step on each other."

Senior Developer: "That's a team structure problem, not necessarily 
                   a technical one. Conway's Law: your architecture 
                   mirrors your org. Reorganize teams first."

[Debate Cycle 2]
DevOps Engineer: "If we do microservices, we need service mesh 
                  (Istio, Linkerd). That's a lot of operational 
                  burden we don't have expertise for yet."

Culture Lead: "I agree with the team structure point. Have you tried 
               domain-driven design teams within the monolith first?"

Senior Architect: "Right - strangler pattern is a safer path: 
                   migrate one bounded context at a time while 
                   keeping the monolith. Less risky than big bang."

[Cycle 2 Resolution]
→ Strong consensus emerges: organizational restructure + strangler pattern 
  is lower risk than immediate microservices.
```

**Step 3: Final Answer**
```
[Council Decision]
Recommendation: Reorganize to domain-driven teams; use strangler pattern 
for gradual migration, not immediate microservices.

WHY: Your core problem is team communication, not technical limits. 
Microservices will amplify coordination costs for 8 engineers.

APPROACH:
1. Align team structure to business domains (e.g., auth, billing, reports)
2. Establish clear APIs between domains within the monolith
3. Gradually extract one domain via strangler pattern when bottleneck appears
4. Revisit microservices decision when team is 15+ engineers or domain 
   extraction reveals true independent scalability needs

ALTERNATIVE REJECTED: Immediate microservices migration
- High operational overhead for current team size
- Service mesh complexity not justified yet
- Risk of disrupting daily deploy cadence

TIMELINE: 6 months → reevaluate after org restructure
```

---

## Example 3: Direct Persona Requests (Feature: User Override)

**User Scenario**: User wants specific personas.

### Input
```
User: "Ask the Security Expert and Senior Architect about 
       OAuth 2.0 vs. Okta for enterprise SSO"
```

### Interaction Flow

**Step 1: Persona selection overridden**
```
[Session: sess-xyz789]
System: "You requested Security Expert and Senior Architect. 
         I'll also include Product Owner for business alignment."
[Personas selected: Security Expert, Senior Architect, Product Owner]
```

**Step 2: Debate proceeds with only those personas**
```
[Debate - no full council, only requested personas]
Security Expert: "Okta abstracts OAuth complexity and handles modern 
                  auth flows. For enterprise, the managed service model 
                  is worth the cost."

Senior Architect: "Okta decouples SSO from our infrastructure. Cleaner 
                   separation of concerns. BUT: vendor lock-in risk."

Product Owner: "Okta's UX for end-users is polished. OAuth self-hosted 
                adds support burden we don't want."

Security Expert: "Agreed on support burden. Okta also includes attack 
                  pattern detection we'd have to build ourselves."

→ Consensus: Okta for enterprise, OAuth 2.0 self-hosted only for 
  internal/dev use
```

---

## Example 4: Extended Debate Mode (Feature: Admin-Configurable Cycle Limit)

**User Scenario**: Complex architecture decision; user opts into deeper debate.

### Input
```
User: "Should we adopt CQRS + event sourcing? [EXTENDED DEBATE]"
```

**System Behavior**:
- Normal debate limit: 10 cycles
- Extended mode: 20 cycles (admin-configured override)
- User notified: "Extended debate enabled. This may take 30-45 seconds."

**Debate progresses through more cycles** with consensus emerging gradually across diverse perspectives (DevOps, Security, Architect, Senior Developer, Culture Lead).

**Final answer** more thoroughly explores tradeoffs and constraints.

---

## API Usage: Session Management

### Initiate Session
```json
POST /council/consult/interactive
{
  "requestText": "How should I design the API for my data processing service?",
  "interactiveMode": true,
  "extendedDebate": false
}
```

**Response**:
```json
{
  "sessionId": "sess-abc123",
  "status": "clarifying",
  "currentState": {
    "clarificationProgress": {
      "roundNumber": 1,
      "questionsAsked": []
    }
  },
  "nextAction": {
    "actionType": "answer_question",
    "prompt": "Senior Developer: What's the primary data volume you expect?"
  }
}
```

### Respond to Question
```json
POST /council/session/sess-abc123/respond
{
  "answer": "Around 1 MB/sec steady state, with 10x spikes during reporting."
}
```

### Get Current Session State
```json
GET /council/session/sess-abc123
```

Returns full `SessionState` with all clarifications, debate exchanges, and metadata.

---

## Persona-Specific Behaviors

### Senior Developer
- Focus: technical feasibility, architecture patterns, code maintainability
- Tone: pragmatic, forward-looking
- Questions about: scalability, test strategy, integration patterns

### Security Expert
- Focus: data protection, threat models, compliance
- Tone: cautious, explicit about risks
- Questions about: data sensitivity, attack surface, regulatory requirements

### Product Owner
- Focus: business value, user impact, roadmap alignment
- Tone: outcome-oriented
- Questions about: success metrics, stakeholder priorities, timeframes

### DevOps Engineer
- Focus: operational feasibility, monitoring, deployment
- Tone: practical, focused on observability
- Questions about: infrastructure requirements, SLA targets, incident response

### Culture Lead
- Focus: team impact, knowledge sharing, organizational health
- Tone: empathetic, collaborative
- Questions about: team skills, communication patterns, learning opportunities

---

## Success Metrics (from spec)

- **SC-001**: 90% of interactive sessions completed in under 5 minutes
  - Goal: Quick clarification + debate + answer turnaround
  
- **SC-002**: 80% of ambiguous requests receive clarifying questions
  - Goal: System accurately detects ambiguity
  
- **SC-003**: 90% of multi-perspective sessions show council exchange
  - Goal: Transparency and multi-view reasoning visible
  
- **SC-004**: 85% of users report clarifications improved answer quality
  - Goal: User satisfaction with interactive mode

---

## Troubleshooting

### "Session expired"
→ Chat window closed. Start a new session with the same request.

### "Debate cycle limit reached"
→ System is moving to final answer (you hit default 10 or extended limit).  
  Ask a follow-up question in a new session if needed.

### "Cannot answer same question twice"
→ Skip it or ask a new question. Use "revisit skipped questions" feature if you need to answer a question you skipped earlier.

---

## Testing Scenarios

### Unit Tests
- Clarification detection: ambiguous vs. clear requests
- Question sequencing: verify one-at-a-time ordering
- Cycle counting: ensure limits enforced
- Persona selection: request classification → persona filtering

### Integration Tests
- Full flow: ambiguous request → clarifications → debate → answer
- User skip → assumption recording → final answer includes assumption
- Extended debate: cycle limit override respected
- Session recovery: fetch via sessionId returns full state

### Golden Tests (Persona Output)
- Verify Senior Developer tone consistent with persona contract
- Verify Security Expert emphasizes risks appropriately
- Verify final answer attributes reasoning to persona names
- Verify debate exchanges show realistic disagreements + consensus

---

## Implementation Checklist

- [ ] ConversationSession entity and lifecycle
- [ ] ClarificationQuestion/Answer entities + sequential presentation
- [ ] Ambiguity detection (NLP integration with existing council.consult)
- [ ] Persona selection logic (dynamic + override support)
- [ ] CouncilDiscussion entity + debate cycle orchestration
- [ ] Debate cycle limit enforcement (default 10, admin override)
- [ ] Assumption recording for skipped questions
- [ ] Final answer consolidation (reflective of discussion + clarifications)
- [ ] VS Code chat integration (message streaming, multi-turn context)
- [ ] Session state persistence in-memory for single chat window
- [ ] Error handling (session not found, invalid responses, rate limiting)
- [ ] Observability (structured logs with correlation IDs, timing)
- [ ] Unit + integration + golden tests
- [ ] Feature flag for interactive mode (fallback to legacy council.consult)
- [ ] Documentation: tool spec, persona reference, troubleshooting

