import { describe, it, expect, beforeEach } from "vitest";
import { startDiscussion } from "../../server/src/services/discussionOrchestrator.js";
import type { SessionState, Participant } from "../../server/src/types/session.js";
import { v4 as uuidv4 } from "uuid";

describe("CouncilDiscussionOrchestrator - end-to-end debate flow", () => {
  let mockSession: SessionState;
  let mockPersonas: Participant[];

  beforeEach(() => {
    const sessionId = uuidv4();
    mockSession = {
      sessionId,
      requestText: "How should we approach database migration?",
      status: "debating",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clarificationRounds: 0,
      debateCycles: 0,
      extendedDebateRequested: false,
      assumptions: [],
      participants: [],
      messageTurns: [],
      discussions: [],
      clarificationQuestions: [],
      finalAnswer: "",
      metadata: {}
    };

    mockPersonas = [
      { participantId: uuidv4(), type: "persona", name: "Senior Developer", role: "advisor" },
      { participantId: uuidv4(), type: "persona", name: "DevOps Engineer", role: "advisor" },
      { participantId: uuidv4(), type: "persona", name: "Senior Architect", role: "advisor" }
    ];
  });

  it("should create a discussion with participating personas", () => {
    const result = startDiscussion({
      session: mockSession,
      personas: mockPersonas,
      topic: "database migration strategy",
      cycleNumber: 1
    });

    expect(result.discussion).toBeDefined();
    expect(result.discussion.sessionId).toBe(mockSession.sessionId);
    expect(result.discussion.cycleNumber).toBe(1);
    expect(result.discussion.participatingPersonas).toEqual(["Senior Developer", "DevOps Engineer", "Senior Architect"]);
    expect(result.discussion.topic).toBe("database migration strategy");
  });

  it("should generate message turns for each persona", () => {
    const result = startDiscussion({
      session: mockSession,
      personas: mockPersonas,
      topic: "database migration strategy",
      cycleNumber: 1
    });

    expect(result.discussion.messageTurns).toHaveLength(3);
    expect(result.discussion.messageTurns[0].sender.name).toBe("Senior Developer");
    expect(result.discussion.messageTurns[1].sender.name).toBe("DevOps Engineer");
    expect(result.discussion.messageTurns[2].sender.name).toBe("Senior Architect");
  });

  it("should update session with new discussion", () => {
    const result = startDiscussion({
      session: mockSession,
      personas: mockPersonas,
      topic: "database migration strategy",
      cycleNumber: 1
    });

    expect(result.updatedSession.discussions).toHaveLength(1);
    expect(result.updatedSession.debateCycles).toBe(1);
    expect(result.updatedSession.messageTurns.length).toBeGreaterThan(0);
  });

  it("should increment debate cycles with each discussion", () => {
    const result1 = startDiscussion({
      session: mockSession,
      personas: mockPersonas,
      topic: "first topic",
      cycleNumber: 1
    });

    const result2 = startDiscussion({
      session: result1.updatedSession,
      personas: mockPersonas,
      topic: "second topic",
      cycleNumber: 2
    });

    expect(result2.updatedSession.debateCycles).toBe(2);
    expect(result2.updatedSession.discussions).toHaveLength(2);
  });

  it("should mark discussion as concluded", () => {
    const result = startDiscussion({
      session: mockSession,
      personas: mockPersonas,
      topic: "database migration strategy",
      cycleNumber: 1
    });

    const discussion = result.updatedSession.discussions[0];
    expect(discussion.status).toBe("concluded");
    expect(discussion.exchangeEnds).toBeDefined();
  });

  it("should handle single persona discussion", () => {
    const singlePersona = [mockPersonas[0]];
    const result = startDiscussion({
      session: mockSession,
      personas: singlePersona,
      topic: "focused review",
      cycleNumber: 1
    });

    expect(result.discussion.participatingPersonas).toHaveLength(1);
    expect(result.discussion.messageTurns).toHaveLength(1);
  });

  it("should properly sequence message turns", () => {
    const result = startDiscussion({
      session: mockSession,
      personas: mockPersonas,
      topic: "database migration strategy",
      cycleNumber: 1
    });

    const turns = result.discussion.messageTurns;
    expect(turns[0].sequenceNumber).toBe(1);
    expect(turns[1].sequenceNumber).toBe(2);
    expect(turns[2].sequenceNumber).toBe(3);
  });

  it("should update session timestamps", () => {
    const beforeUpdate = new Date(mockSession.updatedAt).getTime();
    const result = startDiscussion({
      session: mockSession,
      personas: mockPersonas,
      topic: "database migration strategy",
      cycleNumber: 1
    });

    const afterUpdate = new Date(result.updatedSession.updatedAt).getTime();
    expect(afterUpdate).toBeGreaterThanOrEqual(beforeUpdate);
  });

  it("should preserve existing session data", () => {
    mockSession.clarificationRounds = 2;
    mockSession.assumptions = [{ assumptionId: "test", sessionId: mockSession.sessionId, assumption: "test", rationale: "test", addedAt: new Date().toISOString() }];

    const result = startDiscussion({
      session: mockSession,
      personas: mockPersonas,
      topic: "database migration strategy",
      cycleNumber: 1
    });

    expect(result.updatedSession.clarificationRounds).toBe(2);
    expect(result.updatedSession.assumptions).toHaveLength(1);
  });
});
