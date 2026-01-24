import { describe, expect, it } from "vitest";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";
const outputSchema = loadSchema("persona.consult.output.schema.json");
describe("persona.consult output schema", () => {
    it("accepts a valid response shape", () => {
        const sample = {
            persona: "Growth Strategist",
            summary: "Growth Strategist: Increase MRR",
            advice: "- Focus on retention\n- Add pricing experiments",
            assumptions: ["Outcome: unspecified"],
            questions: ["What is baseline?"],
            next_steps: ["Step 1", "Step 2"],
            confidence: "medium",
            confidence_rationale: "Standard depth"
        };
        const { valid, errors } = validate(outputSchema, sample);
        expect(valid).toBe(true);
        expect(errors).toHaveLength(0);
    });
    it("rejects missing next_steps", () => {
        const sample = {
            persona: "Growth Strategist",
            summary: "Growth Strategist: Increase MRR",
            advice: "- Advice",
            assumptions: ["Outcome: unspecified"],
            questions: ["What is baseline?"],
            confidence: "medium"
        };
        const { valid, errors } = validate(outputSchema, sample);
        expect(valid).toBe(false);
        expect(errors.length).toBeGreaterThan(0);
    });
});
