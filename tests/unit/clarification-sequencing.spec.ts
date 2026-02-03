import { describe, expect, it } from "vitest";
import type { Participant, SessionState } from "../../server/src/types/session.js";
import { initializeClarifications, getNextClarificationQuestion } from "../../server/src/services/clarificationOrchestrator.js";

const systemParticipant: Participant = { participantId: "system", type: "system", name: "System" };

const baseSession: SessionState = {
  sessionId: "sess-1",
  status: "created",
  requestText: "How should we improve onboarding?",
  clarificationRounds: 0,
  debateCycles: 0,
  extendedDebateRequested: false,
  participants: [],
  messageTurns: [],
  clarificationQuestions: [],
  assumptions: [],
  discussions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe("clarification sequencing", () => {
  it("returns first question as next pending", () => {
    const questions = initializeClarifications(baseSession, systemParticipant);
    const session = { ...baseSession, clarificationQuestions: questions };
    const next = getNextClarificationQuestion(session);
    expect(next?.sequenceInRound).toBe(1);
  });
});
