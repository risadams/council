import { Depth } from "./depth.js";

export function computeConfidence(depth: Depth): { level: "low" | "medium" | "high"; rationale: string } {
  if (depth === "deep") {
    return { level: "high", rationale: "Depth set to deep; more evidence provided." };
  }
  if (depth === "standard") {
    return { level: "medium", rationale: "Standard depth with balanced evidence." };
  }
  return { level: "low", rationale: "Brief depth; limited evidence included." };
}
