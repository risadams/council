/**
 * Council Consultation Formatting Module
 * 
 * Formats council consultation results into readable markdown output that includes:
 * - Individual persona perspectives with confidence ratings
 * - Synthesis of agreements, conflicts, and risks
 * - Actionable next steps
 * - Detailed assumptions, questions, and reasoning
 */

/**
 * Formatted persona response for output
 * 
 * @property persona - Name of the persona providing advice
 * @property summary - Brief one-line summary of the perspective
 * @property advice - Formatted advice (typically markdown bullets)
 * @property assumptions - Underlying assumptions made by this persona
 * @property questions - Clarifying questions from this perspective
 * @property next_steps - Recommended actions
 * @property confidence - Confidence level (low, medium, high)
 * @property confidence_rationale - Explanation for the confidence rating
 */
export type FormattedResponse = {
  persona: string;
  summary: string;
  advice: string;
  assumptions: string[];
  questions: string[];
  next_steps: string[];
  confidence: string;
  confidence_rationale?: string;
};

/**
 * Synthesized council insights
 * 
 * @property agreements - Points of consensus across personas
 * @property conflicts - Areas where personas diverge significantly
 * @property risks_tradeoffs - Key risks and tradeoff considerations
 * @property next_steps - Combined actionable next steps
 * @property notes - Optional additional notes or caveats
 */
export type Synthesis = {
  agreements: string[];
  conflicts: string[];
  risks_tradeoffs: string[];
  next_steps: string[];
  notes?: string[];
};

/**
 * Formats council consultation results as readable markdown
 * 
 * Produces a structured markdown document with individual persona perspectives
 * followed by synthesized agreements, conflicts, risks, and next steps.
 * 
 * @param responses - Individual persona responses to format
 * @param synthesis - Synthesized insights across all personas
 * @param problem - The original problem statement
 * @returns Formatted markdown string suitable for display or documentation
 */
export function formatCouncilConsultAsMarkdown(
  responses: FormattedResponse[],
  synthesis: Synthesis,
  problem: string
): string {
  let output = `# Clarity Council Consultation\n\n`;
  output += `**Problem:** ${problem}\n\n`;
  output += `---\n\n`;

  // Individual persona responses
  output += `## 👥 Persona Perspectives\n\n`;

  for (const response of responses) {
    output += `### ${response.persona}\n`;
    output += `**Confidence:** ${response.confidence} - ${response.confidence_rationale || "based on provided context"}\n\n`;

    output += `**Summary:** ${response.summary}\n\n`;

    output += `**Advice:**\n`;
    const adviceLines = response.advice.split("\n").filter((line) => line.trim());
    for (const line of adviceLines) {
      output += `- ${line.trim()}\n`;
    }
    output += "\n";

    if (response.assumptions.length > 0) {
      output += `**Assumptions:**\n`;
      for (const assumption of response.assumptions) {
        output += `- ${assumption}\n`;
      }
      output += "\n";
    }

    if (response.questions.length > 0) {
      output += `**Key Questions:**\n`;
      for (const question of response.questions) {
        output += `- ${question}\n`;
      }
      output += "\n";
    }

    if (response.next_steps.length > 0) {
      output += `**Next Steps:**\n`;
      for (const step of response.next_steps) {
        output += `- ${step}\n`;
      }
      output += "\n";
    }

    output += `---\n\n`;
  }

  // Synthesis
  output += `## 🎯 Council Synthesis\n\n`;

  if (synthesis.agreements.length > 0) {
    output += `### ✅ Agreements\n`;
    for (const agreement of synthesis.agreements) {
      output += `- ${agreement}\n`;
    }
    output += "\n";
  }

  if (synthesis.conflicts.length > 0) {
    output += `### ⚠️  Conflicts & Tensions\n`;
    for (const conflict of synthesis.conflicts) {
      output += `- ${conflict}\n`;
    }
    output += "\n";
  }

  if (synthesis.risks_tradeoffs.length > 0) {
    output += `### 🚨 Risks & Tradeoffs\n`;
    for (const risk of synthesis.risks_tradeoffs) {
      output += `- ${risk}\n`;
    }
    output += "\n";
  }

  if (synthesis.next_steps.length > 0) {
    output += `### 📋 Council-Recommended Next Steps\n`;
    for (const step of synthesis.next_steps) {
      output += `- ${step}\n`;
    }
    output += "\n";
  }

  if (synthesis.notes && synthesis.notes.length > 0) {
    output += `### 📝 Notes\n`;
    for (const note of synthesis.notes) {
      output += `- ${note}\n`;
    }
    output += "\n";
  }

  return output;
}
