import { describe, expect, it } from "vitest";
import { registerCouncilConsult } from "../../server/src/tools/council.consult.js";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";
async function setupTool() {
    let tool;
    const server = {
        registerTool(definition) {
            tool = definition;
        }
    };
    await registerCouncilConsult(server);
    if (!tool)
        throw new Error("Tool was not registered");
    return tool;
}
describe("council.consult integration", () => {
    it("validates input and returns schema-compliant output", async () => {
        const tool = await setupTool();
        const input = { user_problem: "Grow MRR", depth: "brief" };
        const { valid: inputValid } = validate(tool.inputSchema, input);
        expect(inputValid).toBe(true);
        const output = await tool.handler(input);
        const outputSchema = loadSchema("council.consult.output.schema.json");
        const personaOutputSchema = loadSchema("persona.consult.output.schema.json");
        const { valid: outputValid, errors } = validate(outputSchema, output, {
            schemas: [personaOutputSchema]
        });
        expect(outputValid).toBe(true);
        expect(errors).toHaveLength(0);
        expect(output.responses.length).toBeGreaterThanOrEqual(1);
        const personas = output.responses.map((r) => r.persona);
        expect(personas).toContain("Devil’s Advocate");
    });
});
