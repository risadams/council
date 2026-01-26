# Tools Reference

This server registers three MCP tools. Use `tools/call` with the `name` shown below.

## council_consult
Consult multiple personas and produce a synthesis: agreements, conflicts, risks/tradeoffs, and next steps.

Input fields:
- `user_problem` (string, required): what you need help with
- `context` (string, optional): relevant background
- `desired_outcome` (string, optional): what success looks like
- `constraints` (string[], optional): hard limits or preferences
- `selected_personas` (string[], optional): subset of persona names to consult; defaults to a curated set
- `depth` ("brief" | "standard" | "deep", optional; default "standard")

Output:
- Structured JSON internally, plus formatted Markdown returned via `result.content[0].text`

Example (curl):
```bash
curl -s http://localhost:8080 -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"council_consult",
      "arguments":{
        "user_problem":"We need to improve onboarding conversion",
        "context":"Self-serve SaaS, PLG motion",
        "desired_outcome":"+10% activated users in 60 days",
        "constraints":["under $5k budget"],
        "depth":"standard"
      }
    }
  }'
```

Example (PowerShell):
```powershell
$body = '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"council_consult","arguments":{"user_problem":"We need to improve onboarding conversion","context":"Self-serve SaaS, PLG motion","desired_outcome":"+10% activated users in 60 days","constraints":["under $5k budget"],"depth":"standard"}}}'
$response = Invoke-WebRequest -Uri http://localhost:8080 -Method POST -ContentType 'application/json' -Body $body
($response.Content | ConvertFrom-Json).result.content[0].text
```

## persona_consult
Consult a single persona for focused advice, assumptions, questions, next steps, and confidence.

Input fields:
- `persona_name` (string, required): one of the defined persona names
- `user_problem`, `context`, `desired_outcome`, `constraints`, `depth`: same meanings as above

Example (curl):
```bash
curl -s http://localhost:8080 -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"persona_consult",
      "arguments":{
        "persona_name":"Devil’s Advocate",
        "user_problem":"Migrate monolith to services",
        "context":"Traffic spikes monthly, limited SRE capacity",
        "depth":"brief"
      }
    }
  }'
```

## council_define_personas
View persona contracts and apply workspace-level overrides.

Input fields:
- `overrides` (object, optional): shape `{ "Persona Name": { soul?, focus?, constraints? } }`

Behavior:
- Validates overrides against known persona names and allowed fields
- Persists overrides in `.council/personas.json` in the workspace
- Returns effective persona contracts with overrides applied

Example (curl):
```bash
curl -s http://localhost:8080 -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"council_define_personas",
      "arguments":{
        "overrides":{
          "Growth Strategist":{
            "focus":["MRR growth","pricing experiments","partner channels"]
          }
        }
      }
    }
  }'
```

Notes:
- The internal contract strings list allowed tools as `council.consult` and `persona.consult` for clarity; call names you use with MCP are `council_consult` and `persona_consult`.
- Responses are returned via `result.content[0].text` as human-readable Markdown.
