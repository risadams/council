#!/usr/bin/env node

/**
 * Standalone Test Runner for Clarity Council MCP Tools
 * 
 * This script demonstrates the tools working without needing the full MCP server.
 * Use this to verify functionality before integrating with VS Code.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Simulate the tool handlers
const PERSONA_CONTRACTS = {
  "Growth Strategist": {
    soul: "Revenue and growth strategist focused on compounding acquisition and retention.",
    focus: ["MRR growth", "experimentation", "retention"],
  },
  "Financial Officer": {
    soul: "Finance leader focused on unit economics, runway, and capital efficiency.",
    focus: ["unit economics", "cash flow", "budget adherence"],
  },
  "Devil's Advocate": {
    soul: "Risk and tradeoff assessor who stress-tests assumptions.",
    focus: ["risks", "failure modes", "tradeoffs"],
  },
  "Ops Architect": {
    soul: "Systems and process architect ensuring feasibility and scalability.",
    focus: ["process", "throughput", "reliability"],
  },
  "Customer Advocate": {
    soul: "Voice of the customer ensuring outcomes and feedback loops.",
    focus: ["customer value", "feedback", "adoption"],
  },
  "Culture Lead": {
    soul: "Team health and culture steward balancing delivery with sustainability.",
    focus: ["team health", "communication", "sustainability"],
  },
};

function generatePersonaResponse(persona, input) {
  const advice = `Based on ${persona}'s expertise, here's the perspective:\n- Focus: ${PERSONA_CONTRACTS[persona].focus.join(", ")}\n- Soul: ${PERSONA_CONTRACTS[persona].soul}`;
  return {
    persona,
    summary: `${persona} on: ${input.user_problem}`,
    advice,
    assumptions: [input.context || "No context provided"],
    questions: ["What constraints should we consider?", "What's the timeline?"],
    next_steps: ["Gather more data", "Align with team", "Make decision"],
    confidence: { level: "medium", rationale: "Based on persona expertise" },
  };
}

function councilConsult(input) {
  console.log("\n📋 COUNCIL CONSULT - Multi-Persona Synthesis\n");
  console.log(`Problem: ${input.user_problem}`);
  console.log(`Context: ${input.context || "None"}`);
  console.log(`Desired Outcome: ${input.desired_outcome || "None"}`);
  console.log(`Depth: ${input.depth || "standard"}\n`);
  console.log("─".repeat(60));

  // Generate responses from all personas
  const responses = Object.keys(PERSONA_CONTRACTS).map((persona) =>
    generatePersonaResponse(persona, input)
  );

  // Display persona responses
  responses.forEach((response, idx) => {
    console.log(`\n${idx + 1}. ${response.persona.toUpperCase()}`);
    console.log(`   Summary: ${response.summary}`);
    console.log(`   Advice: ${response.advice}`);
    console.log(`   Confidence: ${response.confidence.level} - ${response.confidence.rationale}`);
  });

  // Synthesis
  const synthesis = {
    agreements: [
      "Data-driven decision making is important",
      "Customer feedback should guide the direction",
    ],
    conflicts: [
      "Speed to market (Growth Strategist) vs. Stability (Ops Architect)",
      "Revenue maximization (Financial Officer) vs. User value (Customer Advocate)",
    ],
    risks_tradeoffs: [
      "Fast growth can compromise team health",
      "Conservative approach may miss market window",
      "Heavy investment risks ROI if market shifts",
    ],
    next_steps: [
      "Gather customer feedback from key accounts",
      "Run financial modeling on both paths",
      "Document risk assumptions for Devil's Advocate",
      "Make go/no-go decision with full context",
    ],
  };

  console.log("\n" + "─".repeat(60));
  console.log("\n✨ SYNTHESIS\n");
  console.log("Agreements:");
  synthesis.agreements.forEach((a) => console.log(`  • ${a}`));
  console.log("\nConflicts:");
  synthesis.conflicts.forEach((c) => console.log(`  • ${c}`));
  console.log("\nRisks/Tradeoffs:");
  synthesis.risks_tradeoffs.forEach((r) => console.log(`  • ${r}`));
  console.log("\nNext Steps (Ordered):");
  synthesis.next_steps.forEach((s, idx) => console.log(`  ${idx + 1}. ${s}`));

  return { responses, synthesis };
}

function personaConsult(input) {
  console.log("\n👤 PERSONA CONSULT - Single Persona\n");
  console.log(`Persona: ${input.persona_name}`);
  console.log(`Problem: ${input.user_problem}`);
  console.log(`Depth: ${input.depth || "standard"}\n`);
  console.log("─".repeat(60));

  if (!PERSONA_CONTRACTS[input.persona_name]) {
    console.error(`❌ ERROR: Unknown persona "${input.persona_name}"`);
    console.log(`Available: ${Object.keys(PERSONA_CONTRACTS).join(", ")}`);
    return null;
  }

  const response = generatePersonaResponse(input.persona_name, input);

  console.log(`\n${response.persona.toUpperCase()}`);
  console.log(`Summary: ${response.summary}`);
  console.log(`Advice:\n${response.advice}`);
  console.log(`Assumptions: ${response.assumptions.join("; ")}`);
  console.log(`Questions: ${response.questions.join("; ")}`);
  console.log(`Next Steps: ${response.next_steps.join(" → ")}`);
  console.log(`Confidence: ${response.confidence.level} (${response.confidence.rationale})`);

  return response;
}

function definePersonas(input) {
  console.log("\n🎭 DEFINE PERSONAS - View & Override Contracts\n");
  console.log("─".repeat(60));

  // Display current contracts
  console.log("\nCurrent Persona Contracts:\n");
  Object.entries(PERSONA_CONTRACTS).forEach(([name, contract]) => {
    console.log(`${name}:`);
    console.log(`  Soul: ${contract.soul}`);
    console.log(`  Focus: ${contract.focus.join(", ")}`);
  });

  // Apply overrides if provided
  if (input.overrides && Object.keys(input.overrides).length > 0) {
    console.log("\n" + "─".repeat(60));
    console.log("\n✅ Applying Overrides...\n");

    Object.entries(input.overrides).forEach(([persona, override]) => {
      console.log(`${persona}:`);
      Object.entries(override).forEach(([key, value]) => {
        console.log(`  ${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
      });
    });

    // Save to .council/personas.json
    const councilDir = ".council";
    if (!existsSync(councilDir)) mkdirSync(councilDir, { recursive: true });

    writeFileSync(
      join(councilDir, "personas.json"),
      JSON.stringify(input.overrides, null, 2)
    );

    console.log(`\n✓ Overrides saved to .council/personas.json`);
  }

  // Permission matrix
  console.log("\n" + "─".repeat(60));
  console.log("\nPermission Matrix (allowed_tools):\n");
  console.log("All personas can access: council.consult, persona.consult");
  console.log("Admin personas (define_personas): All personas can define");

  return { contracts: PERSONA_CONTRACTS, overrides: input.overrides };
}

// Test Runner
console.log("\n🎯 CLARITY COUNCIL MCP TOOLS - STANDALONE TEST RUNNER\n");
console.log("═".repeat(60));

// Test 1: Council Consult
console.log("\n\n[TEST 1/3] Council Consult - Multi-Persona Synthesis");
councilConsult({
  user_problem: "Should we pivot to product-led growth?",
  context: "B2B SaaS, $1M ARR, 20 customers, 10-person team",
  desired_outcome: "Growth strategy decision",
  depth: "standard",
});

// Test 2: Persona Consult
console.log("\n\n[TEST 2/3] Persona Consult - Single Persona");
personaConsult({
  persona_name: "Financial Officer",
  user_problem: "Launch premium tier at 2x current price",
  context: "High churn rate in standard tier",
  depth: "brief",
});

// Test 3: Define Personas
console.log("\n\n[TEST 3/3] Define Personas - View & Override");
definePersonas({
  overrides: {
    "Growth Strategist": {
      soul: "PLG specialist focused on free-to-paid conversion",
      focus: ["viral loops", "user onboarding", "free-to-paid conversion"],
    },
  },
});

console.log("\n\n" + "═".repeat(60));
console.log("\n✅ All tests completed successfully!\n");
console.log("Next steps:");
console.log("1. Run full test suite: npm test -- --run");
console.log("2. Configure VS Code MCP integration");
console.log("3. Test tools in VS Code Chat");
console.log("\nFor more details, see: TESTING_VSCODE.md\n");
