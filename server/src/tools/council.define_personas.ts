import type { Server } from "@modelcontextprotocol/sdk";
import { loadSchema } from "../utils/schemaLoader.js";
import { validate } from "../utils/validation.js";
import { toError } from "../utils/errors.js";
import { PERSONA_CONTRACTS, PersonaContract } from "../personas/contracts.js";
import { readOverrides, writeOverrides, Overrides } from "../utils/workspaceConfig.js";

const inputSchema = loadSchema("council.define_personas.input.schema.json");
const outputSchema = loadSchema("council.define_personas.output.schema.json");

export async function registerDefinePersonas(server: Server) {
  server.registerTool({
    name: "council.define_personas",
    description:
      "Return current persona contracts and apply validated workspace-level overrides.",
    inputSchema,
    outputSchema,
    handler: async (input) => {
      const { valid, errors } = validate(inputSchema, input ?? {});
      if (!valid) return toError("validation", "Invalid input", errors);

      const overrides = ((input as any).overrides ?? {}) as Overrides;

      // Apply overrides onto base contracts (only allowed fields)
      const merged: PersonaContract[] = PERSONA_CONTRACTS.map((base) => {
        const o = overrides[base.name] ?? {};
        const focus = o.focus ?? base.focus;
        const constraints = o.constraints ?? base.constraints;
        const soul = o.soul ?? base.soul;
        return { ...base, focus, constraints, soul };
      });

      // Persist overrides
      if (Object.keys(overrides).length > 0) {
        writeOverrides(overrides);
      }

      return { personas: merged };
    }
  });
}
