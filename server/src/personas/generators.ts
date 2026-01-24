import { PersonaContract, PersonaName, PERSONA_CONTRACTS } from "./contracts.js";
import { Depth, clipByDepth } from "../utils/depth.js";

export type ConsultInput = {
  user_problem: string;
  context?: string;
  desired_outcome?: string;
  constraints?: string[];
  depth: Depth;
};

export type PersonaDraft = {
  persona: PersonaName;
  summary: string;
  advice: string[];
  assumptions: string[];
  questions: string[];
  next_steps: string[];
  depth: Depth;
};

export function selectPersonas(selected?: PersonaName[]): PersonaContract[] {
  if (selected && selected.length > 0) {
    return PERSONA_CONTRACTS.filter((p) => selected.includes(p.name));
  }
  return PERSONA_CONTRACTS;
}

export function generatePersonaDraft(persona: PersonaContract, input: ConsultInput): PersonaDraft {
  const advice = [
    persona.soul,
    ...persona.focus.map((f) => `${persona.name} focus: ${f}`),
    input.desired_outcome ? `Aim: ${input.desired_outcome}` : "Clarify desired outcome",
    input.context ? `Context: ${input.context}` : "Gather context and baselines",
    ...persona.constraints.map((c) => `Respect constraint: ${c}`)
  ];

  const assumptions = [
    `Problem: ${input.user_problem}`,
    input.desired_outcome ? `Outcome: ${input.desired_outcome}` : "Outcome: unspecified",
    input.constraints && input.constraints.length > 0
      ? `Constraints: ${input.constraints.join(", ")}`
      : "Constraints: none provided"
  ];

  const questions = [
    "What is the current baseline?",
    "What is the budget and timeline?",
    "Who is accountable and informed?"
  ];

  const nextSteps = [
    `Restate success metric for ${persona.name}`,
    "Draft a 3-step plan with milestones",
    "Assign owners and timelines",
    "Identify risks and mitigations",
    "Set instrumentation for tracking",
    "Schedule a review after first milestone"
  ];

  return {
    persona: persona.name,
    summary: `${persona.name}: ${input.user_problem}`,
    advice: clipByDepth(advice, input.depth),
    assumptions: clipByDepth(assumptions, input.depth),
    questions: clipByDepth(questions, input.depth),
    next_steps: clipByDepth(nextSteps, input.depth),
    depth: input.depth
  };
}

export function generateDevilsAdvocateDraft(input: ConsultInput): PersonaDraft {
  const persona = PERSONA_CONTRACTS.find((p) => p.name === "Devil’s Advocate")!;
  const riskBullets = [
    "Assumption risk: unvalidated demand",
    "Execution risk: timeline too tight",
    "Financial risk: budget overrun",
    "People risk: team capacity",
    "Operational risk: tooling gaps"
  ];
  const conflicts = [
    "Challenge optimistic assumptions",
    "Highlight tradeoffs versus constraints",
    "Ask for fallback plan"
  ];

  const nextSteps = [
    "List top 3 risks and mitigations",
    "Define a fallback if primary plan fails",
    "Timebox a spike to validate assumptions",
    "Add leading indicators for risk detection",
    "Quantify impact range for worst case",
    "Set an explicit stop/go checkpoint"
  ];

  return {
    persona: persona.name,
    summary: `${persona.name}: Stress-test assumptions for ${input.user_problem}`,
    advice: clipByDepth([...riskBullets, ...conflicts], input.depth),
    assumptions: ["Assumptions need explicit validation"],
    questions: clipByDepth(
      [
        "What if budget is cut by 30%?",
        "What if adoption lags?",
        "What if key dependency slips?"
      ],
      input.depth
    ),
    next_steps: clipByDepth(nextSteps, input.depth),
    depth: input.depth
  };
}
