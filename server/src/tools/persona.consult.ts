import type { Server } from "@modelcontextprotocol/sdk";
import { loadSchema } from "../utils/schemaLoader.js";
import { validate } from "../utils/validation.js";
import { toError } from "../utils/errors.js";
import { getPersona, PersonaName } from "../personas/contracts.js";
import { Depth } from "../utils/depth.js";
import { ConsultInput, generateDevilsAdvocateDraft, generatePersonaDraft } from "../personas/generators.js";
import { formatPersonaDraft } from "../utils/personaFormatter.js";

const inputSchema = loadSchema("persona.consult.input.schema.json");
const outputSchema = loadSchema("persona.consult.output.schema.json");

export async function registerPersonaConsult(server: Server) {
  server.registerTool({
    name: "persona.consult",
    description:
      "Consult a single persona returning structured advice, assumptions, questions, next_steps, and confidence.",
    inputSchema,
    outputSchema,
    handler: async (input) => {
      const { valid, errors } = validate(inputSchema, input);
      if (!valid) return toError("validation", "Invalid input", errors);

      const personaName = (input as any).persona_name as PersonaName;
      const persona = getPersona(personaName);
      if (!persona) return toError("validation", "Unknown persona_name", { personaName });

        const depth = ((input as any).depth ?? "standard") as Depth;
        const consultInput: ConsultInput = {
          user_problem: (input as any).user_problem,
          context: (input as any).context,
          desired_outcome: (input as any).desired_outcome,
          constraints: (input as any).constraints,
          depth
        };

        const draft =
          persona.name === "Devil’s Advocate"
            ? generateDevilsAdvocateDraft(consultInput)
            : generatePersonaDraft(persona, consultInput);

        return formatPersonaDraft(draft);
    }
  });
}
