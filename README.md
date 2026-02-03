# Clarity Council MCP Server

A Model Context Protocol (MCP) server that provides AI-powered consultation from a council of expert personas. It exposes four tools:

- `council_consult`: consult multiple personas and return a synthesis
- `council_discuss`: interactive multi-turn discussion with clarifications and debate
- `persona_consult`: consult a single persona
- `council_define_personas`: view and override persona contracts in this workspace

Quick links:

- See docs/index.md for a navigable docs index
- See docs/personas.md for persona behavior and roles
- See docs/tools.md for tool reference and usage examples
- See docs/usage.md for setup, server endpoints, and quickstart

If you’re using a VS Code MCP client, point it at `http://localhost:8080` or `https://localhost:8000` and call the tools directly.
