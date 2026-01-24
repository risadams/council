import { clipByDepth, Depth } from "./depth.js";
import { PersonaResponse } from "./personaFormatter.js";

function unique(items: string[]) {
  return Array.from(new Set(items.map((i) => i.trim()).filter(Boolean)));
}

export function buildSynthesis(
  responses: PersonaResponse[],
  depth: Depth,
  context: { user_problem: string; desired_outcome?: string; constraints?: string[] }
) {
  const agreements = unique([
    `Shared goal: ${context.user_problem}`,
    context.desired_outcome ? `Target outcome: ${context.desired_outcome}` : "Align on explicit outcome"
  ]);

  const conflicts = unique([
    "Balance speed vs quality",
    ...(context.constraints ?? []).map((c) => `Constraint tension: ${c}`)
  ]);

  const risks_tradeoffs = unique(
    responses
      .filter((r) => r.persona === "Devil’s Advocate")
      .flatMap((r) => r.advice.split("\n").map((line) => line.replace(/^-\s*/, "")))
  );

  const mergedSteps = unique(responses.flatMap((r) => r.next_steps));
  const next_steps = clipByDepth(mergedSteps.length > 0 ? mergedSteps : ["Align on next steps"], depth);

  const notes = unique([`Depth: ${depth}`]);

  return { agreements, conflicts, risks_tradeoffs, next_steps, notes };
}
