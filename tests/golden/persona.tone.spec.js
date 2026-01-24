import { describe, expect, it } from "vitest";
import { registerPersonaConsult } from "../../server/src/tools/persona.consult.js";
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
describe("persona.consult tone", () => {
    const personas = [
        "Growth Strategist",
        "Financial Officer",
        "Devil’s Advocate",
        "Ops Architect",
        "Customer Advocate",
        "Culture Lead"
    ];
    for (const persona of personas) {
        it(`returns structured bullets for ${persona}`, async () => {
            const tool = await setupTool();
            const output = await tool.handler({ persona_name: persona, user_problem: "Ship feature X" });
            expect(output.persona).toBe(persona);
            expect(output.summary.startsWith(`${persona}:`)).toBe(true);
            expect(output.advice).toContain("- ");
            expect(output.next_steps.length).toBeGreaterThanOrEqual(2);
            expect(output.questions.length).toBeGreaterThanOrEqual(1);
            expect(output.confidence_rationale ?? "").not.toHaveLength(0);
            if (persona === "Devil’s Advocate") {
                expect(output.advice.toLowerCase()).toContain("risk");
            }
        });
    }
});
