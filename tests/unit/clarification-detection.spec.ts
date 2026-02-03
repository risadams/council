import { describe, expect, it } from "vitest";
import { detectAmbiguity } from "../../server/src/services/ambiguityDetector.js";

describe("ambiguity detection", () => {
  it("flags short requests as ambiguous", () => {
    const result = detectAmbiguity("Help");
    expect(result.ambiguous).toBe(true);
  });

  it("flags longer explicit questions as clearer", () => {
    const result = detectAmbiguity("How should we design the API for a billing service?");
    expect(result.ambiguous).toBe(false);
  });
});
