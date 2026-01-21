import { createServer } from "@modelcontextprotocol/sdk";
import { createLogger } from "./utils/logger.js";

import { registerCouncilConsult } from "./tools/council.consult.js";
import { registerPersonaConsult } from "./tools/persona.consult.js";
import { registerDefinePersonas } from "./tools/council.define_personas.js";

const logger = createLogger();

async function main() {
  const server = createServer({ logger });

  await registerCouncilConsult(server);
  await registerPersonaConsult(server);
  await registerDefinePersonas(server);

  await server.start();
  logger.info({ event: "server_started" }, "Clarity Council MCP server started");
}

main().catch((err) => {
  logger.error({ err }, "Fatal error starting MCP server");
  process.exit(1);
});
