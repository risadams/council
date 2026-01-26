# Usage

This server provides JSON-RPC over HTTP and HTTPS for MCP clients.

- HTTP: `http://localhost:8080` (enabled by default)
- HTTPS: `https://localhost:8000` (self-signed cert auto-generated)

Environment variables:

- `HTTP_ENABLED`: `true`/`false` (default `true`)
- `HTTP_PORT`: default `8080`
- `HTTPS_PORT`: default `8000`
- `CERT_DIR`: directory for `cert.pem` and `key.pem` (auto-generated if missing)

Health check:

Send a GET to `/`:

```bash
curl -s http://localhost:8080/
```

JSON-RPC basics:

- `initialize`
- `tools/list`
- `tools/call`

Example: list tools

```bash
curl -s http://localhost:8080 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq
```

PowerShell example:

```powershell
$body = '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
Invoke-WebRequest -Uri http://localhost:8080 -Method POST -ContentType 'application/json' -Body $body | Select-Object -ExpandProperty Content
```

Responses wrap tool output inside `result.content` with a single item like `{ type: "text", text: "..." }` for MCP compatibility.
