import { describe, it, expect, beforeEach } from "vitest";
import { resolveDebateLimit, hasReachedDebateLimit } from "../../server/src/services/debateLimiter.js";
import { startDiscussion } from "../../server/src/services/discussionOrchestrator.js";
import type { SessionState, Participant } from "../../server/src/types/session.js";
import { v4 as uuidv4 } from "uuid";

describe("Extended Debate Mode - Integration", () => {
  let mockSession: SessionState;
  let mockPersonas: Participant[];

  beforeEach(() => {
    const sessionId = uuidv4();
    mockSession = {
      sessionId,
      requestText: "Complex architecture decision",
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

    mockPersonas = [
      { participantId: uuidv4(), type: "persona", name: "Senior Architect", role: "advisor" },
      { participantId: uuidv4(), type: "persona", name: "Security Expert", role: "advisor" }
    ];
  });

  describe("default debate limit", () => {
    it("should enforce default 10 cycle limit", () => {
      const config = { defaultLimit: 10, extendedLimit: 20 };
      const limit = resolveDebateLimit(config, false);

      expect(limit).toBe(10);
      expect(hasReachedDebateLimit(9, limit)).toBe(false);
      expect(hasReachedDebateLimit(10, limit)).toBe(true);
    });

    it("should stop discussion after reaching default limit", () => {
      const config = { defaultLimit: 10, extendedLimit: 20 };
      const limit = resolveDebateLimit(config, false);

      // Simulate running debates up to limit
      let session = mockSession;
      for (let i = 1; i <= 10; i++) {
        if (!hasReachedDebateLimit(session.debateCycles, limit)) {
          const result = startDiscussion({
            session,
            personas: mockPersonas,
            topic: `Topic ${i}`,
            cycleNumber: i
          });
          session = result.updatedSession;
        }
      }

      expect(session.debateCycles).toBe(10);
      expect(hasReachedDebateLimit(session.debateCycles, limit)).toBe(true);
    });
  });

  describe("extended debate mode", () => {
    it("should use extended limit when requested", () => {
      const config = { defaultLimit: 10, extendedLimit: 20 };
      const limit = resolveDebateLimit(config, true);

      expect(limit).toBe(20);
    });

    it("should allow debates beyond default limit with extended mode", () => {
      mockSession.extendedDebateRequested = true;
      const config = { defaultLimit: 10, extendedLimit: 20 };
      const limit = resolveDebateLimit(config, true);

      expect(hasReachedDebateLimit(10, limit)).toBe(false);
      expect(hasReachedDebateLimit(15, limit)).toBe(false);
      expect(hasReachedDebateLimit(20, limit)).toBe(true);
    });

    it("should conduct 20 debate cycles in extended mode", () => {
      mockSession.extendedDebateRequested = true;
      const config = { defaultLimit: 10, extendedLimit: 20 };
      const limit = resolveDebateLimit(config, true);

      let session = mockSession;
      for (let i = 1; i <= 20; i++) {
        if (!hasReachedDebateLimit(session.debateCycles, limit)) {
          const result = startDiscussion({
            session,
            personas: mockPersonas,
            topic: `Extended topic ${i}`,
            cycleNumber: i
          });
          session = result.updatedSession;
        }
      }

      expect(session.debateCycles).toBe(20);
      expect(hasReachedDebateLimit(session.debateCycles, limit)).toBe(true);
    });

    it("should persist extended debate flag throughout session", () => {
      mockSession.extendedDebateRequested = true;

      const result = startDiscussion({
        session: mockSession,
        personas: mockPersonas,
        topic: "Test topic",
        cycleNumber: 1
      });

      expect(result.updatedSession.extendedDebateRequested).toBe(true);
    });

    it("should track all discussions in extended debate", () => {
      mockSession.extendedDebateRequested = true;
      const config = { defaultLimit: 10, extendedLimit: 20 };
      const limit = resolveDebateLimit(config, true);

      let session = mockSession;
      const discussionCount = 15;

      for (let i = 1; i <= discussionCount; i++) {
        if (!hasReachedDebateLimit(session.debateCycles, limit)) {
          const result = startDiscussion({
            session,
            personas: mockPersonas,
            topic: `Topic ${i}`,
            cycleNumber: i
          });
          session = result.updatedSession;
        }
      }

      expect(session.discussions).toHaveLength(discussionCount);
      expect(session.debateCycles).toBe(discussionCount);
    });
  });

  describe("limit transitions", () => {
    it("should prevent further debates when default limit reached", () => {
      const config = { defaultLimit: 10, extendedLimit: 20 };
      const limit = resolveDebateLimit(config, false);

      let session = mockSession;
      for (let i = 1; i <= 10; i++) {
        const result = startDiscussion({
          session,
          personas: mockPersonas,
          topic: `Topic ${i}`,
          cycleNumber: i
        });
        session = result.updatedSession;
      }

      // Attempt one more debate
      const canContinue = !hasReachedDebateLimit(session.debateCycles, limit);
      expect(canContinue).toBe(false);
    });

    it("should prevent debates when extended limit reached", () => {
      mockSession.extendedDebateRequested = true;
      const config = { defaultLimit: 10, extendedLimit: 20 };
      const limit = resolveDebateLimit(config, true);

      let session = mockSession;
      for (let i = 1; i <= 20; i++) {
        const result = startDiscussion({
          session,
          personas: mockPersonas,
          topic: `Topic ${i}`,
          cycleNumber: i
        });
        session = result.updatedSession;
      }

      const canContinue = !hasReachedDebateLimit(session.debateCycles, limit);
      expect(canContinue).toBe(false);
    });
  });
});
