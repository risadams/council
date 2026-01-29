/**
 * Persona Response Formatting Module
 * 
 * Converts internal persona drafts into formatted consultation responses
 * with confidence ratings and depth-appropriate content filtering.
 */

import { computeConfidence } from "./confidence.js";
import { clipByDepth } from "./depth.js";
import type { PersonaDraft } from "../personas/generators.js";

/**
 * Converts array of strings into markdown bullet list
 * 
 * @param items - Array of strings to bulletize
 * @returns Formatted markdown bullet list
 */
function bulletize(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

/**
 * Formatted persona consultation response
 * 
 * @property persona - Name of the persona
 * @property summary - Brief summary of the perspective
 * @property advice - Formatted advice as markdown bullets
 * @property assumptions - Underlying assumptions
 * @property questions - Clarifying questions
 * @property next_steps - Recommended actions
 * @property confidence - Confidence level of this perspective
 * @property confidence_rationale - Explanation for confidence level
 */
export type PersonaResponse = {
  persona: string;
  summary: string;
  advice: string;
  assumptions: string[];
  questions: string[];
  next_steps: string[];
  confidence: "low" | "medium" | "high";
  confidence_rationale: string;
};

/**
 * Formats a persona draft into a consultation response
 * 
 * Applies depth-based content filtering and adds confidence assessment.
 * 
 * @param draft - The generated persona draft to format
 * @returns Formatted response ready for output or synthesis
 */
export function formatPersonaDraft(draft: PersonaDraft): PersonaResponse {
  const { level, rationale } = computeConfidence(draft.depth);

  const assumptions = clipByDepth(draft.assumptions, draft.depth);
  const questions = clipByDepth(draft.questions, draft.depth);
  const next_steps = clipByDepth(draft.next_steps, draft.depth);
  const advice = bulletize(clipByDepth(draft.advice, draft.depth));

  return {
    persona: draft.persona,
    summary: draft.summary,
    advice,
    assumptions,
    questions,
    next_steps,
    confidence: level,
    confidence_rationale: rationale
  };
}
