import { randomUUID } from "crypto";
import type { CouncilDiscussion } from "../types/session.js";

export function createCouncilDiscussion(options: {
  sessionId: string;
  cycleNumber: number;
  participatingPersonas: string[];
  topic?: string;
}): CouncilDiscussion {
  return {
    discussionId: randomUUID(),
    sessionId: options.sessionId,
    cycleNumber: options.cycleNumber,
    participatingPersonas: options.participatingPersonas,
    exchangeStarts: new Date().toISOString(),
    messageTurns: [],
    topic: options.topic,
    status: "in_progress"
  };
}
