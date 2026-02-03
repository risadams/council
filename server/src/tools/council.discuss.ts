import { loadSchema } from "../utils/schemaLoader.js";
import { validate } from "../utils/validation.js";
import { toError } from "../utils/errors.js";
import type { ToolRegistrar } from "../utils/mcpAdapter.js";
import { logToolError, logToolStart, logToolSuccess } from "../utils/logger.js";
import type { AppConfig } from "../utils/config.js";
import type { Participant, SessionState } from "../types/session.js";
import { SessionStore } from "../services/sessionStore.js";
import { SessionManager } from "../services/sessionManager.js";
import { detectAmbiguity } from "../services/ambiguityDetector.js";
import {
  createSystemParticipant,
  getNextClarificationQuestion,
  getSkippedQuestions,
  initializeClarifications,
  isSkipCommand,
  recordClarificationAnswer,
  revisitSkippedQuestions
} from "../services/clarificationOrchestrator.js";
import { selectPersonasForRequest } from "../services/personaSelector.js";
import { startDiscussion } from "../services/discussionOrchestrator.js";
import { resolveDebateLimit, hasReachedDebateLimit } from "../services/debateLimiter.js";
import { createAssumption } from "../services/assumptionManager.js";

const defaultInputSchema = loadSchema("council.discuss.input.schema.json");
const defaultOutputSchema = loadSchema("council.discuss.output.schema.json");

const sessionStore = new SessionStore();

/** Optional schema overrides for testing */
type SchemaOverrides = { inputSchema?: unknown; outputSchema?: unknown };

type DiscussToolOptions = {
  config: AppConfig;
  schemas?: SchemaOverrides;
};

function ensureUserParticipant(session: SessionState): Participant {
  const existing = session.participants.find((p) => p.type === "user");
  if (existing) return existing;
  const user = { participantId: "user", type: "user", name: "User" } as Participant;
  session.participants.push(user);
  return user;
}

function buildResponse(
  session: SessionState,
  message: string,
  nextAction?: { actionType: string; prompt?: string },
  nextQuestion?: { questionId: string; question: string; round: number; askedBy: string }
) {
  // Build debate exchanges summary if discussions exist
  let debateExchanges: string | undefined;
  if (session.discussions.length > 0) {
    const exchanges: string[] = [];
    session.discussions.forEach((discussion) => {
      exchanges.push(`\n### Cycle ${discussion.cycleNumber}: ${discussion.topic || "Discussion"}\n`);
      discussion.messageTurns.forEach((turn) => {
        exchanges.push(`**${turn.sender.name}**: ${turn.content}\n`);
      });
      if (discussion.resolutionSummary) {
        exchanges.push(`\n*Resolution*: ${discussion.resolutionSummary}\n`);
      }
    });
    debateExchanges = exchanges.join("\n");
  }

  return {
    sessionId: session.sessionId,
    status: session.status,
    message,
    nextAction,
    nextQuestion,
    debateExchanges,
    currentState: session
  };
}

