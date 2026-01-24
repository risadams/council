import { describe, expect, it } from "vitest";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";

const outputSchema = loadSchema("council.define_personas.output.schema.json");

describe("council.define_personas output schema", () => {
  it("accepts personas array", () => {
    const sample = {
      personas: [
        {
          name: "Growth Strategist",
          soul: "Soul",
          focus: ["focus"],
          constraints: ["constraint"],
          allowed_tools: ["council.consult"]
        }
      ]
    };

    const { valid, errors } = validate(outputSchema, sample);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("rejects missing required fields", () => {
    const sample = {
      personas: [
        {
          name: "Growth Strategist",
          soul: "Soul",
          focus: ["focus"],
          constraints: ["constraint"]
        }
      ]
    } as any;

    const { valid, errors } = validate(outputSchema, sample);
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });
});
