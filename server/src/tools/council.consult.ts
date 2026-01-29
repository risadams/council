/**
 * Council Consult Tool
 * 
 * MCP tool that orchestrates consultation with multiple personas and produces a synthesis.
 * Integrates persona selection, draft generation, and synthesis formatting to provide
 * comprehensive advice considering multiple perspectives.
 * 
 * The tool:
 * 1. Validates input against schema
 * 2. Selects relevant personas (or uses all if none specified)
 * 3. Generates individual persona drafts
 * 4. Optionally includes Devil's Advocate perspective for risk assessment
 * 5. Synthesizes responses into agreements, conflicts, and risks
 * 6. Formats output as markdown for readability
 */

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
import { logToolError, logToolStart, logToolSuccess } from "../utils/logger.js";
import { formatCouncilConsultAsMarkdown } from "../utils/councilFormatter.js";
import type { ToolRegistrar } from "../utils/mcpAdapter.js";

const defaultInputSchema = loadSchema("council.consult.input.schema.json");
const defaultOutputSchema = loadSchema("council.consult.output.schema.json");

/** Optional schema overrides for testing */
type SchemaOverrides = { inputSchema?: unknown; outputSchema?: unknown };

/**
 * Registers the council.consult tool with the MCP server
 * 
 * @param server - The MCP tool registrar to register this tool with
 * @param schemas - Optional schema overrides for testing purposes
 */
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
      const ctx = logToolStart("council.consult", input);
      try {
        const { valid, errors } = validate(inputSchema, input);
        if (!valid) {
          logToolError(ctx, "council.consult", "validation", new Error("Invalid input"));
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
        ctx.logger.debug(
          { event: "council.personas_selected", count: active.length, personas: active.map((p) => p.name) },
          `Selected ${active.length} personas for consultation`
        );

        const drafts = active.map((persona) =>
          (persona.name as string) === "Devil's Advocate"
            ? generateDevilsAdvocateDraft(consultInput)
            : generatePersonaDraft(persona, consultInput)
        );

        const responses = drafts.map(formatPersonaDraft);
        const synthesis = buildSynthesis(responses, depth, consultInput);

        // Return both structured data and formatted markdown for better display
        const markdown = formatCouncilConsultAsMarkdown(
          responses,
          synthesis,
          (input as any).user_problem
        );
        const result = {
          responses,
          synthesis,
          formatted: markdown
        };
        logToolSuccess(ctx, "council.consult", result);
        return result;
      } catch (err: any) {
        logToolError(ctx, "council.consult", "internal", err);
        return toError("internal", "Unexpected error", { message: err.message });
      }
    }
  });
}
