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

export type Synthesis = {
  agreements: string[];
  conflicts: string[];
  risks_tradeoffs: string[];
  next_steps: string[];
  notes?: string[];
};

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
