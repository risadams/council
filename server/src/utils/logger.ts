/**
 * Structured Logging Module
 * 
 * Provides application-wide logging using pino with support for multiple formats and levels.
 * Features include:
 * - Structured JSON or text-based logging
 * - Configurable log levels (debug, info, warn, error)
 * - Request context tracking with correlation IDs
 * - Tool execution lifecycle logging
 * - Safe serialization of log values
 */

import { randomUUID } from "crypto";
import { pino, stdTimeFunctions, type Logger as PinoLogger } from "pino";
import type { Writable } from "stream";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogFormat = "json" | "text";

type Loggable = string | number | boolean | Record<string, unknown> | Error | undefined | null;

/**
 * Application logger interface
 * 
 * Provides structured logging with four levels and supports child loggers for context binding.
 */
export type AppLogger = {
  level: LogLevel;
  debug: (arg1?: Loggable, arg2?: Loggable) => void;
  info: (arg1?: Loggable, arg2?: Loggable) => void;
  warn: (arg1?: Loggable, arg2?: Loggable) => void;
  error: (arg1?: Loggable, arg2?: Loggable) => void;
  child: (bindings: Record<string, unknown>) => AppLogger;
};

/**
 * Request execution context
 * 
 * Tracks logging context throughout a request lifecycle including timing,
 * request IDs, and the tool being invoked.
 * 
 * @property logger - Logger instance for this request
 * @property requestId - Unique identifier for this request
 * @property correlationId - ID for correlating related operations
 * @property startTime - Timestamp when request started (ms since epoch)
 * @property tool - Optional name of the tool being executed
 */
export interface RequestContext {
  logger: AppLogger;
  requestId: string;
  correlationId: string;
  startTime: number;
  tool?: string;
}

interface LoggerOptions {
  level?: string;
  format?: string;
  destination?: Writable | number;
  base?: Record<string, unknown>;
}

const DEFAULT_LEVEL: LogLevel = "info";
const DEFAULT_FORMAT: LogFormat = "json";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function normalizeLevel(level?: string): LogLevel {
  const cleaned = (level ?? "").toLowerCase();
  if (cleaned === "debug" || cleaned === "info" || cleaned === "warn" || cleaned === "error") {
    return cleaned;
  }
  return DEFAULT_LEVEL;
}

function normalizeFormat(format?: string): LogFormat {
  const cleaned = (format ?? "").toLowerCase();
  return cleaned === "text" ? "text" : DEFAULT_FORMAT;
}

function safeStringify(value: unknown): string {
  try {
    if (typeof value === "string") return value;
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : String(value);
  } catch (_err) {
    return "[unserializable]";
  }
}

function isSecretKey(key: string): boolean {
  const lowered = key.toLowerCase();
  return (
    lowered.includes("token") ||
    lowered.includes("secret") ||
    lowered.includes("password") ||
    lowered.includes("apiKey") ||
    lowered.includes("apikey") ||
    lowered.includes("auth")
  );
}

function sanitizeMeta(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object") return {};
  const entries = Array.isArray(meta) ? meta.entries() : Object.entries(meta as Record<string, unknown>);
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of entries as Iterable<[string | number, unknown]>) {
    const keyStr = String(key);
    if (value && typeof value === "object") {
      sanitized[keyStr] = sanitizeMeta(value);
    } else if (isSecretKey(keyStr)) {
      sanitized[keyStr] = "[REDACTED]";
    } else if (value instanceof Error) {
      sanitized[keyStr] = {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    } else {
      sanitized[keyStr] = value as unknown;
    }
  }
  return sanitized;
}

function normalizeLogArgs(arg1?: Loggable, arg2?: Loggable): { message: string; meta: Record<string, unknown> } {
  if (typeof arg1 === "string" || typeof arg1 === "number" || typeof arg1 === "boolean") {
    return { message: String(arg1), meta: sanitizeMeta(arg2 as Record<string, unknown>) };
  }
  if (typeof arg2 === "string" || typeof arg2 === "number" || typeof arg2 === "boolean") {
    return { message: String(arg2), meta: sanitizeMeta(arg1 as Record<string, unknown>) };
  }
  return { message: "", meta: sanitizeMeta(arg1 as Record<string, unknown>) };
}

function wrapPino(logger: PinoLogger, level: LogLevel): AppLogger {
  const send = (method: LogLevel) => (arg1?: Loggable, arg2?: Loggable) => {
    const { message, meta } = normalizeLogArgs(arg1, arg2);
    logger[method](meta, message);
  };

  return {
    level,
    debug: send("debug"),
    info: send("info"),
    warn: send("warn"),
    error: send("error"),
    child: (bindings: Record<string, unknown>) => wrapPino(logger.child(bindings), level)
  };
}

