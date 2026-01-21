import { pino } from "pino";
import { randomUUID } from "crypto";

export function createLogger() {
  return pino({ level: "info" });
}

export function withRequest(logger = createLogger()) {
  const requestId = randomUUID();
  return { logger: logger.child({ requestId }), requestId };
}
