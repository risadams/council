import { describe, expect, it } from "vitest";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";

const schema = loadSchema("council.define_personas.input.schema.json");

describe("council.define_personas input schema", () => {
  it("accepts empty input", () => {
    const { valid, errors } = validate(schema, {});
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("accepts valid overrides", () => {
    const { valid, errors } = validate(schema, {
      overrides: {
        "Growth Strategist": {
          focus: ["new focus"],
          constraints: ["stay lean"]
        }
      }
    });
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("rejects additional fields on override entries", () => {
    const { valid, errors } = validate(schema, {
      overrides: {
        "Growth Strategist": {
          focus: ["new focus"],
          unexpected: true
        }
      }
    } as any);
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });
});
