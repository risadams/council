import { describe, expect, beforeEach, afterEach, it } from "vitest";
import { rmSync, existsSync } from "fs";
import { join } from "path";
import { registerDefinePersonas } from "../../server/src/tools/council.define_personas.js";

import { validate } from "../../server/src/utils/validation.js";

 type RegisteredTool = {
  name: string;
  handler: (input: unknown) => Promise<any>;
  inputSchema: unknown;
  outputSchema: unknown;
};

 type MockServer = {
  registerTool: (tool: RegisteredTool) => void;
};

const overridesPath = join(process.cwd(), ".council");

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

beforeEach(() => {
  if (existsSync(overridesPath)) {
    rmSync(overridesPath, { recursive: true, force: true });
  }
});

afterEach(() => {
  if (existsSync(overridesPath)) {
    rmSync(overridesPath, { recursive: true, force: true });
  }
});

describe("council.define_personas overrides", () => {
  it("applies and persists overrides", async () => {
    const tool = await setupTool();
    const inputOverride = {
      overrides: {
        "Growth Strategist": { focus: ["product-led growth"] }
      }
    };

    const { valid: inputValid } = validate(tool.inputSchema, inputOverride);
    expect(inputValid).toBe(true);

    const first = await tool.handler(inputOverride);
    expect(first.personas.find((p: any) => p.name === "Growth Strategist")?.focus).toContain(
      "product-led growth"
    );

    // second call should read persisted override without providing overrides again
    const second = await tool.handler({});
    expect(second.personas.find((p: any) => p.name === "Growth Strategist")?.focus).toContain(
      "product-led growth"
    );
  });

  it("rejects unknown persona overrides", async () => {
    const tool = await setupTool();
    const result = await tool.handler({
      overrides: {
        Unknown: { soul: "invalid" }
      }
    });

    expect(result.error).toBeDefined();
    expect(result.error.code).toBe("validation");
  });
});
