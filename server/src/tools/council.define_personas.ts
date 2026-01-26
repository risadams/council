import { loadSchema } from "../utils/schemaLoader.js";
import { validate } from "../utils/validation.js";
import { toError } from "../utils/errors.js";
import { PERSONA_CONTRACTS, PersonaContract } from "../personas/contracts.js";
import { readOverrides, writeOverrides, Overrides, validateOverrides } from "../utils/workspaceConfig.js";
import { logToolError, logToolStart, logToolSuccess } from "../utils/logger.js";
import type { ToolRegistrar } from "../utils/mcpAdapter.js";

const defaultInputSchema = loadSchema("council.define_personas.input.schema.json");
const defaultOutputSchema = loadSchema("council.define_personas.output.schema.json");

type SchemaOverrides = { inputSchema?: unknown; outputSchema?: unknown };

export async function registerDefinePersonas(server: ToolRegistrar, schemas?: SchemaOverrides) {
  const inputSchema = schemas?.inputSchema ?? defaultInputSchema;
  const outputSchema = schemas?.outputSchema ?? defaultOutputSchema;
  server.registerTool({
    name: "council_define_personas",
    description:
      "Return current persona contracts and apply validated workspace-level overrides.",
    inputSchema,
    outputSchema,
    handler: async (input: Record<string, unknown> | undefined) => {
      const ctx = logToolStart("council.define_personas", input ?? {});
      try {
        const { valid, errors } = validate(inputSchema, input ?? {});
        if (!valid) {
          logToolError(ctx, "council.define_personas", "validation", new Error("Invalid input"));
          return toError("validation", "Invalid input", errors);
        }

        const incomingOverrides = ((input as any).overrides ?? {}) as Overrides;
        const existingOverrides = readOverrides();
        const mergedOverrides = { ...existingOverrides, ...incomingOverrides };

        try {
          validateOverrides(mergedOverrides, PERSONA_CONTRACTS.map((p) => p.name));
        } catch (err: any) {
          logToolError(ctx, "council.define_personas", "validation", err);
          return toError("validation", err.message ?? "Invalid overrides");
        }

        // Apply overrides onto base contracts (only allowed fields)
        const personas: PersonaContract[] = PERSONA_CONTRACTS.map((base) => {
          const o = mergedOverrides[base.name] ?? {};
          const focus = o.focus ?? base.focus;
          const constraints = o.constraints ?? base.constraints;
          const soul = o.soul ?? base.soul;
          return { ...base, focus, constraints, soul };
        });

        // Persist new overrides if provided
        if (Object.keys(incomingOverrides).length > 0) {
          writeOverrides(mergedOverrides);
        }

        const result = { personas };
        logToolSuccess(ctx, "council.define_personas", result);
        return result;
      } catch (err: any) {
        logToolError(ctx, "council.define_personas", "internal", err);
        return toError("internal", "Unexpected error", { message: err.message });
      }
    }
  });
}
