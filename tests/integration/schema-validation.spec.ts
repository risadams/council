import { describe, it, expect } from "vitest";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";

describe("Schema Validation Integration (T077)", () => {
  it("should load and validate council.consult input/output schemas", () => {
    const inputSchema = loadSchema("council.consult.input.schema.json");
    const outputSchema = loadSchema("council.consult.output.schema.json");

    expect(inputSchema).toBeDefined();
    expect(outputSchema).toBeDefined();

    // Validate a sample input
    const sampleInput = {
      user_problem: "How do we scale?",
      depth: "standard"
    };

    const inputValidation = validate(inputSchema, sampleInput);
    expect(inputValidation.valid).toBe(true);
  });

  it("should load and validate persona.consult input/output schemas", () => {
    const inputSchema = loadSchema("persona.consult.input.schema.json");
    const outputSchema = loadSchema("persona.consult.output.schema.json");

    expect(inputSchema).toBeDefined();
    expect(outputSchema).toBeDefined();

    // Validate a sample input
    const sampleInput = {
      persona_name: "Growth Strategist",
      user_problem: "How do we grow?",
      depth: "standard"
    };

    const inputValidation = validate(inputSchema, sampleInput);
    expect(inputValidation.valid).toBe(true);
  });

  it("should load and validate council.define_personas input/output schemas", () => {
    const inputSchema = loadSchema("council.define_personas.input.schema.json");
    const outputSchema = loadSchema("council.define_personas.output.schema.json");

    expect(inputSchema).toBeDefined();
    expect(outputSchema).toBeDefined();
  });

  it("should reject invalid input schemas", () => {
    const schema = loadSchema("council.consult.input.schema.json");

    // Missing required field
    const invalidInput = { depth: "standard" };

    const validation = validate(schema, invalidInput);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it("should reject invalid depth values", () => {
    const schema = loadSchema("council.consult.input.schema.json");

    const invalidInput = {
      user_problem: "Test",
      depth: "invalid_depth"
    };

    const validation = validate(schema, invalidInput);
    expect(validation.valid).toBe(false);
  });

  it("should validate all required MCP schemas exist", () => {
    const schemaNames = [
      "council.consult.input.schema.json",
      "council.consult.output.schema.json",
      "persona.consult.input.schema.json",
      "persona.consult.output.schema.json",
      "council.define_personas.input.schema.json",
      "council.define_personas.output.schema.json"
    ];

    for (const name of schemaNames) {
      const schema = loadSchema(name);
      expect(schema).toBeDefined();
      expect(Object.keys(schema).length).toBeGreaterThan(0);
    }
  });
});
