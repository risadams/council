import { describe, it, expect, beforeEach } from "vitest";
import { isSkipCommand, recordClarificationAnswer } from "../../server/src/services/clarificationOrchestrator.js";
import { createAssumption } from "../../server/src/services/assumptionManager.js";
import type { SessionState, ClarificationQuestion, Participant } from "../../server/src/types/session.js";
import { v4 as uuidv4 } from "uuid";

describe("Clarification Skip/Defer Handling", () => {
  describe("isSkipCommand", () => {
    it("should detect 'skip' command", () => {
      expect(isSkipCommand("skip")).toBe(true);
      expect(isSkipCommand("Skip")).toBe(true);
      expect(isSkipCommand("SKIP")).toBe(true);
    });

    it("should detect 'skip question' command", () => {
      expect(isSkipCommand("skip question")).toBe(true);
      expect(isSkipCommand("Skip Question")).toBe(true);
    });

    it("should detect 'defer' command", () => {
      expect(isSkipCommand("defer")).toBe(true);
      expect(isSkipCommand("Defer")).toBe(true);
    });

    it("should not detect non-skip text", () => {
      expect(isSkipCommand("This is my answer")).toBe(false);
      expect(isSkipCommand("I don't know")).toBe(false);
      expect(isSkipCommand("not sure")).toBe(false);
    });

    it("should handle whitespace variations", () => {
      expect(isSkipCommand("  skip  ")).toBe(true);
      expect(isSkipCommand("\tdefer\n")).toBe(true);
    });
  });

  describe("recordClarificationAnswer with skip", () => {
    let mockSession: SessionState;
    let mockQuestion: ClarificationQuestion;
    let mockUser: Participant;

    beforeEach(() => {
      const sessionId = uuidv4();
      const systemParticipant: Participant = {
        participantId: uuidv4(),
        type: "system",
        name: "System"
      };

      mockQuestion = {
        questionId: uuidv4(),
        sessionId,
        roundNumber: 1,
        sequenceInRound: 1,
        question: "What is your timeline?",
        targetAmbiguity: "timeline",
        askedBy: systemParticipant,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      mockUser = {
        participantId: uuidv4(),
        type: "user",
        name: "User"
      };

      mockSession = {
        sessionId,
        requestText: "Test request",
        status: "clarifying",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clarificationRounds: 1,
        debateCycles: 0,
        extendedDebateRequested: false,
        assumptions: [],
        participants: [systemParticipant, mockUser],
        messageTurns: [],
        discussions: [],
        clarificationQuestions: [mockQuestion],
        metadata: {}
      };
    });

    it("should mark question as skipped when skip command is used", () => {
      const result = recordClarificationAnswer({
        session: mockSession,
        question: mockQuestion,
        answerText: "skip",
        skipCommand: true,
        userParticipant: mockUser
      });

      const skippedQuestion = result.updatedSession.clarificationQuestions.find(
        (q) => q.questionId === mockQuestion.questionId
      );
      expect(skippedQuestion?.status).toBe("skipped");
    });

    it("should record answer when not skipped", () => {
      const result = recordClarificationAnswer({
        session: mockSession,
        question: mockQuestion,
        answerText: "Two weeks",
        skipCommand: false,
        userParticipant: mockUser
      });

      const answeredQuestion = result.updatedSession.clarificationQuestions.find(
        (q) => q.questionId === mockQuestion.questionId
      );
      expect(answeredQuestion?.status).toBe("answered");
      expect(answeredQuestion?.userAnswer?.answer).toBe("Two weeks");
    });

    it("should create message turn for skip command", () => {
      const result = recordClarificationAnswer({
        session: mockSession,
        question: mockQuestion,
        answerText: "skip",
        skipCommand: true,
        userParticipant: mockUser
      });

      expect(result.updatedSession.messageTurns.length).toBeGreaterThan(0);
      const skipTurn = result.updatedSession.messageTurns.find((t) => t.content.includes("skip"));
      expect(skipTurn).toBeDefined();
    });
  });

  describe("createAssumption for skipped questions", () => {
    it("should generate assumption for skipped question", () => {
      const sessionId = uuidv4();
      const question: ClarificationQuestion = {
        questionId: uuidv4(),
        sessionId,
        roundNumber: 1,
        sequenceInRound: 1,
        question: "What is your budget?",
        targetAmbiguity: "budget",
        askedBy: { participantId: uuidv4(), type: "system", name: "System" },
        status: "skipped",
        createdAt: new Date().toISOString()
      };

      const assumption = createAssumption({ sessionId, question });

      expect(assumption.sessionId).toBe(sessionId);
      expect(assumption.relatedQuestionId).toBe(question.questionId);
      expect(assumption.assumption).toContain("budget");
      expect(assumption.rationale).toContain("skipped");
    });

    it("should handle custom rationale", () => {
      const question: ClarificationQuestion = {
        questionId: uuidv4(),
        sessionId: uuidv4(),
        roundNumber: 1,
        sequenceInRound: 1,
        question: "What is priority?",
        targetAmbiguity: "priority",
        askedBy: { participantId: uuidv4(), type: "system", name: "System" },
        status: "skipped",
        createdAt: new Date().toISOString()
      };

      const assumption = createAssumption({
        sessionId: question.sessionId,
        question,
        rationale: "User wants to proceed quickly"
      });

      expect(assumption.rationale).toBe("User wants to proceed quickly");
    });

    it("should include timestamp", () => {
      const question: ClarificationQuestion = {
        questionId: uuidv4(),
        sessionId: uuidv4(),
        roundNumber: 1,
        sequenceInRound: 1,
        question: "What is scope?",
        targetAmbiguity: "scope",
        askedBy: { participantId: uuidv4(), type: "system", name: "System" },
        status: "skipped",
        createdAt: new Date().toISOString()
      };

      const assumption = createAssumption({ sessionId: question.sessionId, question });

      expect(assumption.addedAt).toBeDefined();
      const timestamp = new Date(assumption.addedAt);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
