import { describe, expect, it } from "vitest";
import { Writable } from "stream";
import { createLogger, logToolError, logToolStart, logToolSuccess } from "../../server/src/utils/logger.js";

class MemoryStream extends Writable {
  chunks: string[] = [];

  _write(chunk: Buffer | string, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.chunks.push(chunk.toString());
    callback();
  }
}

function parseJsonLines(stream: MemoryStream) {
  return stream.chunks
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));
}

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("structured logger", () => {
  it("emits structured JSON logs with correlation ids", async () => {
    const stream = new MemoryStream();
    const logger = createLogger({ level: "debug", format: "json", destination: stream });

    const ctx = logToolStart("test-tool", { input: "abc" }, logger);
    logToolSuccess(ctx, "test-tool", { ok: true });
    await flush();

    const entries = parseJsonLines(stream);
    expect(entries.length).toBe(2);
    const [startLog, successLog] = entries;

    expect(startLog.event).toBe("tool.start");
    expect(successLog.event).toBe("tool.success");
    expect(startLog.correlationId).toBeDefined();
    expect(successLog.correlationId).toBe(startLog.correlationId);
    expect(typeof successLog.duration_ms).toBe("number");
  });

  it("respects log level filtering", async () => {
    const stream = new MemoryStream();
    const logger = createLogger({ level: "warn", format: "json", destination: stream });

    logger.info({ event: "info" }, "info message");
    logger.warn({ event: "warn" }, "warn message");
    await flush();

    const entries = parseJsonLines(stream);
    expect(entries.some((e) => e.event === "info")).toBe(false);
    expect(entries.some((e) => e.event === "warn")).toBe(true);
  });

  it("supports text format output", async () => {
    const stream = new MemoryStream();
    const logger = createLogger({ level: "info", format: "text", destination: stream });

    logger.info({ event: "text-test", meta: { safe: true } }, "hello world");
    await flush();

    const line = stream.chunks.join("\n");
    expect(line).toContain("INFO");
    expect(line.toLowerCase()).toContain("text-test");
    expect(line).toContain("hello world");
  });

  it("redacts secrets from metadata", async () => {
    const stream = new MemoryStream();
    const logger = createLogger({ level: "info", format: "json", destination: stream });

    logger.info({ authToken: "super-secret", nested: { password: "p@ss" } }, "secret test");
    await flush();

    const [entry] = parseJsonLines(stream);
    expect(entry.authToken).toBe("[REDACTED]");
    expect(entry.nested.password).toBe("[REDACTED]");
  });

  it("logs errors with metadata", async () => {
    const stream = new MemoryStream();
    const logger = createLogger({ level: "debug", format: "json", destination: stream });
    const err = new Error("boom");

    const ctx = logToolStart("test-tool", { foo: "bar" }, logger);
    logToolError(ctx, "test-tool", "internal", err);
    await flush();

    const entries = parseJsonLines(stream);
    const errorLog = entries.find((e) => e.event === "tool.failure");
    expect(errorLog).toBeDefined();
    expect(errorLog?.errorCategory).toBe("internal");
    expect(errorLog?.error?.message).toBe("boom");
    expect(errorLog?.tool).toBe("test-tool");
  });
});
