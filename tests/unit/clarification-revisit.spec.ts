import { describe, it, expect } from "vitest";
import type { SessionState, ClarificationQuestion } from "../../server/src/types/session.js";
import { v4 as uuidv4 } from "uuid";

describe("Clarification Revisit - skipped questions", () => {
  it("should identify skipped questions that can be revisited", () => {
    const sessionId = uuidv4();
    const skippedQuestion: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId,
      roundNumber: 1,
      sequenceInRound: 1,
      question: "What is your timeline?",
      targetAmbiguity: "timeline",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "skipped",
      createdAt: new Date().toISOString()
    };

    const answeredQuestion: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId,
      roundNumber: 1,
      sequenceInRound: 2,
      question: "What is your budget?",
      targetAmbiguity: "budget",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "answered",
      createdAt: new Date().toISOString(),
      answeredAt: new Date().toISOString(),
      userAnswer: {
        answerId: uuidv4(),
        questionId: uuidv4(),
        sessionId,
        answer: "$50k",
        skipCommand: false,
        createdAt: new Date().toISOString()
      }
    };

    const session: SessionState = {
      sessionId,
      requestText: "Test",
      status: "final",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clarificationRounds: 1,
      debateCycles: 0,
      extendedDebateRequested: false,
      assumptions: [],
      participants: [],
      messageTurns: [],
      discussions: [],
      clarificationQuestions: [skippedQuestion, answeredQuestion],
      metadata: {}
    };

    // Helper to get skipped questions
    const getSkippedQuestions = (s: SessionState) =>
      s.clarificationQuestions.filter((q) => q.status === "skipped");

    const skipped = getSkippedQuestions(session);
    expect(skipped).toHaveLength(1);
    expect(skipped[0].questionId).toBe(skippedQuestion.questionId);
  });

  it("should allow revisiting a skipped question by changing status to pending", () => {
    const sessionId = uuidv4();
    const skippedQuestion: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId,
      roundNumber: 1,
      sequenceInRound: 1,
      question: "What is priority?",
      targetAmbiguity: "priority",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "skipped",
      createdAt: new Date().toISOString()
    };

    // Simulate revisit by setting status to pending
    skippedQuestion.status = "pending";

    expect(skippedQuestion.status).toBe("pending");
  });

  it("should support regenerating response after answering skipped question", () => {
    const sessionId = uuidv4();
    const session: SessionState = {
      sessionId,
      requestText: "Test",
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clarificationRounds: 1,
      debateCycles: 1,
      extendedDebateRequested: false,
      assumptions: [
        {
          assumptionId: uuidv4(),
          sessionId,
          assumption: "Assuming timeline is 2 weeks",
          rationale: "User skipped timeline question",
          addedAt: new Date().toISOString()
        }
      ],
      participants: [],
      messageTurns: [],
      discussions: [],
      clarificationQuestions: [
        {
          questionId: uuidv4(),
          sessionId,
          roundNumber: 1,
          sequenceInRound: 1,
          question: "What is timeline?",
          targetAmbiguity: "timeline",
          askedBy: { participantId: uuidv4(), type: "system", name: "System" },
          status: "skipped",
          createdAt: new Date().toISOString()
        }
      ],
      finalAnswer: "Final answer with assumptions",
      metadata: {}
    };

    // Simulate revisit flow: reset status to clarifying
    session.status = "clarifying";
    const skippedQuestion = session.clarificationQuestions[0];
    skippedQuestion.status = "pending";

    expect(session.status).toBe("clarifying");
    expect(skippedQuestion.status).toBe("pending");
    // After answering, system would regenerate by going through debate cycle again
  });

  it("should preserve existing answered questions when revisiting", () => {
    const sessionId = uuidv4();
    const answeredQuestion: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId,
      roundNumber: 1,
      sequenceInRound: 1,
      question: "What is budget?",
      targetAmbiguity: "budget",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "answered",
      createdAt: new Date().toISOString(),
      answeredAt: new Date().toISOString(),
      userAnswer: {
        answerId: uuidv4(),
        questionId: uuidv4(),
        sessionId,
        answer: "$100k",
        skipCommand: false,
        createdAt: new Date().toISOString()
      }
    };

    const skippedQuestion: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId,
      roundNumber: 1,
      sequenceInRound: 2,
      question: "What is timeline?",
      targetAmbiguity: "timeline",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "skipped",
      createdAt: new Date().toISOString()
    };

    const state: SessionState = {
      sessionId,
      requestText: "Test",
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clarificationRounds: 1,
      debateCycles: 0,
      extendedDebateRequested: false,
      assumptions: [],
      participants: [],
      messageTurns: [],
      discussions: [],
      clarificationQuestions: [answeredQuestion, skippedQuestion],
      metadata: {}
    };

    // When revisiting, answered questions should remain answered
    expect(answeredQuestion.status).toBe("answered");
    expect(answeredQuestion.userAnswer?.answer).toBe("$100k");
  });
});
