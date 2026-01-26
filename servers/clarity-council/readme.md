# Clarity Council

Multi-persona AI consultation tool for strategic decision-making

## Overview

Clarity Council provides consultation on strategic problems and decisions from multiple expert perspectives:

- **Growth Strategist** - Revenue, user acquisition, and growth metrics
- **Financial Officer** - Unit economics, cash flow, and financial impact  
- **Devil's Advocate** - Risk assessment and failure modes
- **Ops Architect** - Process, scalability, and operational feasibility
- **Customer Advocate** - Customer value and user experience
- **Culture Lead** - Team health, communication, and sustainability

## Features

- **Multi-persona consultation** - Get advice from 6+ specialized perspectives simultaneously
- **Customizable depth** - Choose brief summaries, standard analysis, or deep exploration
- **Persona overrides** - Customize perspectives to match your organization's values
- **Hot-reload configuration** - Update persona definitions without restarting
- **Structured logging** - Full request tracing and diagnostics
- **Health monitoring** - Memory, disk, and uptime metrics

## Quick Start

### Start the Server

```bash
docker run -d \
  -p 8080:8080 \
  -p 8000:8000 \
  -e LOG_LEVEL=info \
  clarity-council:1.0.0
```

### Check Health

```bash
curl http://localhost:8080/health
```

### Get Consultation

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "council_consult",
      "arguments": {
        "user_problem": "Should we expand to a new market?",
        "context": "We have 10% monthly growth in current market",
        "desired_outcome": "Decision with risk assessment",
        "depth": "standard"
      }
    },
    "id": 1
  }'
```

## Configuration

### Environment Variables

- `HTTP_PORT` (default: 8080) - HTTP server port
- `HTTPS_PORT` (default: 8000) - HTTPS server port  
- `LOG_LEVEL` (default: info) - Logging level (debug, info, warn, error)
- `LOG_FORMAT` (default: json) - Log format (json, text)
- `WORKSPACE_DIR` (default: ~/.council) - Directory for persona overrides

### Persona Customization

Create `~/.council/personas.overrides.json`:

```json
{
  "version": "1.0",
  "lastModified": "2026-01-26T12:00:00Z",
  "overrides": {
    "Growth Strategist": {
      "enabled": true,
      "customSoul": "Growth-focused strategist specializing in enterprise expansion"
    }
  }
}
```

## Documentation

- [Setup Guide](./docs/setup-docker-desktop.md)
- [Troubleshooting](./docs/docker-troubleshooting.md)
- [Persona Customization](./docs/personas.md)
- [MCP Protocol Compliance](./docs/mcp-compliance.md)

## License

MIT License - See LICENSE file for details
