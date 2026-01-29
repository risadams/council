/**
 * Persona Draft Generation Module
 * 
 * Generates structured consultant responses (drafts) from individual personas.
 * Transforms persona contracts and user inputs into formatted advice, assumptions,
 * questions, and next steps using depth-based content filtering.
 */

import { PersonaContract, PersonaName, PERSONA_CONTRACTS } from "./contracts.js";
import { Depth, clipByDepth } from "../utils/depth.js";

/**
 * User consultation input parameters
 * 
 * @property user_problem - The core problem or decision to be addressed
 * @property context - Optional background information and context
 * @property desired_outcome - Optional desired end state or success criteria
 * @property constraints - Optional list of constraints affecting the problem
 * @property depth - Response detail level: 'brief', 'standard', or 'deep'
 */
export type ConsultInput = {
  user_problem: string;
  context?: string;
  desired_outcome?: string;
  constraints?: string[];
  depth: Depth;
};

/**
 * Structured persona consultation response
 * 
 * @property persona - The persona providing the advice
 * @property summary - Brief overview of the consultation
 * @property advice - Array of advice points tailored to depth
 * @property assumptions - Underlying assumptions the persona makes
 * @property questions - Clarifying questions the persona would ask
 * @property next_steps - Recommended action items
 * @property depth - The depth level used for filtering content
 */
export type PersonaDraft = {
  persona: PersonaName;
  summary: string;
  advice: string[];
  assumptions: string[];
  questions: string[];
  next_steps: string[];
  depth: Depth;
};

/**
 * Filters personas by name, returning all if none specified
 * 
 * @param selected - Optional array of persona names to filter by
 * @returns Filtered persona contracts matching the selection
 */
export function selectPersonas(selected?: PersonaName[]): PersonaContract[] {
  if (selected && selected.length > 0) {
    return PERSONA_CONTRACTS.filter((p) => selected.includes(p.name));
  }
  return PERSONA_CONTRACTS;
}

/**
 * Generates a structured draft response from a specific persona
 * 
 * Combines persona soul, focus areas, and constraints with user input to create
 * a comprehensive consultation response. Content is filtered by depth level.
 * 
 * @param persona - The persona contract to generate advice from
 * @param input - User consultation input including problem and context
 * @returns Structured draft with advice, assumptions, questions, and next steps
 */
export function generatePersonaDraft(persona: PersonaContract, input: ConsultInput): PersonaDraft {
  // Build advice by combining persona soul, focus areas, and constraints
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

/**
 * Generates a specialized Devil's Advocate response focused on risk analysis
 * 
 * Creates a targeted consultation emphasizing assumption risks, execution risks,
 * and potential conflicts. This persona's draft is optimized for stress-testing plans.
 * 
 * @param input - User consultation input
 * @returns Devil's Advocate draft emphasizing risks and fallback planning
 */
export function generateDevilsAdvocateDraft(input: ConsultInput): PersonaDraft {
  const persona = PERSONA_CONTRACTS.find((p) => p.name === "Devil’s Advocate")!;  
  // Risk categories to stress-test assumptions  const riskBullets = [
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
