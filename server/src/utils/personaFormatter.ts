import { computeConfidence } from "./confidence.js";
import { clipByDepth } from "./depth.js";
import type { PersonaDraft } from "../personas/generators.js";

function bulletize(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

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
