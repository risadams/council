import { describe, expect, it } from "vitest";
import { registerCouncilConsult } from "../../server/src/tools/council.consult.js";
import { registerPersonaConsult } from "../../server/src/tools/persona.consult.js";
import { registerDefinePersonas } from "../../server/src/tools/council.define_personas.js";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";

type RegisteredTool = {
  name: string;
  handler: (input: unknown) => Promise<any>;
  inputSchema: unknown;
};

type MockServer = {
  registerTool: (tool: RegisteredTool) => void;
};

async function setupPersonaConsult() {
  let tool: RegisteredTool | undefined;
  const server: MockServer = {
    registerTool(definition) {
      tool = definition;
    }
  };
  await registerPersonaConsult(server as any);
  if (!tool) throw new Error("Tool was not registered");
  return tool;
}

async function setupCouncilConsult() {
  let tool: RegisteredTool | undefined;
  const server: MockServer = {
    registerTool(definition) {
      tool = definition;
    }
  };
  await registerCouncilConsult(server as any);
  if (!tool) throw new Error("Tool was not registered");
  return tool;
}

async function setupDefinePersonas() {
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

describe("error handling and edge cases", () => {
  it("persona.consult rejects invalid persona_name", async () => {
    const tool = await setupPersonaConsult();
    const result = await tool.handler({
      persona_name: "InvalidPersona",
      user_problem: "Test"
    });

    expect(result.error).toBeDefined();
    expect(result.error.code).toBe("validation");
  });

  it("council.consult rejects invalid depth", async () => {
    const tool = await setupCouncilConsult();
    const { valid, errors } = validate(tool.inputSchema, {
      user_problem: "Test",
      depth: "invalid_depth"
    });

    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("council.consult accepts empty constraints array", async () => {
    const tool = await setupCouncilConsult();
    const { valid, errors } = validate(tool.inputSchema, {
      user_problem: "Test",
      constraints: []
    });

    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("define_personas rejects invalid override field", async () => {
    const tool = await setupDefinePersonas();
    const result = await tool.handler({
      overrides: {
        "Growth Strategist": {
          invalid_field: "value"
        }
      }
    });

    expect(result.error).toBeDefined();
    expect(result.error.code).toBe("validation");
  });

  it("council.consult rejects extra properties", async () => {
    const tool = await setupCouncilConsult();
    const { valid, errors } = validate(tool.inputSchema, {
      user_problem: "Test",
      unexpected: true
    } as any);

    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });
});
