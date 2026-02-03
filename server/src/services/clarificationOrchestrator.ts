import { randomUUID } from "crypto";
import type { ClarificationQuestion, Participant, SessionState } from "../types/session.js";
import { createClarificationAnswer, createClarificationQuestion } from "../models/clarification.js";
import { createMessageTurn } from "../utils/sessionLogger.js";

const DEFAULT_QUESTIONS = [
  { question: "What is your primary goal or outcome?", targetAmbiguity: "goal" },
  { question: "What constraints or deadlines should we consider?", targetAmbiguity: "constraints" },
  { question: "Who is the intended audience or user?", targetAmbiguity: "audience" }
];

export type ClarificationResponse = {
  updatedSession: SessionState;
  nextQuestion?: ClarificationQuestion;
};

export function initializeClarifications(
  session: SessionState,
  askedBy: Participant
): ClarificationQuestion[] {
  if (session.clarificationQuestions.length > 0) return session.clarificationQuestions;
  return DEFAULT_QUESTIONS.map((q, index) =>
    createClarificationQuestion({
      sessionId: session.sessionId,
      roundNumber: 1,
      sequenceInRound: index + 1,
      question: q.question,
      askedBy,
      targetAmbiguity: q.targetAmbiguity
    })
  );
}

export function getNextClarificationQuestion(session: SessionState): ClarificationQuestion | undefined {
  return session.clarificationQuestions.find((q) => q.status === "pending");
}

export function recordClarificationAnswer(options: {
  session: SessionState;
  question: ClarificationQuestion;
  answerText: string;
  skipCommand: boolean;
  userParticipant: Participant;
}): ClarificationResponse {
  const { session, question, answerText, skipCommand, userParticipant } = options;
  const answer = createClarificationAnswer({
    sessionId: session.sessionId,
    questionId: question.questionId,
    answer: answerText,
    skipCommand
  });

  const updatedQuestions = session.clarificationQuestions.map((q) => {
    if (q.questionId !== question.questionId) return q;
    return {
      ...q,
      status: (skipCommand ? "skipped" : "answered") as ClarificationQuestion["status"],
      userAnswer: answer,
      answeredAt: new Date().toISOString()
    };
  });

  const messageTurn = createMessageTurn({
    sessionId: session.sessionId,
    sender: userParticipant,
    messageType: "answer",
    content: answerText,
    sequenceNumber: session.messageTurns.length + 1
  });

  const updatedSession: SessionState = {
    ...session,
    clarificationQuestions: updatedQuestions,
    messageTurns: [...session.messageTurns, messageTurn],
    updatedAt: new Date().toISOString()
  };

  return {
    updatedSession,
    nextQuestion: getNextClarificationQuestion(updatedSession)
  };
}

export function createSkipAssumption(question: ClarificationQuestion): string {
  return `Assuming ${question.targetAmbiguity ?? "details"} are acceptable as default`;
}

export function isSkipCommand(answerText: string): boolean {
  return /^\s*(skip|defer)(\s+question)?\s*$/i.test(answerText);
}

export function createSystemParticipant(): Participant {
  return {
    participantId: randomUUID(),
    type: "system",
    name: "System"
  };
}

/**
 * Enables revisiting skipped clarification questions
 * 
 * Resets skipped questions to pending status, allowing users to answer them
 * and regenerate the final response with the new information.
 * 
 * @param session - Current session state
 * @returns Updated session with skipped questions reset to pending
 */
export function revisitSkippedQuestions(session: SessionState): SessionState {
  const skippedQuestions = session.clarificationQuestions.filter((q) => q.status === "skipped");
  
  if (skippedQuestions.length === 0) {
    return session;
  }

  // Reset skipped questions to pending
  const updatedQuestions = session.clarificationQuestions.map((q) => {
    if (q.status === "skipped") {
      return {
        ...q,
        status: "pending" as ClarificationQuestion["status"],
        userAnswer: undefined,
        answeredAt: undefined
      };
    }
    return q;
  });

  // Remove assumptions related to skipped questions
  const skippedQuestionIds = new Set(skippedQuestions.map((q) => q.questionId));
  const updatedAssumptions = session.assumptions.filter(
    (a) => !a.relatedQuestionId || !skippedQuestionIds.has(a.relatedQuestionId)
  );

  return {
    ...session,
    status: "clarifying",
    clarificationQuestions: updatedQuestions,
    assumptions: updatedAssumptions,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Gets all skipped questions from the session
 * 
 * @param session - Current session state
 * @returns Array of skipped clarification questions
 */
export function getSkippedQuestions(session: SessionState): ClarificationQuestion[] {
  return session.clarificationQuestions.filter((q) => q.status === "skipped");
}
