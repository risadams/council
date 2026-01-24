import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { createLogger } from "./utils/logger.js";

import { registerCouncilConsult } from "./tools/council.consult.js";
import { registerPersonaConsult } from "./tools/persona.consult.js";
import { registerDefinePersonas } from "./tools/council.define_personas.js";
import { createMcpToolRegistrar } from "./utils/mcpAdapter.js";

const logger = createLogger();

const personaNames = [
  "Growth Strategist",
  "Financial Officer",
  "Devil’s Advocate",
  "Ops Architect",
  "Customer Advocate",
  "Culture Lead"
] as const;

const depthEnum = z.enum(["brief", "standard", "deep"]);

const personaConsultInputSchema = {
  persona_name: z.enum(personaNames),
  user_problem: z.string().min(1),
  context: z.string().optional(),
  desired_outcome: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  depth: depthEnum.default("standard")
};

const personaConsultOutputSchema = {
  persona: z.string(),
  summary: z.string(),
  advice: z.string(),
  assumptions: z.array(z.string()),
  questions: z.array(z.string()),
  next_steps: z.array(z.string()).min(1),
  confidence: z.enum(["low", "medium", "high"]),
  confidence_rationale: z.string().optional()
};

const councilConsultInputSchema = {
  user_problem: z.string().min(1),
  context: z.string().optional(),
  desired_outcome: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  selected_personas: z.array(z.enum(personaNames)).optional(),
  depth: depthEnum.default("standard")
};

const councilConsultOutputSchema = z
  .object({
    responses: z.array(z.object(personaConsultOutputSchema).strict()).min(1),
    synthesis: z
      .object({
        agreements: z.array(z.string()),
        conflicts: z.array(z.string()),
        risks_tradeoffs: z.array(z.string()),
        next_steps: z.array(z.string()).min(1),
        notes: z.array(z.string()).optional()
      })
      .strict()
  })
  .strict();

const personaOverrideSchema = z
  .object({
    soul: z.string().optional(),
    focus: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional()
  })
  .strict();

const definePersonasInputSchema = {
  overrides: z.record(z.string(), personaOverrideSchema).optional()
};

const personaContractSchema = z
  .object({
    name: z.string(),
    soul: z.string(),
    focus: z.array(z.string()),
    constraints: z.array(z.string()),
    allowed_tools: z.array(z.string())
  })
  .strict();

const definePersonasOutputSchema = z
  .object({ personas: z.array(personaContractSchema).min(1) })
  .strict();

async function main() {
  const mcpServer = new McpServer({ name: "clarity-council", version: "0.1.0" });
  const toolRegistrar = createMcpToolRegistrar(mcpServer);

  await registerCouncilConsult(toolRegistrar, {
    inputSchema: councilConsultInputSchema,
    outputSchema: councilConsultOutputSchema
  });
  await registerPersonaConsult(toolRegistrar, {
    inputSchema: personaConsultInputSchema,
    outputSchema: z.object(personaConsultOutputSchema).strict()
  });
  await registerDefinePersonas(toolRegistrar, {
    inputSchema: definePersonasInputSchema,
    outputSchema: definePersonasOutputSchema
  });

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info({ event: "server_started" }, "Clarity Council MCP server started");
}

main().catch((err) => {
  logger.error({ err }, "Fatal error starting MCP server");
  process.exit(1);
});
