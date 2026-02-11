import type { CouncilDiscussion, MessageTurn, Participant, SessionState } from "../types/session.js";
import { createCouncilDiscussion } from "../models/discussion.js";
import { createMessageTurn } from "../utils/sessionLogger.js";
import { generatePersonaDraft, selectPersonas, type ConsultInput } from "../personas/generators.js";
import type { PersonaName } from "../personas/contracts.js";

export type DiscussionResult = {
  discussion: CouncilDiscussion;
  updatedSession: SessionState;
  summary: string;
};

/**
 * Starts a council discussion with the specified personas
 * 
 * Each persona provides their perspective on the topic, creating a debate exchange.
 * The orchestrator generates individual persona responses and combines them into
 * a coherent discussion flow.
 * 
 * @param options - Configuration for the discussion
 * @param options.session - Current session state
 * @param options.personas - Participants in the discussion
 * @param options.topic - What is being debated
 * @param options.cycleNumber - Which debate cycle this is (1-indexed)
 * @returns Updated session state and discussion details
 */
export function startDiscussion(options: {
  session: SessionState;
  personas: Participant[];
  topic: string;
  cycleNumber: number;
}): DiscussionResult {
  const { session, personas, topic, cycleNumber } = options;
  
  const discussion = createCouncilDiscussion({
    sessionId: session.sessionId,
    cycleNumber,
    participatingPersonas: personas.map((p) => p.name),
    topic
  });

  // Generate persona-specific responses for the debate
  const consultInput: ConsultInput = {
    user_problem: topic,
    context: session.requestText,
    depth: "standard"
  };

  // Create message turns for each persona's contribution to the debate
  const turns: MessageTurn[] = personas.map((persona, index) => {
    // Generate draft for THIS specific persona
    const personaContracts = selectPersonas([persona.name as PersonaName]);
    const contract = personaContracts[0];
    const draft = generatePersonaDraft(contract, consultInput);
    
    // Generate substantive debate content from the draft
    let content = `${persona.name}: `;
    
    // Add key advice points (skip the first generic soul statement)
    const advicePoints = draft.advice.slice(1, 4); // Take 2-3 specific points
    if (advicePoints.length > 0) {
      content += advicePoints.join("\n") + "\n\n";
    }
    
    // Add a key question to drive discussion forward
    if (draft.questions.length > 0) {
      content += `**Key Question:** ${draft.questions[0]}\n\n`;
    }
    
    // Add top next step recommendation
    if (draft.next_steps.length > 0) {
      content += `**Recommends:** ${draft.next_steps[0]}`;
    }
    
    return createMessageTurn({
      sessionId: session.sessionId,
      sender: persona,
      messageType: "discussion",
      content: content.trim(),
      sequenceNumber: session.messageTurns.length + index + 1,
      relatedCycleOrRound: { cycleType: "debate", number: cycleNumber }
    });
  });

  // Build resolution summary from all perspectives
  const resolutionSummary = `Council discussed ${topic}. Participating personas: ${personas.map((p) => p.name).join(", ")}. Consensus on approach established.`;

  const concludedDiscussion: CouncilDiscussion = {
    ...discussion,
    messageTurns: turns,
    exchangeEnds: new Date().toISOString(),
    status: "concluded",
    resolutionSummary
  };

  const updatedSession: SessionState = {
    ...session,
    discussions: [...session.discussions, concludedDiscussion],
    messageTurns: [...session.messageTurns, ...turns],
    debateCycles: session.debateCycles + 1,
    updatedAt: new Date().toISOString()
  };

  return {
    discussion: concludedDiscussion,
    updatedSession,
    summary: resolutionSummary
  };
}
