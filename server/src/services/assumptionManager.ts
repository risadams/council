import { randomUUID } from "crypto";
import type { Assumption, ClarificationQuestion } from "../types/session.js";

export function createAssumption(options: {
  sessionId: string;
  question: ClarificationQuestion;
  rationale?: string;
}): Assumption {
  return {
    assumptionId: randomUUID(),
    sessionId: options.sessionId,
    relatedQuestionId: options.question.questionId,
    assumption: `Assuming ${options.question.targetAmbiguity ?? "details"} are acceptable as default`,
    rationale: options.rationale ?? "User skipped clarification question",
    addedAt: new Date().toISOString()
  };
}
