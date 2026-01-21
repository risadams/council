export type ErrorCode = "validation" | "permission" | "internal";

export function toError(code: ErrorCode, message: string, details?: unknown) {
  return { error: { code, message, details } };
}
