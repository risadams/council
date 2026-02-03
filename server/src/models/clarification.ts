import { randomUUID } from "crypto";
import type { ClarificationAnswer, ClarificationQuestion, Participant } from "../types/session.js";

export function createClarificationQuestion(options: {
  sessionId: string;
  roundNumber: number;
  sequenceInRound: number;
  question: string;
  askedBy: Participant;
  targetAmbiguity?: string;
}): ClarificationQuestion {
  const now = new Date().toISOString();
  return {
    questionId: randomUUID(),
    sessionId: options.sessionId,
    roundNumber: options.roundNumber,
    sequenceInRound: options.sequenceInRound,
    question: options.question,
    targetAmbiguity: options.targetAmbiguity,
    askedBy: options.askedBy,
    status: "pending",
    createdAt: now
  };
}

export function createClarificationAnswer(options: {
  sessionId: string;
  questionId: string;
  answer: string;
  skipCommand: boolean;
}): ClarificationAnswer {
  return {
    answerId: randomUUID(),
    sessionId: options.sessionId,
    questionId: options.questionId,
    answer: options.answer,
    skipCommand: options.skipCommand,
    createdAt: new Date().toISOString()
  };
}
