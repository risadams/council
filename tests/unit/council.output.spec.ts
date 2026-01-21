import { describe, expect, it } from "vitest";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";

const outputSchema = loadSchema("council.consult.output.schema.json");
const personaOutputSchema = loadSchema("persona.consult.output.schema.json");

describe("council.consult output schema", () => {
  it("accepts a valid response shape", () => {
    const sample = {
      responses: [
        {
          persona: "Growth Strategist",
          summary: "Summary",
          advice: "Advice",
          assumptions: ["Assumption"],
          questions: ["Question"],
          next_steps: ["Step 1", "Step 2"],
          confidence: "medium",
          confidence_rationale: "Depth rationale"
        }
      ],
      synthesis: {
        agreements: ["Agreement"],
        conflicts: ["Conflict"],
        risks_tradeoffs: ["Risk"],
        next_steps: ["Synthesis step"],
        notes: ["Note"]
      }
    };

    const { valid, errors } = validate(outputSchema, sample, { schemas: [personaOutputSchema] });
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("rejects missing synthesis next_steps", () => {
    const sample = {
      responses: [
        {
          persona: "Growth Strategist",
          summary: "Summary",
          advice: "Advice",
          assumptions: ["Assumption"],
          questions: ["Question"],
          next_steps: ["Step 1"],
          confidence: "medium"
        }
      ],
      synthesis: {
        agreements: ["Agreement"],
        conflicts: ["Conflict"],
        risks_tradeoffs: ["Risk"]
      }
    } as any;

    const { valid, errors } = validate(outputSchema, sample, { schemas: [personaOutputSchema] });
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });
});
