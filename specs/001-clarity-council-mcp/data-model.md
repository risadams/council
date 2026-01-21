# Data Model: Clarity Council MCP Tool Suite

## Entities

- **PersonaContract**
  - Fields:
    - `name`: string (enum: Growth Strategist, Financial Officer, Devil’s Advocate, Ops Architect, Customer Advocate, Culture Lead)
    - `soul`: string (background/expertise)
    - `focus`: string[] (priorities)
    - `constraints`: string[] (disallowed actions, challenge rules)
    - `allowed_tools`: string[] (e.g., ["council.consult", "persona.consult", "council.define_personas"]).
  - Validation:
    - Non-empty `soul`, at least one `focus` item, constraints explicitly list refusal patterns and challenge mechanism.

- **ToolInput**
  - `council.consult`:
    - `user_problem`: string (required)
    - `context`: string (optional)
    - `desired_outcome`: string (optional)
    - `constraints`: string[] (optional)
    - `selected_personas`: string[] (optional; defaults to all)
    - `depth`: string (enum: brief | standard | deep; default: standard)
  - `persona.consult`:
    - `persona_name`: string (required; matches PersonaContract name)
    - same fields as above
  - `council.define_personas`:
    - `overrides`: object (optional; per-persona overrides of `soul`, `focus`, `constraints`)

- **ToolResponse**
  - Fields (per persona):
    - `persona`: string
    - `summary`: string
    - `advice`: string
    - `assumptions`: string[]
    - `questions`: string[]
    - `next_steps`: string[] (ordered)
    - `confidence`: string (enum: low | medium | high) + rationale
  - Error Shape:
    - `error.code`: string (validation | permission | internal)
    - `error.message`: string
    - `error.details`: object (schema errors, field names)

- **CouncilSynthesis**
  - Fields:
    - `agreements`: string[]
    - `conflicts`: string[]
    - `risks_tradeoffs`: string[]
    - `next_steps`: string[] (ordered, consolidated)
    - `notes`: string[] (nondeterminism, constraints references)

## Relationships

- `PersonaContract` referenced by `persona_name` in `ToolInput`.
- `council.consult` returns an array of `ToolResponse` per selected persona plus `CouncilSynthesis`.
- `council.define_personas` returns `PersonaContract[]` and applies valid `overrides` to the workspace config.

## Rules

- Devil’s Advocate must always include counterpoints in `advice` and list `risks_tradeoffs`.
- Depth ranges:
  - brief → 2–3 bullets (summary/advice/next_steps)
  - standard → 5–7 bullets
  - deep → 10+ bullets
- Discoverability supports MCP listing and prefixes; prefixes must be documented.
- No persistence of conversations; only persona overrides in workspace config.
