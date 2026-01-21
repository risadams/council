import { describe, expect, it } from "vitest";
import { registerPersonaConsult } from "../../server/src/tools/persona.consult.js";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";
async function setupTool() {
    let tool;
    const server = {
        registerTool(definition) {
            tool = definition;
        }
    };
    await registerPersonaConsult(server);
    if (!tool)
        throw new Error("Tool was not registered");
    return tool;
}
describe("persona.consult integration", () => {
    it("validates input and returns schema-compliant output", async () => {
        const tool = await setupTool();
        const input = { persona_name: "Culture Lead", user_problem: "Improve onboarding" };
        const { valid: inputValid } = validate(tool.inputSchema, input);
        expect(inputValid).toBe(true);
        const output = await tool.handler(input);
        const outputSchema = loadSchema("persona.consult.output.schema.json");
        const { valid: outputValid, errors } = validate(outputSchema, output);
        expect(outputValid).toBe(true);
        expect(errors).toHaveLength(0);
        expect(output.persona).toBe("Culture Lead");
        expect(output.advice).toContain("- ");
    });
});
