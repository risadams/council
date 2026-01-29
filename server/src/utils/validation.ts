/**
 * JSON Schema Validation Module
 * 
 * Provides efficient JSON Schema validation using AJV (Another JSON Schema Validator).
 * Features include:
 * - Schema caching for performance
 * - Automatic schema registration
 * - Comprehensive error reporting
 * - Support for custom schema references
 */

import Ajv2020, { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";

// Initialize AJV validator with strict mode and comprehensive error collection
const ajv = new Ajv2020({ allErrors: true, strict: true });

// Cache of compiled validation functions for performance
const cache = new Map<unknown, ValidateFunction>();

// Track registered schema IDs to avoid re-registration
const registeredIds = new Set<string>();

function addSchema(schema: unknown) {
  const id = (schema as any)?.$id as string | undefined;
  if (id && registeredIds.has(id)) return;
  if (id) registeredIds.add(id);
  ajv.addSchema(schema as any);
}

/**
 * Validates data against a JSON schema
 * 
 * Compiles and caches validation functions for performance. Supports additional
 * schema references that are registered before validation.
 * 
 * @param schema - The JSON schema to validate against
 * @param data - The data to validate
 * @param options - Optional configuration including additional schemas to register
 * @returns Object containing validation result and any errors encountered
 */
export function validate(
  schema: unknown,
  data: unknown,
  options?: { schemas?: unknown[] }
): {
  valid: boolean;
  errors: ErrorObject[];
} {
  if (options?.schemas) {
    options.schemas.forEach(addSchema);
  }

  // Check cache first, compile and cache if not found
  let validateFn = cache.get(schema);
  if (!validateFn) {
    try {
      validateFn = ajv.compile(schema as any);
      cache.set(schema, validateFn);
    } catch (err: any) {
      return { valid: false, errors: [{ message: "AJV schema compilation failed", keyword: "compile", instancePath: "", schemaPath: "#", params: {} } as any] };
    }
  }
  const valid = validateFn(data);
  return { valid: Boolean(valid), errors: (validateFn.errors ?? []) as ErrorObject[] };
}