export async function registerCouncilDiscuss(server: ToolRegistrar, options: DiscussToolOptions) {
  const inputSchema = options.schemas?.inputSchema ?? defaultInputSchema;
  const outputSchema = options.schemas?.outputSchema ?? defaultOutputSchema;
  const sessionManager = new SessionManager(sessionStore, {
    interactiveModeEnabled: options.config.interactiveModeEnabled,
    debateCycleLimit: options.config.debateCycleLimit,
    extendedDebateCycleLimit: options.config.extendedDebateCycleLimit
  });

  server.registerTool({
    name: "council_discuss",
    description: "Interactive council session with clarifications, debate cycles, and consolidated final answer.",
    inputSchema,
    outputSchema,
    handler: async (input: Record<string, unknown>) => {
      const ctx = logToolStart("council.discuss", input);
      try {
        const { valid, errors } = validate(inputSchema, input);
        if (!valid) {
          logToolError(ctx, "council.discuss", "validation", new Error("Invalid input"));
          return toError("validation", "Invalid input", errors);
        }

        const requestText = (input as any).requestText as string | undefined;
        const sessionId = (input as any).sessionId as string | undefined;
        const answerText = (input as any).answer as string | undefined;
        const personasRequested = (input as any).personasRequested as string[] | undefined;
        const extendedDebate = Boolean((input as any).extendedDebate);
        const revisitSkipped = Boolean((input as any).revisitSkipped);
        const interactiveMode = (input as any).interactiveMode !== false && options.config.interactiveModeEnabled;

        let session: SessionState | undefined = sessionId ? sessionManager.getSession(sessionId) : undefined;

        if (!session) {
          if (!requestText) {
            logToolError(ctx, "council.discuss", "validation", new Error("Missing requestText"));
            return toError("validation", "requestText is required when starting a new session");
          }
          session = sessionManager.createSession(requestText, extendedDebate);
        }

        const userParticipant = ensureUserParticipant(session);

        // Handle revisit skipped questions request
        if (revisitSkipped && session.status !== "created") {
          const skippedQuestions = getSkippedQuestions(session);
          if (skippedQuestions.length > 0) {
            session = revisitSkippedQuestions(session);
            const nextQuestion = getNextClarificationQuestion(session);
            const result = buildResponse(
              session,
              `Revisiting ${skippedQuestions.length} skipped question(s)`,
              {
                actionType: "answer_question",
                prompt: nextQuestion?.question
              },
              nextQuestion
                ? {
                    questionId: nextQuestion.questionId,
                    question: nextQuestion.question,
                    round: nextQuestion.roundNumber,
                    askedBy: nextQuestion.askedBy.name
                  }
                : undefined
            );
            logToolSuccess(ctx, "council.discuss", result);
            return result;
          }
        }

        if (!interactiveMode) {
          session.status = "completed";
          session.finalAnswer = `Interactive mode disabled. Request received: ${session.requestText}`;
          const result = buildResponse(session, "Interactive mode disabled; returned direct response", {
            actionType: "none"
          });
          logToolSuccess(ctx, "council.discuss", result);
          return result;
        }

        if (answerText && session.status === "clarifying") {
          const question = getNextClarificationQuestion(session);
          if (!question) {
            session.status = "debating";
          } else {
            const skipCommand = isSkipCommand(answerText);
            const { updatedSession } = recordClarificationAnswer({
              session,
              question,
              answerText,
              skipCommand,
              userParticipant
            });
            session = updatedSession;

            if (skipCommand) {
              const assumption = createAssumption({ sessionId: session.sessionId, question });
              session.assumptions.push(assumption);
            }
          }
        }

        if (session.status === "created") {
          const ambiguity = detectAmbiguity(session.requestText);
          if (ambiguity.ambiguous) {
            session.status = "clarifying";
            const system = createSystemParticipant();
            session.participants.push(system);
            session.clarificationQuestions = initializeClarifications(session, system);
            const nextQuestion = getNextClarificationQuestion(session);
            const result = buildResponse(session, "Clarification required", {
              actionType: "answer_question",
              prompt: nextQuestion?.question
            },
            nextQuestion
              ? {
                  questionId: nextQuestion.questionId,
                  question: nextQuestion.question,
                  round: nextQuestion.roundNumber,
                  askedBy: nextQuestion.askedBy.name
                }
              : undefined);
            logToolSuccess(ctx, "council.discuss", result);
            return result;
          }
          session.status = "debating";
        }

        if (session.status === "clarifying") {
          const nextQuestion = getNextClarificationQuestion(session);
          const prompt = nextQuestion?.question;
          const result = buildResponse(session, "Awaiting clarification response", {
            actionType: "answer_question",
            prompt
          },
          nextQuestion
            ? {
                questionId: nextQuestion.questionId,
                question: nextQuestion.question,
                round: nextQuestion.roundNumber,
                askedBy: nextQuestion.askedBy.name
              }
            : undefined);
          logToolSuccess(ctx, "council.discuss", result);
          return result;
        }

        if (session.status === "debating") {
          const { selected } = selectPersonasForRequest(session.requestText, personasRequested as any);
          const personas: Participant[] = selected.map((name) => ({
            participantId: name,
            type: "persona",
            name
          }));

          const debateLimit = resolveDebateLimit(
            {
              defaultLimit: options.config.debateCycleLimit,
              extendedLimit: options.config.extendedDebateCycleLimit
            },
            session.extendedDebateRequested
          );

          if (hasReachedDebateLimit(session.debateCycles, debateLimit)) {
            session.status = "final";
            session.finalAnswer = "Debate cycle limit reached. Proceeding to final answer.";
          } else {
            const discussion = startDiscussion({
              session,
              personas,
              topic: session.requestText,
              cycleNumber: session.debateCycles + 1
            });
            session = discussion.updatedSession;
            if (hasReachedDebateLimit(session.debateCycles, debateLimit)) {
              session.status = "final";
              session.finalAnswer = "Debate cycle limit reached. Proceeding to final answer.";
            }
          }
        }

        if (session.status === "final" || session.status === "completed") {
          session.status = "completed";
          session.finalAnswer = session.finalAnswer ?? `Final answer for: ${session.requestText}`;
          const result = buildResponse(session, "Final answer ready", {
            actionType: "review_final_answer"
          });
          logToolSuccess(ctx, "council.discuss", result);
          return result;
        }

        const result = buildResponse(session, "Session updated", { actionType: "none" });
        logToolSuccess(ctx, "council.discuss", result);
        return result;
      } catch (err: any) {
        logToolError(ctx, "council.discuss", "internal", err);
        return toError("internal", "Unexpected error", { message: err.message });
      }
    }
  });
}
