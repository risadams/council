# council Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-21

## Active Technologies
- TypeScript 5.9.3, Node.js 22 LTS + Docker Desktop MCP Toolkit (beta), MCP Protocol, node:22-bookworm-slim base image, Docker Compose (002-docker-desktop-mcp)
- Docker volumes (.council workspace, persona.overrides.json), ephemeral container logs (002-docker-desktop-mcp)

- Node.js 20+, TypeScript 5.x + MCP SDK (Node), `ajv` for JSON Schema validation, `pino` for structured logs (001-clarity-council-mcp)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

Node.js 20+, TypeScript 5.x: Follow standard conventions

## Recent Changes
- 002-docker-desktop-mcp: Added TypeScript 5.9.3, Node.js 22 LTS + Docker Desktop MCP Toolkit (beta), MCP Protocol, node:22-bookworm-slim base image, Docker Compose

- 001-clarity-council-mcp: Added Node.js 20+, TypeScript 5.x + MCP SDK (Node), `ajv` for JSON Schema validation, `pino` for structured logs

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
