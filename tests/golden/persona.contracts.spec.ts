import { describe, expect, it } from "vitest";
import { registerDefinePersonas } from "../../server/src/tools/council.define_personas.js";

 type RegisteredTool = {
  name: string;
  handler: (input: unknown) => Promise<any>;
};

 type MockServer = {
  registerTool: (tool: RegisteredTool) => void;
};

async function setupTool() {
  let tool: RegisteredTool | undefined;
  const server: MockServer = {
    registerTool(definition) {
      tool = definition;
    }
  };
  await registerDefinePersonas(server as any);
  if (!tool) throw new Error("Tool was not registered");
  return tool;
}

describe("council.define_personas contracts", () => {
  it("returns personas with allowed tools and constraints", async () => {
    const tool = await setupTool();
    const output = await tool.handler({});
    const personas = output.personas as Array<{
      name: string;
      constraints: string[];
      allowed_tools: string[];
      focus: string[];
      soul: string;
    }>;

    expect(personas.length).toBeGreaterThanOrEqual(6);
    for (const p of personas) {
      expect(p.soul.length).toBeGreaterThan(0);
      expect(p.focus.length).toBeGreaterThan(0);
      expect(p.constraints.length).toBeGreaterThan(0);
      expect(p.allowed_tools).toContain("council.consult");
      expect(p.allowed_tools).toContain("persona.consult");
    }
  });
});
