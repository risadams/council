import type { Server } from "@modelcontextprotocol/sdk/server";
import { loadSchema } from "../utils/schemaLoader.js";
import { validate } from "../utils/validation.js";
import { toError } from "../utils/errors.js";
import { getPersona, PersonaName } from "../personas/contracts.js";
import { Depth } from "../utils/depth.js";
import { ConsultInput, generateDevilsAdvocateDraft, generatePersonaDraft } from "../personas/generators.js";
import { formatPersonaDraft } from "../utils/personaFormatter.js";
import { withRequest, logRequestComplete } from "../utils/logger.js";

const inputSchema = loadSchema("persona.consult.input.schema.json");
const outputSchema = loadSchema("persona.consult.output.schema.json");

export async function registerPersonaConsult(server: Server) {
  server.registerTool({
    name: "persona.consult",
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
