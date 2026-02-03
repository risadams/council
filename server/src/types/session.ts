export type SessionStatus = "created" | "clarifying" | "debating" | "final" | "completed" | "cancelled" | "error";

export type ParticipantType = "user" | "persona" | "system";

export type MessageType = "question" | "answer" | "discussion" | "conclusion" | "assumption_statement";

export type QuestionStatus = "pending" | "answered" | "skipped" | "deferred";

export type DebateStatus = "in_progress" | "concluded" | "limit_reached";

export type Participant = {
  participantId: string;
  type: ParticipantType;
  name: string;
  role?: string;
};

export type MessageTurn = {
  turnId: string;
  sessionId: string;
  sender: Participant;
  recipient?: Participant;
  messageType: MessageType;
  content: string;
  timestamp: string;
  sequenceNumber: number;
  relatedCycleOrRound?: { cycleType: "clarification" | "debate"; number: number };
  metadata?: Record<string, unknown>;
};

export type ClarificationQuestion = {
  questionId: string;
  sessionId: string;
  roundNumber: number;
  sequenceInRound: number;
  question: string;
  targetAmbiguity?: string;
  askedBy: Participant;
  userAnswer?: ClarificationAnswer;
  status: QuestionStatus;
  createdAt: string;
  answeredAt?: string;
};

export type ClarificationAnswer = {
  answerId: string;
  questionId: string;
  sessionId: string;
  answer: string;
  skipCommand: boolean;
  confidence?: "high" | "medium" | "low";
  createdAt: string;
};

export type Assumption = {
  assumptionId: string;
  sessionId: string;
  relatedQuestionId?: string;
  assumption: string;
  rationale: string;
  addedAt: string;
};

export type CouncilDiscussion = {
  discussionId: string;
  sessionId: string;
  cycleNumber: number;
  participatingPersonas: string[];
  exchangeStarts: string;
  exchangeEnds?: string;
  topic?: string;
  messageTurns: MessageTurn[];
  resolutionSummary?: string;
  status: DebateStatus;
};

export type PersonaSelection = {
  selectionId: string;
  sessionId: string;
  requestClassification: string;
  selectedPersonas: string[];
  reason: string;
  userOverride: boolean;
  overriddenPersonas?: string[];
  createdAt: string;
};

export type SessionState = {
  sessionId: string;
  status: SessionStatus;
  requestText: string;
  clarificationRounds: number;
  debateCycles: number;
  extendedDebateRequested: boolean;
  participants: Participant[];
  messageTurns: MessageTurn[];
  clarificationQuestions: ClarificationQuestion[];
  assumptions: Assumption[];
  discussions: CouncilDiscussion[];
  personaSelection?: PersonaSelection;
  finalAnswer?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
