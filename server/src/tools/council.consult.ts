import { loadSchema } from "../utils/schemaLoader.js";
import { validate } from "../utils/validation.js";
import { toError } from "../utils/errors.js";
import { PersonaName } from "../personas/contracts.js";
import {
  ConsultInput,
  generateDevilsAdvocateDraft,
  generatePersonaDraft,
  selectPersonas
} from "../personas/generators.js";
import { formatPersonaDraft } from "../utils/personaFormatter.js";
import { buildSynthesis } from "../utils/synthesis.js";
import { Depth } from "../utils/depth.js";
import { withRequest, logRequestComplete } from "../utils/logger.js";
import type { ToolRegistrar } from "../utils/mcpAdapter.js";

const defaultInputSchema = loadSchema("council.consult.input.schema.json");
const defaultOutputSchema = loadSchema("council.consult.output.schema.json");

type SchemaOverrides = { inputSchema?: unknown; outputSchema?: unknown };

export async function registerCouncilConsult(server: ToolRegistrar, schemas?: SchemaOverrides) {
  const inputSchema = schemas?.inputSchema ?? defaultInputSchema;
  const outputSchema = schemas?.outputSchema ?? defaultOutputSchema;
  server.registerTool({
    name: "council_consult",
    description:
      "Consult multiple personas and produce a synthesis (agreements, conflicts, risks/tradeoffs, next_steps).",
    inputSchema,
    outputSchema,
    handler: async (input: Record<string, unknown>) => {
      const ctx = withRequest();
      try {
        const { valid, errors } = validate(inputSchema, input);
        if (!valid) {
          logRequestComplete(ctx, "council.consult", false, "validation");
          return toError("validation", "Invalid input", errors);
        }

        const depth = ((input as any).depth ?? "standard") as Depth;
        const selected = (input as any).selected_personas as PersonaName[] | undefined;
        const consultInput: ConsultInput = {
          user_problem: (input as any).user_problem,
          context: (input as any).context,
          desired_outcome: (input as any).desired_outcome,
          constraints: (input as any).constraints,
          depth
        };

        const active = selectPersonas(selected);
        const drafts = active.map((persona) =>
          (persona.name as string) === "Devil's Advocate"
            ? generateDevilsAdvocateDraft(consultInput)
            : generatePersonaDraft(persona, consultInput)
        );

        const responses = drafts.map(formatPersonaDraft);
        const synthesis = buildSynthesis(responses, depth, consultInput);

        logRequestComplete(ctx, "council.consult", true);
        return { responses, synthesis };
      } catch (err: any) {
        logRequestComplete(ctx, "council.consult", false, "internal");
        return toError("internal", "Unexpected error", { message: err.message });
      }
    }
  });
}
