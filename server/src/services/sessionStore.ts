import { randomUUID } from "crypto";
import type { SessionState } from "../types/session.js";

export class SessionStore {
  private sessions = new Map<string, SessionState>();

  createSession(state: Omit<SessionState, "sessionId">): SessionState {
    const sessionId = randomUUID();
    const session: SessionState = { ...state, sessionId };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId: string, updater: (current: SessionState) => SessionState): SessionState | undefined {
    const current = this.sessions.get(sessionId);
    if (!current) return undefined;
    const updated = updater(current);
    this.sessions.set(sessionId, updated);
    return updated;
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
  /**
   * Upsert a session.
   * - If state.sessionId is provided, the session will be stored/overwritten under that ID.
   * - If state.sessionId is missing, a new ID will be generated.
   */
  saveSession(state: SessionState): SessionState {
    const sessionId = state.sessionId ?? randomUUID();
    const session: SessionState = { ...state, sessionId };
    this.sessions.set(sessionId, session);
    return session;
  }
  clearAll(): void {
    this.sessions.clear();
  }
}
