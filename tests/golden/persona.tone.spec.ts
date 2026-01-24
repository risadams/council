import { describe, expect, it } from "vitest";
import { registerPersonaConsult } from "../../server/src/tools/persona.consult.js";
import { PersonaName } from "../../server/src/personas/contracts.js";

 type RegisteredTool = {
  name: string;
  handler: (input: unknown) => Promise<any>;
};

 type MockServer = {
  registerTool: (tool: RegisteredTool) => void;
};

async function setupTool() {
  let tool: RegisteredTool | undefined;
  const server: MockServer = {
    registerTool(definition) {
      tool = definition;
    }
  };
  await registerPersonaConsult(server as any);
  if (!tool) throw new Error("Tool was not registered");
  return tool;
}

describe("persona.consult tone", () => {
  const personas: PersonaName[] = [
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
