import { describe, it, expect } from "vitest";
import { createAssumption } from "../../server/src/services/assumptionManager.js";
import type { ClarificationQuestion } from "../../server/src/types/session.js";
import { v4 as uuidv4 } from "uuid";

describe("Assumption Statements - Golden Tests", () => {
  it("should generate assumption text containing target ambiguity", () => {
    const question: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId: uuidv4(),
      roundNumber: 1,
      sequenceInRound: 1,
      question: "What is your timeline?",
      targetAmbiguity: "timeline",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "skipped",
      createdAt: new Date().toISOString()
    };

    const assumption = createAssumption({ sessionId: question.sessionId, question });

    // Golden expectation: assumption text includes "Assuming" prefix
    expect(assumption.assumption).toMatch(/^Assuming/);
    expect(assumption.assumption).toContain("timeline");
  });

  it("should generate clear rationale for skipped questions", () => {
    const question: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId: uuidv4(),
      roundNumber: 1,
      sequenceInRound: 1,
      question: "What is the budget?",
      targetAmbiguity: "budget",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "skipped",
      createdAt: new Date().toISOString()
    };

    const assumption = createAssumption({ sessionId: question.sessionId, question });

    // Golden expectation: rationale explains why assumption was made
    expect(assumption.rationale).toContain("skipped");
  });

  it("should format assumption for multiple skipped questions consistently", () => {
    const questions: ClarificationQuestion[] = [
      {
        questionId: uuidv4(),
        sessionId: uuidv4(),
        roundNumber: 1,
        sequenceInRound: 1,
        question: "What is priority?",
        targetAmbiguity: "priority",
        askedBy: { participantId: uuidv4(), type: "system", name: "System" },
        status: "skipped",
        createdAt: new Date().toISOString()
      },
      {
        questionId: uuidv4(),
        sessionId: uuidv4(),
        roundNumber: 1,
        sequenceInRound: 2,
        question: "What is scope?",
        targetAmbiguity: "scope",
        askedBy: { participantId: uuidv4(), type: "system", name: "System" },
        status: "skipped",
        createdAt: new Date().toISOString()
      }
    ];

    const assumptions = questions.map((q) => createAssumption({ sessionId: q.sessionId, question: q }));

    // All assumptions should follow same format
    assumptions.forEach((a) => {
      expect(a.assumption).toMatch(/^Assuming/);
      expect(a.rationale).toBeDefined();
      expect(a.addedAt).toBeDefined();
    });

    // Each should reference different ambiguity
    expect(assumptions[0].assumption).toContain("priority");
    expect(assumptions[1].assumption).toContain("scope");
  });

  it("should include assumption ID and timestamp metadata", () => {
    const question: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId: uuidv4(),
      roundNumber: 1,
      sequenceInRound: 1,
      question: "What is the scale?",
      targetAmbiguity: "scale",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "skipped",
      createdAt: new Date().toISOString()
    };

    const assumption = createAssumption({ sessionId: question.sessionId, question });

    // Golden expectations for metadata
    expect(assumption.assumptionId).toBeDefined();
    expect(assumption.assumptionId.length).toBeGreaterThan(0);
    expect(assumption.addedAt).toBeDefined();
    
    const timestamp = new Date(assumption.addedAt);
    expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("should link assumption to original question", () => {
    const question: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId: uuidv4(),
      roundNumber: 1,
      sequenceInRound: 1,
      question: "What are constraints?",
      targetAmbiguity: "constraints",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "skipped",
      createdAt: new Date().toISOString()
    };

    const assumption = createAssumption({ sessionId: question.sessionId, question });

    expect(assumption.relatedQuestionId).toBe(question.questionId);
    expect(assumption.sessionId).toBe(question.sessionId);
  });

  it("should generate readable assumption text for user display", () => {
    const question: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId: uuidv4(),
      roundNumber: 1,
      sequenceInRound: 1,
      question: "What is the deployment strategy?",
      targetAmbiguity: "deployment strategy",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "skipped",
      createdAt: new Date().toISOString()
    };

    const assumption = createAssumption({ sessionId: question.sessionId, question });

    // Golden expectation: assumption is readable and clear
    expect(assumption.assumption.length).toBeGreaterThan(10);
    expect(assumption.assumption).toMatch(/^Assuming .+ (are|is)/);
  });

  it("should support custom rationale when provided", () => {
    const question: ClarificationQuestion = {
      questionId: uuidv4(),
      sessionId: uuidv4(),
      roundNumber: 1,
      sequenceInRound: 1,
      question: "What is the team size?",
      targetAmbiguity: "team size",
      askedBy: { participantId: uuidv4(), type: "system", name: "System" },
      status: "skipped",
      createdAt: new Date().toISOString()
    };

    const customRationale = "User preferred to use default team size assumption";
    const assumption = createAssumption({ 
      sessionId: question.sessionId, 
      question,
      rationale: customRationale
    });

    expect(assumption.rationale).toBe(customRationale);
  });
});
