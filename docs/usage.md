# Usage

This server provides JSON-RPC over HTTP and HTTPS for MCP clients.

- HTTP: `http://localhost:8080` (enabled by default)
- HTTPS: `https://localhost:8000` (self-signed cert auto-generated)

Environment variables:

- `HTTP_ENABLED`: `true`/`false` (default `true`)
- `HTTP_PORT`: default `8080`
- `HTTPS_PORT`: default `8000`
- `CERT_DIR`: directory for `cert.pem` and `key.pem` (auto-generated if missing)

## Configuring with VS Code

To use the Clarity Council MCP server with VS Code, you need to add it to your VS Code settings. There are two approaches:

### Option 1: Manual Configuration (Recommended for Development)

1. Open VS Code Settings:
   - macOS: `Cmd+,`
   - Windows/Linux: `Ctrl+,`

2. Search for "modelContextProtocol" or navigate to the raw JSON settings

3. Click "Edit in settings.json" (or open Command Palette → Preferences: Open User Settings (JSON))

4. Add the Clarity Council server to your `modelContextProtocol` settings:

```json
{
  "modelContextProtocol": {
    "servers": {
      "clarity-council": {
        "command": "node",
        "args": ["-e", "require('http').request({hostname:'localhost',port:8080,path:'/',method:'GET'},(r)=>console.log(r.statusCode===200?'ready':'error')).end()"],
        "disabled": false,
        "alwaysAllow": []
      }
    }
  }
}
```

Or, for HTTPS (self-signed certificate):

```json
{
  "modelContextProtocol": {
    "servers": {
      "clarity-council": {
        "command": "node",
        "args": ["-e", "require('https').request({hostname:'localhost',port:8000,path:'/',method:'GET',rejectUnauthorized:false},(r)=>console.log(r.statusCode===200?'ready':'error')).end()"],
        "disabled": false,
        "alwaysAllow": []
      }
    }
  }
}
```

### Option 2: Docker MCP Toolkit (Production Setup)

If you have Docker Desktop with MCP Toolkit installed, you can use the automated registration:

1. Run the rebuild script with MCP support enabled:
   
   **macOS/Linux**:
   ```bash
   ./rebuild-docker.sh
   ```
   
   **Windows**:
   ```powershell
   .\rebuild-docker.ps1
   ```

2. The script will:
   - Build and start the Docker container
   - Create a catalog entry for the server
   - Register it with Docker MCP Toolkit
   - Optionally connect VS Code

3. VS Code should auto-detect the server. If not, reload the window (Cmd+R on macOS, Ctrl+Shift+F5 on Windows/Linux)

### Verifying the Connection

1. Open the VS Code Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Look for MCP-related commands or check the notification area
3. Test by using Claude features that should now have access to the Clarity Council tools

### Troubleshooting

**Server not detected in VS Code:**
- Ensure the MCP server is running: `docker compose ps` should show `clarity-council-mcp` as healthy
- Check the health endpoint manually: `curl http://localhost:8080/`
- Reload VS Code window (Cmd+R / Ctrl+Shift+F5)

**Certificate errors (HTTPS):**
- If using HTTPS and you see certificate warnings, this is expected with self-signed certificates
- Add `"rejectUnauthorized": false` to the server config (development only)
- Or accept the certificate in your browser first: `https://localhost:8000`

**Port already in use:**
- Check what's running on ports 8080 and 8000: `lsof -i :8080` (macOS/Linux)
- Update the port numbers in `docker-compose.yml` or use environment variables

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

## Available Tools

### council_consult

Multi-persona consultation with synthesis. Consults multiple personas and produces agreements, conflicts, and next steps.

**Parameters**:
- `user_problem` (required): The problem or decision to address
- `context` (optional): Background information
- `desired_outcome` (optional): Success criteria
- `constraints` (optional): List of constraints
- `depth` (optional): `brief`, `standard`, or `deep`
- `selected_personas` (optional): Array of persona names to consult

### persona_consult

Single persona consultation. Consults one persona and returns structured advice.

**Parameters**:
- `persona_name` (required): Name of persona to consult
- `user_problem` (required): The problem or decision
- `context`, `desired_outcome`, `constraints`, `depth` (same as council_consult)

### council_define_personas

View or override persona configurations at workspace level.

**Parameters**:
- `overrides` (optional): Persona configuration overrides

### council_discuss (Interactive Mode)

Interactive multi-turn council discussion with clarifications, debate cycles, and consolidated final answer.

**Parameters**:
- `requestText` (required for new sessions): Initial user request
- `sessionId` (optional): Continue existing session
- `answer` (optional): Answer to clarification question
- `personasRequested` (optional): Array of persona names to include
- `extendedDebate` (optional, default: false): Enable extended debate mode (20 cycles instead of 10)
- `revisitSkipped` (optional, default: false): Revisit previously skipped clarification questions
- `interactiveMode` (optional, default: true): Enable/disable interactive mode

**Response**:
- `sessionId`: Unique session identifier
- `status`: Current session status (`clarifying`, `debating`, `completed`, etc.)
- `message`: Human-readable status message
- `nextAction`: Next action for client (`answer_question`, `wait_for_debate`, `review_final_answer`, `none`)
- `nextQuestion`: Next clarification question details (if status = `clarifying`)
- `debateExchanges`: Formatted markdown showing all debate exchanges with persona attribution
- `currentState`: Full session state

**Workflow**:

1. **Start Session**: Call with `requestText`
   - System detects ambiguity and asks clarification questions (if needed)
   - Or proceeds directly to debate if request is clear

2. **Answer Questions**: Call with `sessionId` and `answer`
   - Answer clarification questions one-at-a-time
   - Use "skip" or "defer" to skip questions (system will state assumptions)
   - System transitions to debate phase after all questions answered/skipped

3. **Council Debate**: System orchestrates persona discussion
   - Debate cycles shown in `debateExchanges` with persona attribution
   - Up to 10 cycles by default (20 with `extendedDebate: true`)
   - Each persona contributes their perspective

4. **Final Answer**: System generates consolidated response
   - Incorporates clarification answers
   - States assumptions for skipped questions
   - Shows consensus/resolution from debate

5. **Revisit Questions** (optional): Call with `revisitSkipped: true`
   - Answer previously skipped questions
   - System regenerates response with new information

**Example - Start Interactive Session**:

```bash
curl -s http://localhost:8080 -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "council_discuss",
      "arguments": {
        "requestText": "How should we architect our new microservices platform?"
      }
    }
  }' | jq
```

**Example - Answer Clarification**:

```bash
curl -s http://localhost:8080 -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "council_discuss",
      "arguments": {
        "sessionId": "<session-id-from-previous-response>",
        "answer": "Our primary goal is high availability and scalability"
      }
    }
  }' | jq
```

**Example - Extended Debate**:

```bash
curl -s http://localhost:8080 -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "council_discuss",
      "arguments": {
        "requestText": "Complex architecture decision requiring deep analysis",
        "extendedDebate": true
      }
    }
  }' | jq
```

**Example - Revisit Skipped Questions**:

```bash
curl -s http://localhost:8080 -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "council_discuss",
      "arguments": {
        "sessionId": "<session-id>",
        "revisitSkipped": true
      }
    }
  }' | jq
```
