import Ajv2020, { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";

const ajv = new Ajv2020({ allErrors: true, strict: true });
const cache = new Map<unknown, ValidateFunction>();
const registeredIds = new Set<string>();

function addSchema(schema: unknown) {
  const id = (schema as any)?.$id as string | undefined;
  if (id && registeredIds.has(id)) return;
  if (id) registeredIds.add(id);
  ajv.addSchema(schema as any);
}

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

  let validateFn = cache.get(schema);
  if (!validateFn) {
    try {
      validateFn = ajv.compile(schema as any);
      cache.set(schema, validateFn);
    } catch (err: any) {
      return { valid: false, errors: [{ message: `Schema compilation failed: ${err.message}` }] };
    }
  }
  const valid = validateFn(data);
  return { valid: Boolean(valid), errors: (validateFn.errors ?? []) as ErrorObject[] };
}
