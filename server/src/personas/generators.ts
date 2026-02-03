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
 * Generates context-aware advice based on problem keywords and persona perspective
 */
function generateContextualAdvice(persona: PersonaContract, input: ConsultInput): string[] {
  const problem = input.user_problem.toLowerCase();
  const context = (input.context || "").toLowerCase();
  const fullText = `${problem} ${context}`;
  
  // Base advice starts with persona identity
  const advice: string[] = [persona.soul];
  
  // Add persona-specific contextual advice based on problem domain
  if (fullText.match(/retrospec|retro|sprint review|feedback|team meeting/i)) {
    // Retrospective/team feedback context
    if (persona.name === "Scrum Master") {
      advice.push("Use varied retrospective formats (Start-Stop-Continue, 4Ls, Sailboat, Mad-Sad-Glad) to maintain engagement",
        "Time-box discussions to 60-90 minutes with clear agenda sections",
        "Ensure psychological safety by establishing ground rules (Vegas rule, no blame, focus on process)",
        "Track action items from previous retros and review completion status first",
        "Use dot voting or fist-of-five to prioritize which issues to discuss deeply");
    } else if (persona.name === "Culture Lead") {
      advice.push("Create space for quiet voices through round-robin sharing or anonymous submissions",
        "Start with wins and appreciation before discussing improvements",
        "Use '3 positives for every negative' ratio to maintain team morale",
        "Consider rotating facilitators to distribute ownership and engagement",
        "Follow up on action items between retros to show input leads to change");
    } else if (persona.name === "Senior Developer" || persona.name === "Tech Lead") {
      advice.push("Include technical debt discussions with concrete examples from recent sprint",
        "Review code quality metrics (test coverage, code review feedback, bug rates)",
        "Discuss tooling improvements and automation opportunities",
        "Address development environment pain points affecting productivity",
        "Balance feature work with technical improvements in action items");
    } else if (persona.name === "Product Owner") {
      advice.push("Connect retrospective improvements to sprint goals and product outcomes",
        "Ensure action items align with team capacity and upcoming sprint commitments",
        "Share customer feedback or stakeholder input relevant to team processes",
        "Prioritize improvements that remove blockers to delivering value",
        "Track velocity trends and discuss process changes that impact throughput");
    }
  }
  
  // Add persona focus areas
  advice.push(...persona.focus.slice(0, 3).map((f) => `Focus on ${f} when evaluating approaches`));
  
  // Add goal and context
  if (input.desired_outcome) {
    advice.push(`Target outcome: ${input.desired_outcome}`);
  }
  if (input.context) {
    advice.push(`Key context: ${input.context}`);
  }
  
  // Add constraints
  if (persona.constraints.length > 0) {
    advice.push(...persona.constraints.slice(0, 2).map((c) => `Constraint: ${c}`));
  }
  
  return advice;
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
  const advice = generateContextualAdvice(persona, input);

  const assumptions = [
    `Addressing: ${input.user_problem}`,
    input.desired_outcome ? `Success looks like: ${input.desired_outcome}` : "Success criteria not yet defined",
    input.constraints && input.constraints.length > 0
      ? `Working within: ${input.constraints.join(", ")}`
      : "No explicit constraints provided"
  ];

  const questions = [
    "What is the current state and what specific problems are you experiencing?",
    "What have you already tried and what were the results?",
    "Who are the key stakeholders and what are their priorities?",
    "What constraints (time, budget, team capacity) are you working within?",
    "How will you measure success?"
  ];

  const nextSteps = [
    `Define specific success metrics from ${persona.name} perspective`,
    "Identify quick wins that can be implemented in next sprint",
    "Assign clear owners and deadlines for each action item",
    "Set up feedback loops to measure impact of changes",
    "Schedule follow-up to review progress in 2-4 weeks"
  ];

  return {
    persona: persona.name,
    summary: `${persona.name} perspective on: ${input.user_problem}`,
    advice: clipByDepth(advice, input.depth),
    assumptions: clipByDepth(assumptions, input.depth),
    questions: clipByDepth(questions, input.depth),
    next_steps: clipByDepth(nextSteps, input.depth),
    depth: input.depth
  };
}

/**
 * Generates a specialized Devil’s Advocate response focused on risk analysis
 * 
 * Creates a targeted consultation emphasizing assumption risks, execution risks,
 * and potential conflicts. This persona's draft is optimized for stress-testing plans.
 * 
 * @param input - User consultation input
 * @returns Devil’s Advocate draft emphasizing risks and fallback planning
 */
export function generateDevilsAdvocateDraft(input: ConsultInput): PersonaDraft {
  const devilsAdvocateName: PersonaName = "Devil’s Advocate";
  const persona = PERSONA_CONTRACTS.find((p) => p.name === devilsAdvocateName)!;
  
  // Risk categories to stress-test assumptions
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
