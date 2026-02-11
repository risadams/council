import { PersonaName, PERSONA_CONTRACTS } from "../personas/contracts.js";

const KEYWORD_MAP: Array<{ keyword: RegExp; personas: PersonaName[] }> = [
  { keyword: /security|compliance|threat|vulnerability/i, personas: ["Security Expert"] },
  { keyword: /devops|deployment|kubernetes|docker|ci\/cd|pipeline|observability/i, personas: ["DevOps Engineer"] },
  { keyword: /architecture|design|system|scalability/i, personas: ["Senior Architect"] },
  { keyword: /performance|latency|throughput|optimization/i, personas: ["Senior Developer"] },
  { keyword: /product|roadmap|stakeholder|business value/i, personas: ["Product Owner"] },
  { keyword: /testing|qa|quality|regression/i, personas: ["QA Engineer"] }
];

const DEFAULT_PERSONAS: PersonaName[] = ["Senior Developer", "Senior Architect", "Product Owner"];

export function selectPersonasForRequest(
  requestText: string,
  personasRequested?: PersonaName[]
): { selected: PersonaName[]; reason: string; userOverride: boolean } {
  if (personasRequested && personasRequested.length > 0) {
    return {
      selected: personasRequested,
      reason: "User requested specific personas by name",
      userOverride: true
    };
  }

  const selected = new Set<PersonaName>();
  KEYWORD_MAP.forEach((entry) => {
    if (entry.keyword.test(requestText)) {
      entry.personas.forEach((persona) => selected.add(persona));
    }
  });

  const usedDefaults = selected.size === 0;
  if (usedDefaults) {
    DEFAULT_PERSONAS.forEach((persona) => selected.add(persona));
  }

  const filtered = Array.from(selected).filter((persona) =>
    PERSONA_CONTRACTS.some((contract) => contract.name === persona)
  );

  return {
    selected: filtered,
    reason: usedDefaults ? "Using defaults" : "Matched personas to request keywords",
    userOverride: false
  };
}
