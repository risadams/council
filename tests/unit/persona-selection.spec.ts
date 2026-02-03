import { describe, it, expect } from "vitest";
import { selectPersonasForRequest } from "../../server/src/services/personaSelector.js";
import type { PersonaName } from "../../server/src/personas/contracts.js";

describe("PersonaSelector - keyword-based filtering", () => {
  it("should select Security Expert for security-related request", () => {
    const result = selectPersonasForRequest("How do I handle security vulnerabilities?");
    expect(result.selected).toContain("Security Expert");
    expect(result.userOverride).toBe(false);
  });

  it("should select DevOps Engineer for deployment-related request", () => {
    const result = selectPersonasForRequest("How do I set up kubernetes deployment?");
    expect(result.selected).toContain("DevOps Engineer");
    expect(result.userOverride).toBe(false);
  });

  it("should select Senior Architect for architecture request", () => {
    const result = selectPersonasForRequest("What's the best system architecture for scalability?");
    expect(result.selected).toContain("Senior Architect");
    expect(result.userOverride).toBe(false);
  });

  it("should select multiple personas when keywords overlap", () => {
    const result = selectPersonasForRequest("How do I ensure security in my DevOps pipeline?");
    expect(result.selected).toContain("Security Expert");
    expect(result.selected).toContain("DevOps Engineer");
    expect(result.userOverride).toBe(false);
  });

  it("should use defaults for generic requests", () => {
    const result = selectPersonasForRequest("How do I approach this problem?");
    expect(result.selected).toEqual(expect.arrayContaining(["Senior Developer", "Senior Architect", "Product Owner"]));
    expect(result.userOverride).toBe(false);
    expect(result.reason).toContain("defaults");
  });

  it("should honor user-requested personas", () => {
    const requestedPersonas: PersonaName[] = ["Security Expert", "QA Engineer"];
    const result = selectPersonasForRequest("generic question", requestedPersonas);
    expect(result.selected).toEqual(requestedPersonas);
    expect(result.userOverride).toBe(true);
    expect(result.reason).toContain("User requested");
  });

  it("should filter out invalid personas", () => {
    const result = selectPersonasForRequest("testing request");
    expect(result.selected).toContain("QA Engineer");
    expect(result.selected.every((p) => typeof p === "string")).toBe(true);
  });

  it("should handle empty request text gracefully", () => {
    const result = selectPersonasForRequest("");
    expect(result.selected.length).toBeGreaterThan(0);
    expect(result.userOverride).toBe(false);
  });

  it("should select Performance Engineer for optimization request", () => {
    const result = selectPersonasForRequest("How can I improve the performance of my API?");
    expect(result.selected).toContain("Senior Developer");
    expect(result.userOverride).toBe(false);
  });

  it("should select Product Owner for business-related request", () => {
    const result = selectPersonasForRequest("What should our product roadmap prioritize?");
    expect(result.selected).toContain("Product Owner");
    expect(result.userOverride).toBe(false);
  });
});
