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
 */
export type ErrorCode = "validation" | "permission" | "internal" | "server_error";

/**
 * Creates a standard error response object
 * 
 * @param code - Error classification code
 * @param message - Human-readable error message
 * @param details - Optional additional error context or validation details
 * @returns Formatted error response
 */
export function toError(code: ErrorCode, message: string, details?: unknown) {
  return { error: { code, message, details } };
}
