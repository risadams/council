import { describe, expect, it } from "vitest";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";

const schema = loadSchema("council.consult.input.schema.json");

describe("council.consult input schema", () => {
  it("accepts minimal valid input", () => {
    const { valid, errors } = validate(schema, { user_problem: "Grow MRR" });
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("rejects missing user_problem", () => {
    const { valid, errors } = validate(schema, {});
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects invalid persona names", () => {
    const { valid, errors } = validate(schema, {
      user_problem: "Test persona",
      selected_personas: ["Unknown"]
    });
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("rejects additional properties", () => {
    const { valid, errors } = validate(schema, {
      user_problem: "Extra fields",
      unexpected: true
    } as any);
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });
});
