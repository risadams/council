import { describe, expect, it } from "vitest";
import { registerCouncilConsult } from "../../server/src/tools/council.consult.js";
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
  await registerCouncilConsult(server as any);
  if (!tool) throw new Error("Tool was not registered");
  return tool;
}

describe("council.consult persona outputs", () => {
  it("returns persona-distinct advice with Devil's Advocate counterpoints", async () => {
    const tool = await setupTool();
    const output = await tool.handler({
      user_problem: "We need to grow MRR by 30%",
      context: "B2B SaaS with 100 customers",
      desired_outcome: "Sustainable growth",
      depth: "standard"
    });

    const responses = output.responses as Array<{
      persona: PersonaName;
      summary: string;
      advice: string;
      next_steps: string[];
      questions: string[];
      confidence_rationale?: string;
    }>;

    expect(responses.length).toBeGreaterThanOrEqual(6);

    for (const response of responses) {
      expect(response.summary.startsWith(`${response.persona}:`)).toBe(true);
      expect(response.advice).toContain("- ");
      expect(response.advice.split("\n").length).toBeGreaterThan(1);
      expect(response.next_steps.length).toBeGreaterThanOrEqual(5);
      expect(response.questions.length).toBeGreaterThanOrEqual(1);
      expect(response.confidence_rationale ?? "").not.toHaveLength(0);
    }

    const devilsAdvocate = responses.find((r) => r.persona === "Devil’s Advocate");
    expect(devilsAdvocate).toBeDefined();
    expect(devilsAdvocate?.advice.toLowerCase()).toContain("risk");
    expect(output.synthesis.conflicts.length).toBeGreaterThan(0);
  });
});
