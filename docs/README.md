# Clarity Council MCP Tool Suite (VS Code)

## Overview
Persona-driven MCP tools for VS Code: `council.consult`, `persona.consult`, `council.define_personas`. Returns structured advice with synthesis and transparent persona contracts.

## Setup
See [specs/001-clarity-council-mcp/quickstart.md](specs/001-clarity-council-mcp/quickstart.md) for step-by-step instructions.

## Tools

### council.consult
Gathers perspectives from multiple personas and synthesizes agreements, conflicts, and next steps.

**Example**:
```
/council.consult user_problem:"We need to grow MRR by 30%" context:"B2B SaaS, 100 customers" desired_outcome:"Sustainable growth" depth:standard
```

**Output**: 6 persona responses + synthesis (agreements, conflicts, risks/tradeoffs, next steps).

### persona.consult
Get structured advice from a single persona with their tone and constraints.

**Example**:
```
/persona.consult persona_name:"Financial Officer" user_problem:"Launch premium tier" depth:brief
```

**Output**: Single persona response honoring soul/focus/constraints, scaled to depth.

### council.define_personas
View current persona contracts and apply workspace-level overrides.

**Example**:
```
/council.define_personas overrides:{"Growth Strategist":{"focus":["product-led growth"]}}
```

**Output**: Updated contracts; persists to `.council/personas.json`.

## Output Schema

**Persona Response** (per persona):
- `persona`: Name
- `summary`: Label + problem statement
- `advice`: Bulleted guidance (depth-scaled)
- `assumptions`: Problem context (depth-scaled)
- `questions`: Clarifying questions (depth-scaled)
- `next_steps`: Ordered steps (depth-scaled, min 2–3, max 10+)
- `confidence`: low | medium | high
- `confidence_rationale`: Explanation

**Synthesis** (council.consult only):
- `agreements`: Shared goals
- `conflicts`: Tension areas
- `risks_tradeoffs`: Failure modes & Devil's Advocate risks
- `next_steps`: Consolidated priorities
- `notes`: Metadata

## Depth Behaviors

**Brief** (rapid triage, 1–2 min review)
- 2–3 advice items | 1–2 questions | 2–3 next_steps
- Minimal assumptions; focus on immediate action
- Use case: Urgent decisions, email-length responses

**Standard** (balanced, 3–5 min review)
- 3–5 advice items | 2–4 questions | 3–5 next_steps
- Moderate assumptions; balanced insight & action
- Use case: Most consultations; default mode

**Deep** (thorough, 5–10+ min review)
- 5–10+ advice items | 4–8 questions | 5–10+ next_steps
- Rich assumptions; nuanced tradeoffs & Devil's Advocate risks
- Use case: Strategic decisions, high-stakes launches

## Synthesis & Conflicts

Council.consult generates three synthesis sections:

**Agreements**: Themes all personas align on (e.g., "prioritize customer feedback").

**Conflicts**: Genuine tensions between personas:
- **Strategic vs. Pragmatic**: Long-term growth vs. immediate cash flow
- **User-Centric vs. Revenue-Centric**: Product value vs. margin expansion
- **Experimental vs. Stable**: Innovation risk vs. operational continuity
- **Speed vs. Quality**: Market timing vs. technical debt

Use conflicts to surface **decision triggers** and negotiation points before execution.

**Risks/Tradeoffs**: Summarized from Devil's Advocate response (failure modes, unintended consequences).

## Persona Matrix
- Growth Strategist: Focus: growth levers; Constraints: avoid vanity metrics
- Financial Officer: Focus: unit economics; Constraints: avoid uncosted plans
- Devil's Advocate: Focus: risk/tradeoffs; Constraints: must include counterpoints
- Ops Architect: Focus: systems/process; Constraints: avoid unscoped complexity
- Customer Advocate: Focus: customer outcomes; Constraints: avoid ignoring feedback
- Culture Lead: Focus: team health; Constraints: avoid toxic practices

## Policies
- **Depth Scaling**: brief (2–3 items), standard (3–5), deep (5–10+); confidence levels track depth.
- **Workspace Overrides**: `.council/personas.json` applies soul/focus/constraints changes to base contracts; define_personas merges existing + incoming overrides and persists atomically. See `.council/personas.json.example` for a template.
- **Discovery**: Personas listed via MCP discovery; explicit prefixes (`/` syntax) enable tool invocation.

## Build & Run
```bash
cd server
npm install
npm run build
npm run start
```

## Tests (30+ Coverage)
```bash
npm test -- --run
```

Covers unit (inputs/outputs), integration (tool handlers), golden (persona contracts/tone), and error cases.

## Workflow Examples

### Quick Decision Validation (Brief Mode)
```
/council.consult user_problem:"Should we pause the current product roadmap for a 2-week security audit?" context:"5-person team, critical vulnerability discovered" desired_outcome:"Timeline clarity" depth:brief
```
→ Fast consensus check; 6 persona summaries + synthesis in 30s.

### Strategic Growth Planning (Deep Mode)
```
/council.consult user_problem:"Transition from B2B SaaS to multi-tenant marketplace" context:"$2M ARR, 50 enterprise customers, 20-person company" desired_outcome:"Successful migration strategy" depth:deep
```
→ Detailed analysis; synthesis flags strategic vs. pragmatic conflicts; Devil's Advocate surfaces execution risks.

### Cross-Functional Perspective (Specific Persona)
```
/persona.consult persona_name:"Ops Architect" user_problem:"Migrate infrastructure to Kubernetes" depth:standard
```
→ Single-track operational guidance with architectural constraints.

### Workspace Customization (Define Personas)
```
/council.define_personas overrides:{"Financial Officer":{"soul":"Growth-minded CFO","focus":["revenue optimization","cash efficiency"]}}
```
→ Persist custom persona profiles to `.council/personas.json` for team consistency.

## Release Notes (v0.1.0)

**Initial Release**: Clarity Council MCP Tool Suite
- ✅ Three production-ready tools: `council.consult`, `persona.consult`, `council.define_personas`
- ✅ Six personas with transparent contracts (Growth Strategist, Financial Officer, Devil's Advocate, Ops Architect, Customer Advocate, Culture Lead)
- ✅ Depth-scaled responses (brief/standard/deep)
- ✅ Synthesis with agreements, conflicts, and risks
- ✅ Workspace-level persona overrides (`.council/personas.json`)
- ✅ 34+ comprehensive tests (unit, integration, golden, error)
- ✅ Structured observability (request IDs, timing, error categories)
- ✅ Full TypeScript support with strict validation (Ajv 2020-12)

**Features**:
- Multi-persona consensus & conflict identification
- Devil's Advocate automatic risk/tradeoff generation
- Confidence scoring tied to depth
- MCP tool discovery + explicit prefix support (`/council.consult`, etc.)
- No network dependencies; offline-first design
- Production logging with pino + structured JSON format

**Getting Started**:
See [specs/001-clarity-council-mcp/quickstart.md](../specs/001-clarity-council-mcp/quickstart.md).
