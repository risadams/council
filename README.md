# Clarity Council MCP

A **persona-driven MCP (Model Context Protocol) server** for multi-perspective decision-making. Consult multiple expert personas—each with distinct viewpoints and constraints—to surface agreements, conflicts, and actionable next steps.

**Ideal for**: Product strategy, engineering decisions, architectural reviews, and any decision requiring multiple perspectives.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [Docker Deployment](#docker-deployment)
- [VS Code Integration](#vs-code-integration)
- [Tools](#tools)
- [Persona Suite](#persona-suite)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [API Reference](#api-reference)

---

## 🚀 Quick Start

### Option 1: Local Development

```bash
cd server
npm install
npm start
```

The MCP server will start and output connection details.

### Option 2: Docker (Recommended for VS Code Integration)

```bash
docker-compose up -d
```

The server will be available at:
- **HTTP** (local, no TLS): `http://localhost:8080/`
- **HTTPS** (production): `https://localhost:8000/`

---

## ✨ Features

- **Multi-Persona Consultation**: Get structured advice from 6+ expert personas simultaneously
- **Synthesis Engine**: Automatically identifies agreements, conflicts, and risks
- **Depth Scaling**: Control response granularity (brief, standard, deep)
- **Persona Customization**: Override persona definitions at runtime
- **HTTPS Server**: Secure container-based deployment with VS Code integration
- **Transparent Contracts**: Each persona has explicit soul, focus, and constraints
- **Schema Validation**: JSON Schema contracts for all inputs/outputs
- **Structured Logging**: Pino-based request tracing with performance metrics

---

## 📦 Installation

### Prerequisites

- **Node.js** 20+ (for local development)
- **Docker & Docker Compose** (for containerized deployment)
- **VS Code 1.96+** with MCP support (for client integration)

### From Source

```bash
git clone <repo-url> council
cd council/server
npm install
npm run build
npm start
```

### From Docker

```bash
docker-compose up -d
# Logs: docker-compose logs -f clarity-council
```

---

## 🐳 Docker Deployment

### Build & Run

```bash
# Build image
docker build -t clarity-council-mcp:latest .

# Run with docker-compose
docker-compose up -d

# Check status
docker ps | grep clarity-council
docker-compose logs -f
```

### HTTPS Configuration

The Docker image automatically generates self-signed HTTPS certificates on first run:

```
/app/certs/
├── cert.pem      # Server certificate
└── key.pem       # Private key
```

**To use custom certificates**:

```bash
# Copy your certificates
mkdir -p ./certs
cp /path/to/your/cert.pem ./certs/
cp /path/to/your/key.pem ./certs/

# Start container
docker-compose up -d
```

### Health Check

```bash
curl -k https://localhost:8000/
# Response: {"status": "healthy", "service": "clarity-council-mcp", ...}
```

---

## 🔗 VS Code Integration

### 1. Install MCP Extension

- Install [MCP Extension](https://marketplace.visualstudio.com/items?itemName=anthropic-ai.claude-dev) for VS Code

### 2. Configure `settings.json`

Add to VS Code settings:

```json
{
  "mcpServers": {
    "clarity-council": {
      "url": "https://localhost:8000",
      "options": {
        "rejectUnauthorized": false
      },
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. Start Docker Container

```bash
docker-compose up -d
```

### 4. Use in VS Code

Once connected, tools are available in the chat:

```
@Clarity-Council council_consult: What should we prioritize for Q2 growth?
```

**Alternatively, configure for HTTP (avoids cert warnings)**:

```json
{
  "mcpServers": {
    "clarity-council": {
      "url": "http://localhost:8080"
    }
  }
}
```

---

## 🎯 Tools

### Calling Tools via HTTP/HTTPS

Tools are exposed via JSON-RPC 2.0 over HTTP POST to `/`:

#### Example: Call `council_consult` via cURL

```bash
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "council_consult",
      "arguments": {
        "user_problem": "We need to grow MRR by 30%",
        "context": "B2B SaaS, 100 customers, $50K ARR",
        "desired_outcome": "Sustainable growth without burning runway",
        "constraints": ["Cannot reduce customer support", "Must maintain 99.9% uptime"],
        "depth": "standard"
      }
    }
  }'
```

#### Example: List Available Tools

```bash
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

---

### `council_consult`

Gather perspectives from multiple personas and produce a synthesis.

**Input**:
```json
{
  "user_problem": "We need to grow MRR by 30%",
  "context": "B2B SaaS, 100 customers, $50K ARR",
  "desired_outcome": "Sustainable growth without burning runway",
  "constraints": ["Cannot reduce customer support", "Must maintain 99.9% uptime"],
  "selected_personas": ["Growth Strategist", "Financial Officer", "Ops Architect"],
  "depth": "standard"
}
```

**Output**:
```json
{
  "responses": [
    {
      "persona": "Growth Strategist",
      "summary": "Growth Strategist: Grow MRR by 30%",
      "advice": "- Focus on product-led growth loops...",
      "assumptions": ["Current acquisition cost is $X", "Churn rate is Y%"],
      "questions": ["What is your current CAC:LTV ratio?", "What is your bottleneck?"],
      "next_steps": ["Map acquisition channels", "Run retention experiments"],
      "confidence": "high",
      "confidence_rationale": "Clear growth context with business metrics"
    }
  ],
  "synthesis": {
    "agreements": ["Prioritize customer retention", "Test new channels"],
    "conflicts": ["Growth speed vs. operational stability"],
    "risks_tradeoffs": ["Rapid scaling may impact support quality"],
    "next_steps": ["Define success metrics", "Assign owners", "Review weekly"],
    "notes": ["Depth: standard"]
  }
}
```

**Depth Modes**:
- **brief** (1–2 min): 2–3 advice items, 1–2 questions, 2–3 next steps
- **standard** (3–5 min): 3–5 advice items, 2–4 questions, 3–5 next steps
- **deep** (5–10+ min): 5–10+ advice items, 4–8 questions, 5–10+ next steps

---

### `persona_consult`

Get structured advice from a single persona.

**Input**:
```json
{
  "persona_name": "Growth Strategist",
  "user_problem": "Launch premium tier",
  "context": "Current ARPU: $500/year, growth target: 50% YoY",
  "desired_outcome": "Increase revenue without high CAC",
  "depth": "standard"
}
```

**Output**: Single persona response (same format as council.consult responses[i])

---

### `council_define_personas`

View or override persona definitions.

**Input**:
```json
{
  "overrides": {
    "Growth Strategist": {
      "soul": "Custom soul statement",
      "focus": ["custom", "focus", "areas"]
    }
  }
}
```

**Output**:
```json
{
  "personas": {
    "Growth Strategist": {
      "soul": "Custom soul statement",
      "focus": ["custom", "focus", "areas"]
    },
    ...
  },
  "message": "Personas updated and persisted to .council/personas.json"
}
```

---

## 👥 Persona Suite

The Clarity Council ships with **6 default personas** for business decision-making:

### Default Personas

1. **Growth Strategist** (Expansion & Market Strategy)
   - Focus: market opportunities, user acquisition, product-market fit, growth experiments
   - Constraints: Sustainable growth and competitive positioning

2. **Financial Officer** (Budget & ROI Focus)
   - Focus: revenue, costs, burn rate, unit economics, financial sustainability
   - Constraints: Fiscal responsibility and profitability

3. **Devil's Advocate** (Risk & Critical Analysis)
   - Focus: challenging assumptions, identifying risks, stress-testing plans
   - Constraints: Constructive skepticism and risk mitigation

4. **Ops Architect** (Execution & Scalability)
   - Focus: operational processes, systems thinking, scalability, resource planning
   - Constraints: Operational excellence and team efficiency

5. **Customer Advocate** (User Experience & Satisfaction)
   - Focus: customer needs, user feedback, product usability, customer success
   - Constraints: Customer-centricity and retention

6. **Culture Lead** (Team Health & Values)
   - Focus: team morale, company culture, hiring, retention, organizational values
   - Constraints: Sustainable team dynamics and alignment

### Custom Personas

Override or add personas via `.council/personas.json`:

```json
{
  "Product Manager": {
    "soul": "Customer outcomes and feature prioritization expert",
    "focus": ["customer research", "roadmap", "feature prioritization"]
  }
}
```

Restart the server to pick up changes.

---

## 🏗️ Architecture

### Project Structure

```
council/
├── server/
│   ├── src/
│   │   ├── index.ts                    # Stdio MCP server entry point
│   │   ├── https-server.ts             # HTTPS wrapper for Docker
│   │   ├── personas/
│   │   │   ├── contracts.ts            # Persona type definitions
│   │   │   ├── generators.ts           # Draft generation logic
│   │   │   └── devilsAdvocate.ts       # Devil's Advocate persona
│   │   ├── tools/
│   │   │   ├── council.consult.ts      # Multi-persona consultation
│   │   │   ├── persona.consult.ts      # Single-persona consultation
│   │   │   └── council.define_personas.ts  # Persona management
│   │   ├── schemas/
│   │   │   └── *.json                  # JSON Schema contracts
│   │   └── utils/
│   │       ├── logger.ts               # Pino-based logging
│   │       ├── validation.ts           # AJV schema validation
│   │       ├── synthesis.ts            # Synthesis engine
│   │       ├── depth.ts                # Depth scaling logic
│   │       ├── personaFormatter.ts     # Response formatting
│   │       ├── confidence.ts           # Confidence scoring
│   │       ├── errors.ts               # Error handling
│   │       └── mcpAdapter.ts           # MCP SDK adapter
│   ├── dist/                           # Compiled output
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── tests/
│   ├── unit/                           # Unit tests
│   ├── integration/                    # Integration tests
│   └── golden/                         # Golden output tests
├── specs/                              # Design specifications
├── Dockerfile                          # Docker image definition
├── docker-compose.yml                  # Docker Compose configuration
└── README.md                           # This file
```

### Data Flow

```
User Input (JSON)
    ↓
[Validation] → JSON Schema validation
    ↓
[Persona Selection] → selectPersonas()
    ↓
[Draft Generation] → generatePersonaDraft() per persona
    ↓
[Formatting] → formatPersonaDraft() to response format
    ↓
[Synthesis] → buildSynthesis() (council.consult only)
    ↓
[Logging] → Structured logging with request metrics
    ↓
Output (JSON)
```

---

## 🛠️ Development

### Setup

```bash
cd server
npm install
```

### Run in Development Mode

```bash
npm run dev
# Rebuilds on file changes, uses ts-node
```

### Build for Production

```bash
npm run build
# Outputs to server/dist/
```

### Generate HTTPS Certificates (Development)

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem \
  -days 365 -nodes -subj "/CN=localhost"
```

---

## ✅ Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test -- --grep "council.consult"
npm test -- unit/
npm test -- integration/
```

### Test Categories

- **Unit**: Schema validation, persona selection, confidence scoring
- **Integration**: Full consultation flows, synthesis generation
- **Golden**: Output shape and structure validation

### Test Structure

```typescript
describe("council.consult integration", () => {
  it("validates input and returns schema-compliant output", async () => {
    const tool = await setupTool();
    const input = { user_problem: "Grow MRR", depth: "brief" };
    const output = await tool.handler(input);
    
    expect(output.responses.length).toBeGreaterThanOrEqual(1);
    expect(output.synthesis).toHaveProperty("agreements");
    expect(output.synthesis).toHaveProperty("conflicts");
  });
});
```

---

## 📡 API Reference

### Schema Specifications

All tools use JSON Schema for contracts. Schemas are in `server/src/schemas/`:

#### `council.consult.input.schema.json`

```json
{
  "type": "object",
  "required": ["user_problem"],
  "properties": {
    "user_problem": { "type": "string", "minLength": 1 },
    "context": { "type": "string" },
    "desired_outcome": { "type": "string" },
    "constraints": { "type": "array", "items": { "type": "string" } },
    "selected_personas": {
      "type": "array",
      "items": { "type": "string", "enum": ["<persona names>"] }
    },
    "depth": { "enum": ["brief", "standard", "deep"], "default": "standard" }
  }
}
```

#### Response Status Codes

- **200**: Success
- **400**: Validation error (invalid input schema)
- **500**: Internal server error (unexpected exception)

### Error Format

```json
{
  "type": "error",
  "error": {
    "type": "validation|internal",
    "message": "Human-readable error",
    "details": {}
  }
}
```

---

## 🤝 Contributing

### Code Style

- TypeScript with ES modules
- Prettier + ESLint (via npm scripts)
- 80-char line width for readability

### Adding a New Persona

1. Create persona definition in `.council/personas.json`:
   ```json
   {
     "Your Persona": {
       "soul": "One-sentence identity",
       "focus": ["focus", "areas"]
     }
   }
   ```

2. Add tests in `tests/integration/council.consult.spec.ts`

3. Restart server

### Adding a New Tool

1. Create tool file: `server/src/tools/my.tool.ts`
2. Implement `registerMyTool(server: ToolRegistrar)` function
3. Export from `server/src/index.ts`
4. Add input/output schemas: `server/src/schemas/my.tool.*.schema.json`
5. Add tests in `tests/integration/`

---

## 📝 License

[Your License]

---

## 🆘 Support

### Common Issues

**Issue**: "Cannot find module" errors after docker build
- **Solution**: Ensure `npm install` runs in Dockerfile build stage

**Issue**: HTTPS certificate warnings in VS Code
- **Solution**: Use self-signed certs (set `rejectUnauthorized: false` in settings.json)

**Issue**: Docker container exits immediately
- **Solution**: Check logs: `docker-compose logs clarity-council`

### Debugging

Enable verbose logging:

```bash
export LOG_LEVEL=debug
npm start
```

Check request traces:

```bash
docker-compose logs -f clarity-council | grep council.consult
```

---

## 🗂️ Related Specs

- [Clarity Council Specification](specs/001-clarity-council-mcp/spec.md)
- [Data Model](specs/001-clarity-council-mcp/data-model.md)
- [Task Checklist](specs/001-clarity-council-mcp/tasks.md)
- [Quickstart Guide](specs/001-clarity-council-mcp/quickstart.md)
