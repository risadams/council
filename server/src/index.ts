import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { getLogConfig, getRootLogger } from "./utils/logger.js";
import { loadConfig } from "./utils/config.js";
import { DockerRegistration } from "./utils/dockerRegistration.js";
import { PersonaConfigWatcher } from "./utils/fileWatcher.js";

import { registerCouncilConsult } from "./tools/council.consult.js";
import { registerPersonaConsult } from "./tools/persona.consult.js";
import { registerDefinePersonas } from "./tools/council.define_personas.js";
import { createMcpToolRegistrar } from "./utils/mcpAdapter.js";
import { setGlobalPersonaWatcher } from "./utils/personaWatcherGlobal.js";

const logger = getRootLogger();
const logConfig = getLogConfig();
logger.info({ event: "logger.init", level: logConfig.level, format: logConfig.format }, "Logger initialized");
const config = loadConfig({ logger });

const dockerRegistration = new DockerRegistration({
  serviceId: "clarity-council-docker-0.1.0",
  name: "Clarity Council",
  version: "0.1.0",
  description: "Multi-persona AI consultation tool for decision-making",
  httpPort: config.httpEnabled ? config.httpPort : undefined,
  httpsPort: config.httpsEnabled ? config.httpsPort : undefined,
  workspaceDir: config.workspaceDir
});

// Initialize persona config watcher
const personaWatcher = new PersonaConfigWatcher(config.workspaceDir, logger);
setGlobalPersonaWatcher(personaWatcher);

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

  // Load initial persona overrides and start watcher
  const initialOverrides = personaWatcher.loadPersonaOverrides();
  logger.info(
    {
      event: "persona.config.init",
      hasOverrides: initialOverrides !== null,
      personaCount: initialOverrides ? Object.keys(initialOverrides.overrides).length : 0
    },
    `Persona configuration initialized with ${initialOverrides ? Object.keys(initialOverrides.overrides).length : 0} overrides`
  );

  personaWatcher.watchForChanges((updatedOverrides) => {
    logger.info(
      {
        event: "persona.config.reloaded",
        personaCount: Object.keys(updatedOverrides.overrides).length,
        timestamp: updatedOverrides.lastModified,
        affectedPersonas: Object.keys(updatedOverrides.overrides)
      },
      `Persona configuration reloaded with ${Object.keys(updatedOverrides.overrides).length} overrides`
    );
  });

  // Register with Docker Desktop MCP
  const registration = await dockerRegistration.registerService();
  if (registration) {
    logger.info(
      { event: "docker_registration.success", serviceId: registration.serviceId },
      "Service registered with Docker Desktop MCP"
    );
  } else {
    logger.error({ event: "docker_registration.failed" }, "Failed to register with Docker Desktop MCP after retries");
  }

  const shutdown = async (signal: string) => {
    logger.info(
      {
        event: "shutdown.signal",
        signal,
        timestamp: new Date().toISOString(),
        currentServiceState: dockerRegistration.getState()
      },
      `Shutdown signal received: ${signal}`
    );

    // Stop file watcher
    personaWatcher.stop();

    try {
      logger.info({ event: "shutdown.deregister.start" }, "Starting service deregistration");
      await dockerRegistration.deregisterService();
      logger.info(
        {
          event: "shutdown.deregister.success",
          timestamp: new Date().toISOString()
        },
        "Service deregistered successfully"
      );
    } catch (err: any) {
      logger.warn(
        {
          event: "shutdown.deregister.error",
          error: err?.message,
          timestamp: new Date().toISOString()
        },
        "Service deregistration failed during shutdown"
      );
    }

    logger.info(
      {
        event: "shutdown.complete",
        timestamp: new Date().toISOString(),
        exitCode: 0
      },
      "Graceful shutdown completed"
    );
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "Fatal error starting MCP server");
  process.exit(1);
});
