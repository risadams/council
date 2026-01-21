# Quickstart: Clarity Council MCP Tool Suite

This guide helps you run the MCP server locally and use the tools in VS Code.

## Prerequisites
- Node.js 20+
- npm (or pnpm/yarn)
- VS Code with MCP support

## Setup

```bash
# From repository root
cd server
npm init -y
npm install typescript @modelcontextprotocol/sdk ajv pino vitest
npx tsc --init
```

## Project Layout
- server/src/index.ts (MCP server bootstrap)
- server/src/tools/ (council.consult, persona.consult, council.define_personas)
- server/src/personas/ (persona contracts)
- server/src/schemas/ (JSON Schemas from specs/contracts)
- tests/ (unit, integration, golden)
- docs/README.md (setup, usage, examples)

## Workspace Config (Overrides)
- Path: `.council/personas.json`
- Stores only persona contract overrides (Soul, Focus, Constraints, allowed_tools).
- No secrets or user conversations.

## Run Locally (placeholder)
Implement the MCP server bootstrap and tools per the contracts, then run:

```bash
# Run tests (once implemented)
npm run test

# Start server (once implemented)
npm run start
```

## Using in VS Code
- Tools are discoverable via MCP tool listing.
- Explicit chat prefixes also supported (e.g., `/council.consult`).
- Example prompt:

```
/council.consult user_problem:"We need to grow MRR by 30% in 2 quarters" constraints:["budget 100k","no layoffs"] depth:standard
```

## Testing Guidance
- Unit tests: schema validation, error mapping, persona formatter.
- Integration tests: VS Code MCP request/response flows.
- Golden tests: persona tone/structure and challenge checks (Devil’s Advocate counterpoints).

## Notes
- No network calls by default.
- No conversation persistence; only workspace-level persona overrides.
- Observability: use correlation IDs, timing, failure categories.
