# Testing Clarity Council MCP Tools in VS Code

## Quick Start Testing

Since the MCP server requires complex ESM/ts-node configuration, we recommend testing the tools via:

### Option 1: Run Tests (Simplest) ✅
All 34 tests verify functionality and can be run locally:

```bash
cd server
npm test -- --run
```

**What gets tested:**
- ✅ council.consult: multi-persona synthesis
- ✅ persona.consult: single-persona guidance  
- ✅ council.define_personas: persona overrides
- ✅ All 6 personas with correct tone/structure
- ✅ Devil's Advocate automatic risk analysis
- ✅ Depth scaling (brief/standard/deep)
- ✅ JSON schema validation
- ✅ Error handling

### Option 2: Integration with VS Code MCP (Recommended for Real Testing)

To use the tools in VS Code Chat:

#### Step 1: Configure VS Code MCP Server

Update your VS Code settings or `~/.kdo/mcp-settings.json`:

```json
{
  "mcpServers": {
    "clarity-council": {
      "command": "node",
      "args": [
        "--require",
        "tsx/cjs",
        "/Users/ris/development/council/server/src/index.ts"
      ]
    }
  }
}
```

#### Step 2: Test Tool Discovery

In VS Code Chat, type:
```
@council.consult
@persona.consult  
@council.define_personas
```

You should see tool suggestions appear.

#### Step 3: Test Each Tool

**Test 1: council.consult (Multi-Persona)**
```
/council.consult user_problem:"Should we pivot to product-led growth?" context:"B2B SaaS, $1M ARR, 20 customers" desired_outcome:"Growth strategy" depth:standard
```

Expected output:
- 6 persona responses (Growth Strategist, Financial Officer, Devil's Advocate, Ops Architect, Customer Advocate, Culture Lead)
- Synthesis with agreements, conflicts, risks, next_steps
- Confidence levels tied to depth

**Test 2: persona.consult (Single Persona)**
```
/persona.consult persona_name:"Financial Officer" user_problem:"Launch premium tier at 2x current price" context:"High churn rate" depth:brief
```

Expected output:
- Single persona response with Financial Officer tone
- Focused on unit economics, ROI, payback period
- Brief depth = 2-3 advice items

**Test 3: council.define_personas (View & Override)**
```
/council.define_personas
```

Expected output:
- All 6 persona contracts with Soul, Focus, Constraints
- Permission matrix
- Saved to `.council/personas.json`

**Test 4: Apply Persona Overrides**
```
/council.define_personas overrides:{"Growth Strategist":{"soul":"Product-led growth specialist","focus":["free-to-paid conversion","viral loops"]}}
```

Then run another `council.consult` to see the override applied.

---

## Manual Test Scenarios

### Scenario A: Growth Decision
**Problem:** "We can grow 30% MRR by adding enterprise features (expensive dev) or PLG (cheap, risky)"

```
/council.consult user_problem:"Enterprise vs. PLG growth path" context:"SaaS company, 100 customers, $100K MRR" desired_outcome:"Choose growth strategy" depth:deep
```

**Verify:**
- Devil's Advocate surfaces execution risks and market timing risks
- Financial Officer emphasizes payback period and cash flow impact
- Growth Strategist and Customer Advocate may conflict on customer segment
- Synthesis identifies strategic vs. pragmatic tensions

### Scenario B: Quick Triage
**Problem:** "Should we hire to handle support overflow?"

```
/council.consult user_problem:"Hire support staff" context:"Growing support queue, current team saturated" desired_outcome:"Staffing plan" depth:brief
```

**Verify:**
- Fast response (brief depth)
- 2-3 key points per persona
- Devil's Advocate flags hiring cost vs. revenue impact

### Scenario C: Persona Consistency
**Problem:** Test the same question with different personas

```
/persona.consult persona_name:"Culture Lead" user_problem:"Remote-first transition" depth:standard
```

Then test with:
```
/persona.consult persona_name:"Ops Architect" user_problem:"Remote-first transition" depth:standard
```

**Verify:**
- Culture Lead focuses on team health, communication, burnout
- Ops Architect focuses on process, tooling, scaling systems
- Both handle same problem differently based on soul/focus/constraints

---

## Troubleshooting

### Issue: Tools Not Discovered
**Solution:** Restart VS Code and check MCP server logs

### Issue: Tool Responds with Empty Output
**Solution:** Check `.council/personas.json` exists (should be created on first run)

### Issue: Persona Overrides Not Applied
**Solution:** Verify `.council/personas.json` is valid JSON:
```bash
cat .council/personas.json | jq .
```

### Issue: Schema Validation Error
**Solution:** Check input format matches schema in `server/src/schemas/`

---

## Expected Tool Behaviors

### council.consult
- Returns 6 persona responses + synthesis
- Depth scales advice items: brief (2-3), standard (3-5), deep (5-10+)
- Devil's Advocate always included with counterpoints
- Synthesis shows agreements and genuine conflicts
- Confidence level matches depth (brief=low, standard=med, deep=high)

### persona.consult  
- Returns single persona response
- Tone matches persona soul/focus/constraints
- All 6 personas should be selectable
- Unknown persona name returns validation error

### council.define_personas
- Returns current contracts for all 6 personas
- Accepts overrides for soul, focus, constraints
- Persists to `.council/personas.json`
- Validates overrides (only allows known fields)
- Returns permission matrix

---

## Test Coverage Reference

Run tests to verify complete coverage:

```bash
cd server && npm test -- --run --reporter=verbose
```

Test breakdown:
- **Unit (10 files):** Schema validation, error handling, formatting
- **Integration (4 files):** Tool invocation, roundtrips, overrides  
- **Golden (3 files):** Persona contracts, tone, Devil's Advocate

All 34 tests should pass with 100% success rate.

---

## Next Steps

1. ✅ Run full test suite: `npm test -- --run`
2. 🔧 Configure VS Code MCP integration
3. 📝 Test each tool with provided scenarios
4. 🎯 Verify outputs match expected behaviors
5. 🚀 Deploy and share with team

