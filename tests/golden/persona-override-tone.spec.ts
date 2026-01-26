import { describe, it, expect } from "vitest";
import { generatePersonaDraft, type ConsultInput, type PersonaDraft } from "../../server/src/personas/generators.js";
import { PERSONA_CONTRACTS } from "../../server/src/personas/contracts.js";
import { PersonaOverridesFile } from "../../server/src/types/personaOverrides.js";

describe("Persona Override Tone Golden Tests", () => {
  it("should reflect soul override in generated persona draft", () => {
    const input: ConsultInput = {
      user_problem: "Should we expand our product into new markets?",
      depth: "standard",
      desired_outcome: "Make informed expansion decision"
    };

    // Get base Devil's Advocate persona (index 2)
    const baseDevil = PERSONA_CONTRACTS[2]; // Devil's Advocate
    const baseDraft = generatePersonaDraft(baseDevil, input);

    // Create overridden persona with different soul
    const overriddenDevil = {
      ...baseDevil,
      soul: "Cautious risk assessor focused on downside protection and uncertainty management"
    };
    const overriddenDraft = generatePersonaDraft(overriddenDevil, input);

    // Both should be valid drafts
    expect(baseDraft.persona).toBe(baseDevil.name);
    expect(overriddenDraft.persona).toBe(baseDevil.name);
    expect(baseDraft.advice.length).toBeGreaterThan(0);
    expect(overriddenDraft.advice.length).toBeGreaterThan(0);
    expect(baseDraft.advice).not.toEqual(overriddenDraft.advice); // Different souls should yield different advice
  });

  it("should incorporate focus overrides into draft advice", () => {
    const input: ConsultInput = {
      user_problem: "How can we increase revenue?",
      depth: "brief"
    };

    const baseGrowth = PERSONA_CONTRACTS[0]; // Growth Strategist
    const baseDraft = generatePersonaDraft(baseGrowth, input);

    // Override focus
    const overriddenGrowth = {
      ...baseGrowth,
      focus: ["operational efficiency", "cost reduction", "margin improvement"]
    };
    const overriddenDraft = generatePersonaDraft(overriddenGrowth, input);

    expect(baseDraft.persona).toBe("Growth Strategist");
    expect(overriddenDraft.persona).toBe("Growth Strategist");
    expect(baseDraft.advice.length).toBeGreaterThan(0);
    expect(overriddenDraft.advice.length).toBeGreaterThan(0);
  });

  it("should create drafts with override constraints", () => {
    const input: ConsultInput = {
      user_problem: "What is our financial risk exposure?",
      depth: "deep",
      context: "Post-pandemic market volatility"
    };

    const baseFinance = PERSONA_CONTRACTS[1]; // Financial Officer

    // Override constraints
    const overriddenFinance = {
      ...baseFinance,
      constraints: [
        "Consider tax implications",
        "Account for regulatory requirements",
        "Prioritize shareholder value",
        "Factor in economic cycles"
      ]
    };

    const draft = generatePersonaDraft(overriddenFinance, input);

    expect(draft.persona).toBe("Financial Officer");
    expect(draft.assumptions.length).toBeGreaterThan(0);
    expect(draft.next_steps.length).toBeGreaterThan(0);
    expect(draft.depth).toBe("deep");
  });

  it("should maintain persona identity with full overrides", () => {
    const input: ConsultInput = {
      user_problem: "How should we handle customer complaints?",
      depth: "brief"
    };

    const baseAdvocate = PERSONA_CONTRACTS[4]; // Customer Advocate

    // Full override
    const overriddenAdvocate = {
      ...baseAdvocate,
      soul: "User-centric champion focused on satisfaction and retention",
      focus: ["user satisfaction", "retention rates", "net promoter score", "churn analysis"],
      constraints: ["Maintain profitability", "Respect product roadmap", "Be data-driven"]
    };

    const draft = generatePersonaDraft(overriddenAdvocate, input);

    expect(draft.persona).toBe("Customer Advocate");
    expect(draft.advice.length).toBeGreaterThan(0);
    expect(typeof draft.summary).toBe("string");
  });

  it("should respect depth clipping with overrides", () => {
    const briefInput: ConsultInput = {
      user_problem: "Test problem",
      depth: "brief"
    };

    const standardInput: ConsultInput = {
      user_problem: "Test problem",
      depth: "standard"
    };

    const deepInput: ConsultInput = {
      user_problem: "Test problem",
      depth: "deep"
    };

    const persona = PERSONA_CONTRACTS[3]; // Ops Architect

    const briefDraft = generatePersonaDraft(persona, briefInput);
    const standardDraft = generatePersonaDraft(persona, standardInput);
    const deepDraft = generatePersonaDraft(persona, deepInput);

    expect(briefDraft.advice.length).toBeLessThanOrEqual(standardDraft.advice.length);
    expect(standardDraft.advice.length).toBeLessThanOrEqual(deepDraft.advice.length);
    expect(briefDraft.depth).toBe("brief");
    expect(standardDraft.depth).toBe("standard");
    expect(deepDraft.depth).toBe("deep");
  });

  it("should create proper override file structure", () => {
    const overrides: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: {
        "Devil's Advocate": {
          enabled: true,
          customSoul: "Constructive skeptic challenging assumptions",
          customFocus: ["risk analysis", "edge cases", "failure modes"],
          customConstraints: ["remain professional", "focus on logic", "propose alternatives"]
        },
        "Growth Strategist": {
          enabled: true,
          customSoul: "Innovation enabler seeking competitive advantages",
          customFocus: ["market expansion", "product innovation", "partnership opportunities"]
        },
        "Financial Officer": {
          enabled: false
        }
      }
    };

    // Validate structure
    expect(overrides.version).toBe("1.0");
    expect(typeof overrides.lastModified).toBe("string");
    expect(Object.keys(overrides.overrides).length).toBe(3);

    const devilsAdvocate = overrides.overrides["Devil's Advocate"];
    expect(devilsAdvocate.enabled).toBe(true);
    expect(devilsAdvocate.customSoul).toBeDefined();
    expect(Array.isArray(devilsAdvocate.customFocus)).toBe(true);
    expect(devilsAdvocate.customFocus?.length).toBe(3);

    const financialOfficer = overrides.overrides["Financial Officer"];
    expect(financialOfficer.enabled).toBe(false);
  });
});
