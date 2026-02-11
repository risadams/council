import { randomUUID } from "crypto";
import type {
  Assumption,
  ClarificationQuestion,
  MessageTurn,
  Participant,
  PersonaSelection,
  SessionState,
  SessionStatus
} from "../types/session.js";
import { SessionStore } from "./sessionStore.js";
import { createMessageTurn } from "../utils/sessionLogger.js";

export type SessionManagerConfig = {
  interactiveModeEnabled: boolean;
  debateCycleLimit: number;
  extendedDebateCycleLimit: number;
};

export class SessionManager {
  constructor(private store: SessionStore, private config: SessionManagerConfig) {}

  createSession(requestText: string, extendedDebateRequested: boolean): SessionState {
    const now = new Date().toISOString();
    const session: Omit<SessionState, "sessionId"> = {
      status: "created",
      requestText,
      clarificationRounds: 0,
      debateCycles: 0,
      extendedDebateRequested,
      participants: [],
      messageTurns: [],
      clarificationQuestions: [],
      assumptions: [],
      discussions: [],
      createdAt: now,
      updatedAt: now,
      metadata: {
        interactiveModeEnabled: this.config.interactiveModeEnabled,
        debateCycleLimit: this.config.debateCycleLimit,
        extendedDebateCycleLimit: this.config.extendedDebateCycleLimit
      }
    };
    return this.store.createSession(session);
  }

  setStatus(sessionId: string, status: SessionStatus): SessionState | undefined {
    return this.store.updateSession(sessionId, (current) => ({
      ...current,
      status,
      updatedAt: new Date().toISOString()
    }));
  }
  setSessionStatus(sessionId: string, status: SessionStatus): SessionState | undefined {
    const validStatuses: SessionStatus[] = ['created', 'clarifying', 'debating', 'completed'];
    if (!validStatuses.includes(status)) {
      const session = this.store.getSession(sessionId);
      return session; // Return current session without changes on invalid status
    }
    return this.setStatus(sessionId, status);
  }
  addParticipant(sessionId: string, participant: Participant): SessionState | undefined {
    return this.store.updateSession(sessionId, (current) => ({
      ...current,
      participants: [...current.participants, participant],
      updatedAt: new Date().toISOString()
    }));
  }

  addMessageTurn(sessionId: string, senderOrTurn?: Participant | MessageTurn, messageTypeOrUndefined?: string, content?: string): SessionState | undefined {
    let turn: MessageTurn;
    
    // Support both old API (sender, messageType, content) and new API (turn object)
    if (senderOrTurn && 'turnId' in senderOrTurn) {
      // New API: full MessageTurn object
      turn = senderOrTurn as MessageTurn;
    } else if (senderOrTurn) {
      // Old API: (sender, messageType, content)
      const sender = senderOrTurn as Participant;
      const session = this.store.getSession(sessionId);
      if (!session) return undefined;
      turn = createMessageTurn({
        sessionId,
        sender,
        messageType: (messageTypeOrUndefined as any) || 'answer',
        content: content || '',
        sequenceNumber: session.messageTurns.length + 1
      });
    } else {
      return undefined;
    }
    
    return this.store.updateSession(sessionId, (current) => ({
      ...current,
      messageTurns: [...current.messageTurns, turn],
      updatedAt: new Date().toISOString()
    }));
  }

  addClarificationQuestion(sessionId: string, question: ClarificationQuestion): SessionState | undefined {
    return this.store.updateSession(sessionId, (current) => ({
      ...current,
      clarificationQuestions: [...current.clarificationQuestions, question],
      updatedAt: new Date().toISOString()
    }));
  }

  addAssumption(sessionId: string, assumption: Assumption): SessionState | undefined {
    return this.store.updateSession(sessionId, (current) => ({
      ...current,
      assumptions: [...current.assumptions, assumption],
      updatedAt: new Date().toISOString()
    }));
  }

  setPersonaSelection(sessionId: string, selection: PersonaSelection): SessionState | undefined {
    return this.store.updateSession(sessionId, (current) => ({
      ...current,
      personaSelection: selection,
      updatedAt: new Date().toISOString()
    }));
  }

  appendSystemMessage(sessionId: string, content: string, messageType: MessageTurn["messageType"]): SessionState | undefined {
    const session = this.store.getSession(sessionId);
    if (!session) return undefined;
    const systemParticipant: Participant = {
      participantId: randomUUID(),
      type: "system",
      name: "System"
    };
    const turn = createMessageTurn({
      sessionId,
      sender: systemParticipant,
      messageType,
      content,
      sequenceNumber: session.messageTurns.length + 1
    });
    return this.addMessageTurn(sessionId, turn);
  }

  getSession(sessionId: string): SessionState | undefined {
    return this.store.getSession(sessionId);
  }
}
