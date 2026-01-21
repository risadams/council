# Clarity Council MCP Tool Suite (VS Code)

## Overview
Persona-driven MCP tools for VS Code: `council.consult`, `persona.consult`, `council.define_personas`. Returns structured advice with synthesis and transparent persona contracts.

## Setup
See [specs/001-clarity-council-mcp/quickstart.md](specs/001-clarity-council-mcp/quickstart.md) for step-by-step instructions.

## Tools
- council.consult: multi-persona responses + synthesis
- persona.consult: single persona guidance
- council.define_personas: view/apply persona overrides

## Output Schema
- persona, summary, advice, assumptions, questions, next_steps, confidence (+ rationale)
- Synthesis: agreements, conflicts, risks_tradeoffs, next_steps, notes

## Persona Matrix
- Growth Strategist: Focus: growth levers; Constraints: avoid vanity metrics
- Financial Officer: Focus: unit economics; Constraints: avoid uncosted plans
- Devil’s Advocate: Focus: risk/tradeoffs; Constraints: must include counterpoints
- Ops Architect: Focus: systems/process; Constraints: avoid unscoped complexity
- Customer Advocate: Focus: customer outcomes; Constraints: avoid ignoring feedback
- Culture Lead: Focus: team health; Constraints: avoid toxic practices

## Policies
- Depth: brief 2–3, standard 5–7, deep 10+
- Discovery: MCP listing and explicit prefixes (e.g., /council.consult, /persona.consult)
- Overrides: workspace-level `.council/personas.json` (no secrets). Allowed fields per persona: soul, focus, constraints. See `.council/personas.json.example` for a template.

## Run
```bash
cd server
npm install
npm run build
npm run start
```

## Tests
```bash
npm run test
```
