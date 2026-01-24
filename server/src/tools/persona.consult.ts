import { loadSchema } from "../utils/schemaLoader.js";
import { validate } from "../utils/validation.js";
import { toError } from "../utils/errors.js";
import { getPersona, PersonaName } from "../personas/contracts.js";
import { Depth } from "../utils/depth.js";
import { ConsultInput, generateDevilsAdvocateDraft, generatePersonaDraft } from "../personas/generators.js";
import { formatPersonaDraft } from "../utils/personaFormatter.js";
import { withRequest, logRequestComplete } from "../utils/logger.js";
import type { ToolRegistrar } from "../utils/mcpAdapter.js";

const defaultInputSchema = loadSchema("persona.consult.input.schema.json");
const defaultOutputSchema = loadSchema("persona.consult.output.schema.json");

type SchemaOverrides = { inputSchema?: unknown; outputSchema?: unknown };

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
      const ctx = withRequest();
      try {
        const { valid, errors } = validate(inputSchema, input);
        if (!valid) {
          logRequestComplete(ctx, "persona.consult", false, "validation");
          return toError("validation", "Invalid input", errors);
        }

        const personaName = (input as any).persona_name as PersonaName;
        const persona = getPersona(personaName);
        if (!persona) {
          logRequestComplete(ctx, "persona.consult", false, "validation");
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

        logRequestComplete(ctx, "persona.consult", true);
        return formatPersonaDraft(draft);
      } catch (err: any) {
        logRequestComplete(ctx, "persona.consult", false, "internal");
        return toError("internal", "Unexpected error", { message: err.message });
      }
    }
  });
}
