export type AmbiguityResult = {
  ambiguous: boolean;
  reasons: string[];
};

const AMBIGUOUS_HINTS = [/something/i, /somehow/i, /stuff/i, /maybe/i, /not sure/i];
const QUESTION_WORDS = [/\bhow\b/i, /\bwhat\b/i, /\bwhy\b/i, /\bwhich\b/i, /\bwho\b/i];

export function detectAmbiguity(requestText: string): AmbiguityResult {
  const trimmed = requestText.trim();
  const reasons: string[] = [];

  if (trimmed.length < 20) {
    reasons.push("Request is very short and likely lacks context");
  }

  if (!QUESTION_WORDS.some((pattern) => pattern.test(trimmed))) {
    reasons.push("Request lacks explicit question intent");
  }

  if (AMBIGUOUS_HINTS.some((pattern) => pattern.test(trimmed))) {
    reasons.push("Request contains vague language");
  }

  return { ambiguous: reasons.length > 0, reasons };
}
