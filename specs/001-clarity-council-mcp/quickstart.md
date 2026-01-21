# Quickstart: Clarity Council MCP Tool Suite

This guide helps you run the MCP server locally and use the tools in VS Code.

## Prerequisites
- Node.js 20+
- npm (or pnpm/yarn)
- VS Code with MCP support

## Setup

```bash
# From server directory
cd server
npm install
npm run build
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

## Run Locally

```bash
cd server

# Build TypeScript
npm run build

# Start MCP server
npm run start
```

## Run Tests

```bash
cd server

# Run full test suite (34+ tests)
npm test -- --run
```

## Using in VS Code
- Tools are discoverable via MCP tool listing.
- Explicit chat prefixes also supported (e.g., `/council.consult`).

### Example Prompts

**Council Consult** (multi-persona synthesis):
```
/council.consult user_problem:"We need to grow MRR by 30% in 2 quarters" context:"B2B SaaS, 100 customers" desired_outcome:"Sustainable growth" depth:standard
```

**Persona Consult** (single persona):
```
/persona.consult persona_name:"Financial Officer" user_problem:"Launch premium tier" depth:brief
```

**Define Personas** (view/override contracts):
```
/council.define_personas overrides:{"Growth Strategist":{"focus":["product-led growth"]}}
```

## Testing Guidance
- **Unit tests**: Schema validation (inputs/outputs), error mapping, persona formatter.
- **Integration tests**: Tool handlers (council.consult, persona.consult, define_personas), override merging.
- **Golden tests**: Persona tone/structure consistency, Devil's Advocate counterpoints.
- **Error tests**: Invalid inputs, malformed overrides, unknown personas, extra fields.

## Observability
- **Request IDs**: Correlation IDs in all tool logs (pino structured logs).
- **Timing**: Request start/duration tracked in milliseconds.
- **Error Categories**: validation, server_error tagged per failure.
- **Logs**: JSON structured format with requestId, tool, success, duration, errorCategory.
