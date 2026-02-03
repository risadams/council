import { describe, it, expect, beforeEach } from "vitest";
import { SessionStore } from "../../server/src/services/sessionStore.js";
import { SessionManager } from "../../server/src/services/sessionManager.js";
import type { SessionState } from "../../server/src/types/session.js";

describe("Session Recovery - Integration Tests", () => {
  let sessionStore: SessionStore;
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionStore = new SessionStore();
    sessionManager = new SessionManager(sessionStore, {
      interactiveModeEnabled: true,
      debateCycleLimit: 10,
      extendedDebateCycleLimit: 20
    });
  });

  describe("session persistence", () => {
    it("should create and retrieve session", () => {
      const session = sessionManager.createSession("Test request", false);
      const retrieved = sessionManager.getSession(session.sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.sessionId).toBe(session.sessionId);
      expect(retrieved?.requestText).toBe("Test request");
    });

    it("should return undefined for non-existent session", () => {
      const retrieved = sessionManager.getSession("non-existent-id");
      expect(retrieved).toBeUndefined();
    });

    it("should maintain session state across multiple retrievals", () => {
      const session = sessionManager.createSession("Test", false);
      
      // Retrieve multiple times
      const retrieval1 = sessionManager.getSession(session.sessionId);
      const retrieval2 = sessionManager.getSession(session.sessionId);

      expect(retrieval1?.sessionId).toBe(retrieval2?.sessionId);
      expect(retrieval1?.requestText).toBe(retrieval2?.requestText);
    });
  });

  describe("session state updates", () => {
    it("should preserve session state after status change", () => {
      const session = sessionManager.createSession("Test", false);
      const originalId = session.sessionId;

      sessionManager.setSessionStatus(session.sessionId, "clarifying");
      const updated = sessionManager.getSession(originalId);

      expect(updated).toBeDefined();
      expect(updated?.status).toBe("clarifying");
      expect(updated?.sessionId).toBe(originalId);
    });

    it("should preserve clarification questions across updates", () => {
      const session = sessionManager.createSession("Test", false);
      session.clarificationQuestions.push({
        questionId: "q1",
        sessionId: session.sessionId,
        roundNumber: 1,
        sequenceInRound: 1,
        question: "Test question",
        askedBy: { participantId: "sys", type: "system", name: "System" },
        status: "pending",
        createdAt: new Date().toISOString()
      });

      // Store updated session
      sessionStore.saveSession(session);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.clarificationQuestions).toHaveLength(1);
      expect(retrieved?.clarificationQuestions[0].question).toBe("Test question");
    });

    it("should preserve message turns across updates", () => {
      const session = sessionManager.createSession("Test", false);
      sessionManager.addMessageTurn(
        session.sessionId,
        { participantId: "user", type: "user", name: "User" },
        "answer",
        "User response"
      );

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.messageTurns).toHaveLength(1);
      expect(retrieved?.messageTurns[0].content).toBe("User response");
    });
  });

  describe("session lifecycle", () => {
    it("should track session from creation to completion", () => {
      const session = sessionManager.createSession("Test", false);
      expect(session.status).toBe("created");

      sessionManager.setSessionStatus(session.sessionId, "clarifying");
      let retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.status).toBe("clarifying");

      sessionManager.setSessionStatus(session.sessionId, "debating");
      retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.status).toBe("debating");

      sessionManager.setSessionStatus(session.sessionId, "completed");
      retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.status).toBe("completed");
    });

    it("should maintain debate cycles count", () => {
      const session = sessionManager.createSession("Test", false);
      expect(session.debateCycles).toBe(0);

      // Simulate debate cycles
      const updatedSession: SessionState = {
        ...session,
        debateCycles: 5
      };
      sessionStore.saveSession(updatedSession);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.debateCycles).toBe(5);
    });

    it("should maintain clarification rounds count", () => {
      const session = sessionManager.createSession("Test", false);
      expect(session.clarificationRounds).toBe(0);

      const updatedSession: SessionState = {
        ...session,
        clarificationRounds: 2
      };
      sessionStore.saveSession(updatedSession);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.clarificationRounds).toBe(2);
    });
  });

  describe("concurrent session handling", () => {
    it("should handle multiple concurrent sessions", () => {
      const session1 = sessionManager.createSession("Request 1", false);
      const session2 = sessionManager.createSession("Request 2", false);
      const session3 = sessionManager.createSession("Request 3", false);

      expect(session1.sessionId).not.toBe(session2.sessionId);
      expect(session2.sessionId).not.toBe(session3.sessionId);

      const retrieved1 = sessionManager.getSession(session1.sessionId);
      const retrieved2 = sessionManager.getSession(session2.sessionId);
      const retrieved3 = sessionManager.getSession(session3.sessionId);

      expect(retrieved1?.requestText).toBe("Request 1");
      expect(retrieved2?.requestText).toBe("Request 2");
      expect(retrieved3?.requestText).toBe("Request 3");
    });

    it("should isolate session state between concurrent sessions", () => {
      const session1 = sessionManager.createSession("Test 1", false);
      const session2 = sessionManager.createSession("Test 2", true);

      sessionManager.setSessionStatus(session1.sessionId, "clarifying");
      sessionManager.setSessionStatus(session2.sessionId, "debating");

      const retrieved1 = sessionManager.getSession(session1.sessionId);
      const retrieved2 = sessionManager.getSession(session2.sessionId);

      expect(retrieved1?.status).toBe("clarifying");
      expect(retrieved2?.status).toBe("debating");
      expect(retrieved1?.extendedDebateRequested).toBe(false);
      expect(retrieved2?.extendedDebateRequested).toBe(true);
    });
  });

  describe("error recovery", () => {
    it("should handle invalid session updates gracefully", () => {
      const session = sessionManager.createSession("Test", false);
      
      // Attempt to update non-existent field (should not crash)
      const updatedSession = { ...session, invalidField: "test" } as any;
      sessionStore.saveSession(updatedSession);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved).toBeDefined();
    });

    it("should maintain session integrity after failed operations", () => {
      const session = sessionManager.createSession("Test", false);
      const originalStatus = session.status;

      // Try invalid status
      try {
        sessionManager.setSessionStatus(session.sessionId, "invalid" as any);
      } catch (err) {
        // Expected to fail
      }

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.status).toBe(originalStatus);
    });
  });
});
