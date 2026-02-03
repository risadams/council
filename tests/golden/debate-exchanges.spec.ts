import { describe, it, expect } from "vitest";
import { startDiscussion } from "../../server/src/services/discussionOrchestrator.js";
import type { SessionState, Participant } from "../../server/src/types/session.js";
import { v4 as uuidv4 } from "uuid";

describe("Debate Exchanges - Golden Tests", () => {
  it("should attribute each message to a specific persona", () => {
    const sessionId = uuidv4();
    const mockSession: SessionState = {
      sessionId,
      requestText: "Test request",
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
      metadata: {}
    };

    const personas: Participant[] = [
      { participantId: uuidv4(), type: "persona", name: "Senior Developer", role: "advisor" },
      { participantId: uuidv4(), type: "persona", name: "Security Expert", role: "advisor" }
    ];

    const result = startDiscussion({
      session: mockSession,
      personas,
      topic: "API security practices",
      cycleNumber: 1
    });

    // Verify each message has persona attribution
    result.discussion.messageTurns.forEach((turn) => {
      expect(turn.sender.type).toBe("persona");
      expect(turn.sender.name).toMatch(/Senior Developer|Security Expert/);
      expect(turn.content).toContain(turn.sender.name);
    });
  });

  it("should include persona names in debate messages", () => {
    const sessionId = uuidv4();
    const mockSession: SessionState = {
      sessionId,
      requestText: "Test request",
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
      metadata: {}
    };

    const personas: Participant[] = [
      { participantId: uuidv4(), type: "persona", name: "Senior Architect", role: "advisor" },
      { participantId: uuidv4(), type: "persona", name: "DevOps Engineer", role: "advisor" }
    ];

    const result = startDiscussion({
      session: mockSession,
      personas,
      topic: "Microservices architecture",
      cycleNumber: 1
    });

    // Verify persona names appear in content
    const architectMessage = result.discussion.messageTurns.find((t) => t.sender.name === "Senior Architect");
    const devopsMessage = result.discussion.messageTurns.find((t) => t.sender.name === "DevOps Engineer");

    expect(architectMessage).toBeDefined();
    expect(devopsMessage).toBeDefined();
    expect(architectMessage!.content).toContain("Senior Architect");
    expect(devopsMessage!.content).toContain("DevOps Engineer");
  });

  it("should maintain persona attribution across multiple cycles", () => {
    const sessionId = uuidv4();
    const mockSession: SessionState = {
      sessionId,
      requestText: "Test request",
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
      metadata: {}
    };

    const personas: Participant[] = [
      { participantId: uuidv4(), type: "persona", name: "Product Owner", role: "advisor" },
      { participantId: uuidv4(), type: "persona", name: "QA Engineer", role: "advisor" }
    ];

    // First cycle
    const result1 = startDiscussion({
      session: mockSession,
      personas,
      topic: "Feature prioritization",
      cycleNumber: 1
    });

    // Second cycle
    const result2 = startDiscussion({
      session: result1.updatedSession,
      personas,
      topic: "Testing strategy",
      cycleNumber: 2
    });

    // Verify both cycles maintain attribution
    expect(result2.updatedSession.discussions).toHaveLength(2);
    result2.updatedSession.discussions.forEach((discussion, index) => {
      expect(discussion.participatingPersonas).toContain("Product Owner");
      expect(discussion.participatingPersonas).toContain("QA Engineer");
      
      discussion.messageTurns.forEach((turn) => {
        expect(turn.sender.type).toBe("persona");
        expect(["Product Owner", "QA Engineer"]).toContain(turn.sender.name);
      });
    });
  });

  it("should format debate exchanges with clear persona markers", () => {
    const sessionId = uuidv4();
    const mockSession: SessionState = {
      sessionId,
      requestText: "Test request",
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
      metadata: {}
    };

    const personas: Participant[] = [
      { participantId: uuidv4(), type: "persona", name: "Tech Lead", role: "advisor" },
      { participantId: uuidv4(), type: "persona", name: "Senior Developer", role: "advisor" }
    ];

    const result = startDiscussion({
      session: mockSession,
      personas,
      topic: "Code review standards",
      cycleNumber: 1
    });

    // Each message should be clearly attributed
    result.discussion.messageTurns.forEach((turn) => {
      // Golden expectation: persona name appears at start of message
      expect(turn.content).toMatch(/^(Tech Lead|Senior Developer)/);
      expect(turn.sender.name).toMatch(/Tech Lead|Senior Developer/);
    });
  });

  it("should preserve persona context across all exchanges", () => {
    const sessionId = uuidv4();
    const mockSession: SessionState = {
      sessionId,
      requestText: "Test request",
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
      metadata: {}
    };

    const personas: Participant[] = [
      { participantId: uuidv4(), type: "persona", name: "Scrum Master", role: "advisor" },
      { participantId: uuidv4(), type: "persona", name: "Culture Lead", role: "advisor" }
    ];

    const result = startDiscussion({
      session: mockSession,
      personas,
      topic: "Team process improvements",
      cycleNumber: 1
    });

    // Verify full discussion context
    expect(result.discussion.participatingPersonas).toEqual(["Scrum Master", "Culture Lead"]);
    expect(result.discussion.messageTurns.length).toBe(2);
    
    // Each turn has complete participant context
    result.discussion.messageTurns.forEach((turn) => {
      expect(turn.sender).toHaveProperty("participantId");
      expect(turn.sender).toHaveProperty("type", "persona");
      expect(turn.sender).toHaveProperty("name");
      expect(turn.sender).toHaveProperty("role");
    });
  });
});
