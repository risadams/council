/**
 * Error Handling Module
 * 
 * Provides standard error types and formatting for consistent error responses
 * across the MCP tools and utilities.
 */

/**
 * Supported error codes
 * 
 * @property validation - Input validation failed (bad schema, invalid values)
 * @property permission - User lacks required permissions
 * @property internal - Internal processing error (bugs, exceptions)
 * @property server_error - Server-side error (infrastructure, dependencies)
 * @property session_not_found - Session does not exist or has expired
 * @property debate_limit_reached - Maximum debate cycles reached
 * @property clarification_required - User must answer clarification questions
 */
export type ErrorCode = "validation" | "permission" | "internal" | "server_error" | "session_not_found" | "debate_limit_reached" | "clarification_required";

/**
 * User-friendly error message mapping
 */
const ERROR_MESSAGE_MAP: Record<ErrorCode, string> = {
  validation: "The provided input is invalid. Please check your request parameters.",
  permission: "You don't have permission to perform this action.",
  internal: "An unexpected error occurred. Please try again.",
  server_error: "The server encountered an error. Please try again later.",
  session_not_found: "Session not found or has expired. Please start a new session.",
  debate_limit_reached: "Maximum debate cycles reached. Proceeding to final answer.",
  clarification_required: "Please answer the clarification questions before proceeding."
};

/**
 * Creates a standard error response object
 * 
 * @param code - Error classification code
 * @param message - Human-readable error message (optional, uses default if not provided)
 * @param details - Optional additional error context or validation details
 * @returns Formatted error response
 */
export function toError(code: ErrorCode, message?: string, details?: unknown) {
  const errorMessage = message || ERROR_MESSAGE_MAP[code];
  return { error: { code, message: errorMessage, details } };
}

/**
 * Creates a user-friendly error from a caught exception
 * 
 * @param err - The caught error
 * @param context - Optional context about where/why the error occurred
 * @returns Formatted error response
 */
export function fromException(err: unknown, context?: string): ReturnType<typeof toError> {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const details = context ? { context, originalError: errorMessage } : { originalError: errorMessage };
  return toError("internal", ERROR_MESSAGE_MAP.internal, details);
}

/**
 * Validation error with specific field details
 * 
 * @param message - Error message
 * @param fieldErrors - Map of field names to error messages
 * @returns Formatted validation error
 */
export function validationError(message: string, fieldErrors?: Record<string, string>) {
  return toError("validation", message, fieldErrors);
}
