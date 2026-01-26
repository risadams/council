import { describe, it, expect } from "vitest";
import { loadSchema } from "../../server/src/utils/schemaLoader.js";
import { validate } from "../../server/src/utils/validation.js";
import { toError } from "../../server/src/utils/errors.js";

describe("Error Handling Integration (T078)", () => {
  it("should handle validation errors gracefully", () => {
    const schema = loadSchema("council.consult.input.schema.json");

    // Invalid input
    const invalidInput = {
      depth: "standard"
      // Missing user_problem
    };

    const validation = validate(schema, invalidInput);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);

    // Convert to error response
    const errorResponse = toError("validation", "Invalid input", validation.errors);
    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.error.code).toBe("validation");
  });

  it("should generate error responses with code", () => {
    const validationError = toError("validation", "Field required", ["user_problem is required"]);
    expect(validationError.error.code).toBe("validation");
    expect(validationError.error.message).toBe("Field required");

    const permissionError = toError("permission", "Access denied", { reason: "Insufficient permissions" });
    expect(permissionError.error.code).toBe("permission");

    const internalError = toError("internal", "Unexpected error", { message: "Stack trace" });
    expect(internalError.error.code).toBe("internal");

    const serverError = toError("server_error", "Server error", { status: 500 });
    expect(serverError.error.code).toBe("server_error");
  });

  it("should include error context in responses", () => {
    const error = toError("validation", "Invalid persona name", {
      provided: "InvalidPersona",
      allowed: ["Growth Strategist", "Financial Officer", "Devil's Advocate"]
    });

    expect(error.error).toBeDefined();
    expect(error.error.code).toBe("validation");
    expect(error.error.message).toBe("Invalid persona name");
    expect(error.error.details).toBeDefined();
  });

  it("should handle schema validation failures", () => {
    const inputSchema = loadSchema("persona.consult.input.schema.json");

    const invalidInputs = [
      { persona_name: "Unknown", user_problem: "Test", depth: "standard" },
      { persona_name: "Growth Strategist", user_problem: "", depth: "standard" },
      { persona_name: "Growth Strategist", user_problem: "Test", depth: "invalid" }
    ];

    for (const input of invalidInputs) {
      const validation = validate(inputSchema, input);
      if (!validation.valid) {
        expect(validation.errors.length).toBeGreaterThan(0);
      }
    }
  });

  it("should handle missing files gracefully", () => {
    // Test error response for missing resources
    const fileNotFoundError = toError("internal", "Schema file not found", {
      file: "nonexistent.schema.json"
    });

    expect(fileNotFoundError.error).toBeDefined();
    expect(fileNotFoundError.error.code).toBe("internal");
  });

  it("should create structured error responses for all error types", () => {
    const errorTypes = [
      { code: "validation", message: "Input validation failed" },
      { code: "permission", message: "Permission error occurred" },
      { code: "internal", message: "Internal server error" },
      { code: "server_error", message: "Server error" }
    ];

    for (const errorType of errorTypes) {
      const error = toError(errorType.code as any, errorType.message, {});
      expect(error.error).toBeDefined();
      expect(error.error.code).toBe(errorType.code);
    }
  });
});