function createTextLogger(level: LogLevel, base: Record<string, unknown>, destination?: Writable | number): AppLogger {
  const dest: Writable = typeof destination === "number" ? (process.stdout as unknown as Writable) : destination ?? process.stdout;
  const threshold = LEVEL_ORDER[level];

  const emit = (method: LogLevel, arg1?: Loggable, arg2?: Loggable) => {
    if (LEVEL_ORDER[method] < threshold) return;
    const { message, meta } = normalizeLogArgs(arg1, arg2);
    const payload = { ...base, ...meta, level: method, timestamp: new Date().toISOString() };
    const metaString = Object.keys(payload).length > 0 ? ` | ${safeStringify(payload)}` : "";
    dest.write(`[${payload.timestamp}] ${method.toUpperCase()} ${message || ""}${metaString}\n`);
  };

  const child = (bindings: Record<string, unknown>) =>
    createTextLogger(level, { ...base, ...bindings }, destination ?? dest);

  return {
    level,
    debug: (a?: Loggable, b?: Loggable) => emit("debug", a, b),
    info: (a?: Loggable, b?: Loggable) => emit("info", a, b),
    warn: (a?: Loggable, b?: Loggable) => emit("warn", a, b),
    error: (a?: Loggable, b?: Loggable) => emit("error", a, b),
    child
  };
}

export function createLogger(options: LoggerOptions = {}): AppLogger {
  const level = normalizeLevel(options.level ?? process.env.LOG_LEVEL);
  const format = normalizeFormat(options.format ?? process.env.LOG_FORMAT);
  const base = { service: "clarity-council", ...options.base };

  if (format === "text") {
    return createTextLogger(level, base, options.destination);
  }

  const instance = pino(
    {
      level,
      base,
      timestamp: stdTimeFunctions.isoTime,
      messageKey: "message",
      formatters: {
        level: (label) => ({ level: label })
      }
    },
    options.destination as any
  );

  return wrapPino(instance, level);
}

const rootLogLevel = normalizeLevel(process.env.LOG_LEVEL);
const rootLogFormat = normalizeFormat(process.env.LOG_FORMAT);
const rootLogger = createLogger({ level: rootLogLevel, format: rootLogFormat });

export function getRootLogger(): AppLogger {
  return rootLogger;
}

export function getLogConfig(): { level: LogLevel; format: LogFormat } {
  return { level: rootLogLevel, format: rootLogFormat };
}

export function withRequest(baseLogger: AppLogger = rootLogger, tool?: string): RequestContext {
  const requestId = randomUUID();
  const correlationId = randomUUID();
  const logger = baseLogger.child({ requestId, correlationId, tool });
  return { logger, requestId, correlationId, startTime: Date.now(), tool };
}

export function logRequestComplete(
  ctx: RequestContext,
  tool: string,
  success: boolean,
  errorCategory?: string,
  output?: unknown
) {
  const duration = Date.now() - ctx.startTime;
  const outputChars = typeof output !== "undefined" ? safeStringify(output).length : undefined;
  const payload = {
    event: success ? "tool.success" : "tool.failure",
    tool,
    success,
    duration_ms: duration,
    output_chars: outputChars,
    errorCategory
  };

  if (success) {
    ctx.logger.info(payload, `${tool} completed (${duration}ms)`);
  } else {
    ctx.logger.error(payload, `${tool} failed (${duration}ms)`);
  }
}

export function logToolStart(tool: string, input: unknown, baseLogger: AppLogger = rootLogger): RequestContext {
  const ctx = withRequest(baseLogger, tool);
  const inputChars = safeStringify(input).length;
  ctx.logger.info({ event: "tool.start", tool, input_chars: inputChars }, `${tool} started`);
  return ctx;
}

export function logToolError(
  ctx: RequestContext,
  tool: string,
  errorCategory: string,
  err: unknown
): void {
  const duration = Date.now() - ctx.startTime;
  const errorMeta = err instanceof Error
    ? { name: err.name, message: err.message, stack: err.stack }
    : { message: safeStringify(err) };
  ctx.logger.error(
    {
      event: "tool.failure",
      tool,
      duration_ms: duration,
      errorCategory,
      error: errorMeta
    },
    `${tool} failed (${duration}ms)`
  );
}

export function logToolSuccess(
  ctx: RequestContext,
  tool: string,
  output: unknown
): void {
  const duration = Date.now() - ctx.startTime;
  const outputChars = safeStringify(output).length;
  ctx.logger.info(
    {
      event: "tool.success",
      tool,
      duration_ms: duration,
      output_chars: outputChars
    },
    `${tool} completed (${duration}ms)`
  );
}
