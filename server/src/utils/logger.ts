import { pino } from "pino";
import { randomUUID } from "crypto";

export function createLogger() {
  return pino({ level: "info" });
}

export interface RequestContext {
  logger: ReturnType<typeof pino>;
  requestId: string;
  startTime: number;
}

export function withRequest(logger = createLogger()): RequestContext {
  const requestId = randomUUID();
  const startTime = Date.now();
  return { logger: logger.child({ requestId }), requestId, startTime };
}

export function logRequestComplete(
  ctx: RequestContext,
  tool: string,
  success: boolean,
  errorCategory?: string
) {
  const duration = Date.now() - ctx.startTime;
  ctx.logger.info(
    {
      tool,
      success,
      duration,
      errorCategory,
      timestamp: new Date().toISOString(),
    },
    `${tool} ${success ? "completed" : "failed"} (${duration}ms)`
  );
}
