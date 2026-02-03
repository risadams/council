import { describe, expect, it } from "vitest";
import { registerCouncilDiscuss } from "../../server/src/tools/council.discuss.js";
import type { AppConfig } from "../../server/src/utils/config.js";

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

type RegisteredTool = {
  handler: (input: unknown) => Promise<any>;
  inputSchema: unknown;
  outputSchema: unknown;
};

type MockServer = { registerTool: (tool: RegisteredTool) => void };

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

describe("clarification flow integration", () => {
  it("asks a clarification question and accepts an answer", async () => {
    const tool = await setupTool();
    const start = await tool.handler({ requestText: "Help" });

    expect(start.status).toBe("clarifying");
    expect(start.nextAction?.actionType).toBe("answer_question");

    const followUp = await tool.handler({ sessionId: start.sessionId, answer: "Improve onboarding" });
    expect(["clarifying", "debating", "final", "completed"]).toContain(followUp.status);
  });
});
