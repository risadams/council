/**
 * Persona Consult Tool
 * 
 * MCP tool that provides consultation from a single specified persona.
 * Returns structured advice, assumptions, questions, and next steps from that persona's perspective.
 * 
 * The tool:
 * 1. Validates input and persona name
 * 2. Loads the requested persona contract
 * 3. Generates persona-specific draft with context-aware advice
 * 4. Formats output with confidence assessment
 */

import { loadSchema } from "../utils/schemaLoader.js";
import { validate } from "../utils/validation.js";
import { toError } from "../utils/errors.js";
import { getPersona, PersonaName } from "../personas/contracts.js";
import { Depth } from "../utils/depth.js";
import { ConsultInput, generateDevilsAdvocateDraft, generatePersonaDraft } from "../personas/generators.js";
import { formatPersonaDraft } from "../utils/personaFormatter.js";
import { logToolError, logToolStart, logToolSuccess } from "../utils/logger.js";
import type { ToolRegistrar } from "../utils/mcpAdapter.js";

const defaultInputSchema = loadSchema("persona.consult.input.schema.json");
const defaultOutputSchema = loadSchema("persona.consult.output.schema.json");

/** Optional schema overrides for testing */
type SchemaOverrides = { inputSchema?: unknown; outputSchema?: unknown };

/**
 * Registers the persona.consult tool with the MCP server
 * 
 * Special handling for Devil's Advocate: uses specialized draft generation
 * that focuses on risk analysis and assumption stress-testing.
 * 
 * @param server - The MCP tool registrar to register this tool with
 * @param schemas - Optional schema overrides for testing purposes
 */
export async function registerPersonaConsult(server: ToolRegistrar, schemas?: SchemaOverrides) {
  const inputSchema = schemas?.inputSchema ?? defaultInputSchema;
  const outputSchema = schemas?.outputSchema ?? defaultOutputSchema;
  server.registerTool({
    name: "persona_consult",
    description:
      "Consult a single persona returning structured advice, assumptions, questions, next_steps, and confidence.",
    inputSchema,
    outputSchema,
    handler: async (input: Record<string, unknown>) => {
      const ctx = logToolStart("persona.consult", input);
      try {
        const { valid, errors } = validate(inputSchema, input);
        if (!valid) {
          logToolError(ctx, "persona.consult", "validation", new Error("Invalid input"));
          return toError("validation", "Invalid input", errors);
        }

        const personaName = (input as any).persona_name as PersonaName;
        const persona = getPersona(personaName);
        if (!persona) {
          logToolError(ctx, "persona.consult", "validation", new Error("Unknown persona_name"));
          return toError("validation", "Unknown persona_name", { personaName });
        }

        const depth = ((input as any).depth ?? "standard") as Depth;
        const consultInput: ConsultInput = {
          user_problem: (input as any).user_problem,
          context: (input as any).context,
          desired_outcome: (input as any).desired_outcome,
          constraints: (input as any).constraints,
          depth
        };

        const draft =
          (persona.name as string) === "Devil's Advocate"
            ? generateDevilsAdvocateDraft(consultInput)
            : generatePersonaDraft(persona, consultInput);

        const result = formatPersonaDraft(draft);
        logToolSuccess(ctx, "persona.consult", result);
        return result;
      } catch (err: any) {
        logToolError(ctx, "persona.consult", "internal", err);
        return toError("internal", "Unexpected error", { message: err.message });
      }
    }
  });
}
