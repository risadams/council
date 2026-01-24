import { describe, expect, it } from "vitest";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";
const schema = loadSchema("persona.consult.input.schema.json");
describe("persona.consult input schema", () => {
    it("accepts minimal valid input", () => {
        const { valid, errors } = validate(schema, {
            persona_name: "Growth Strategist",
            user_problem: "Increase MRR"
        });
        expect(valid).toBe(true);
        expect(errors).toHaveLength(0);
    });
    it("rejects missing required fields", () => {
        const { valid, errors } = validate(schema, { persona_name: "Growth Strategist" });
        expect(valid).toBe(false);
        expect(errors.length).toBeGreaterThan(0);
    });
    it("rejects invalid persona names", () => {
        const { valid, errors } = validate(schema, {
            persona_name: "Unknown",
            user_problem: "Test"
        });
        expect(valid).toBe(false);
        expect(errors.length).toBeGreaterThan(0);
    });
    it("rejects additional properties", () => {
        const { valid, errors } = validate(schema, {
            persona_name: "Growth Strategist",
            user_problem: "Test",
            extra: true
        });
        expect(valid).toBe(false);
        expect(errors.length).toBeGreaterThan(0);
    });
});
