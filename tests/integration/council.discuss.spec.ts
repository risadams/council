import { describe, expect, it } from "vitest";
import { registerCouncilDiscuss } from "../../server/src/tools/council.discuss.js";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";
import type { AppConfig } from "../../server/src/utils/config.js";

type RegisteredTool = {
  name: string;
  handler: (input: unknown) => Promise<any>;
  inputSchema: unknown;
  outputSchema: unknown;
};

type MockServer = {
  registerTool: (tool: RegisteredTool) => void;
};

const mockConfig: AppConfig = {
  httpEnabled: false,
  httpsEnabled: false,
  httpPort: 8080,
  httpsPort: 8443,
  logLevel: "info",
  logFormat: "json",
  workspaceDir: "/tmp",
  certDir: "/tmp",
  authEnabled: false,
  secretsDir: "/tmp",
  interactiveModeEnabled: true,
  debateCycleLimit: 10,
  extendedDebateCycleLimit: 20
};

async function setupTool() {
  let tool: RegisteredTool | undefined;
  const server: MockServer = {
    registerTool(definition) {
      tool = definition;
    }
  };
  await registerCouncilDiscuss(server as any, { config: mockConfig });
  if (!tool) throw new Error("Tool was not registered");
  return tool;
}

describe("council.discuss integration", () => {
  it("validates input and returns schema-compliant output", async () => {
    const tool = await setupTool();
    const input = { requestText: "Help" };

    const { valid: inputValid } = validate(tool.inputSchema, input);
    expect(inputValid).toBe(true);

    const output = await tool.handler(input);
    const outputSchema = loadSchema("council.discuss.output.schema.json");
    const { valid: outputValid } = validate(outputSchema, output);

    expect(outputValid).toBe(true);
    expect(output.sessionId).toBeDefined();
    expect(output.status).toBeDefined();
  });
});
