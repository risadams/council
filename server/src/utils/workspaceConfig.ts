import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export type PersonaOverride = {
  soul?: string;
  focus?: string[];
  constraints?: string[];
};

export type Overrides = Record<string, PersonaOverride>;

const CONFIG_PATH = join(process.cwd(), ".council", "personas.json");

export function validateOverrides(overrides: Overrides, allowedPersonas: string[]) {
  const allowed = new Set(allowedPersonas);
  for (const [name, override] of Object.entries(overrides)) {
    if (!allowed.has(name)) {
      throw new Error(Invalid persona override: );
    }
    const keys = Object.keys(override ?? {});
    const invalidKey = keys.find((k) => !["soul", "focus", "constraints"].includes(k));
    if (invalidKey) {
      throw new Error(Invalid override field for : );
    }
  }
}

export function readOverrides(): Overrides {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    const text = readFileSync(CONFIG_PATH, "utf-8");
    const overrides = JSON.parse(text);
    // Validate persona names against allowed personas
    const allowedPersonas = ["Growth Strategist", "Financial Officer", "Devil's Advocate", "Ops Architect", "Customer Advocate", "Culture Lead"];
    for (const personaName of Object.keys(overrides)) {
      if (!allowedPersonas.includes(personaName)) {
        throw new Error(Invalid persona name in overrides: "". Allowed personas: );
      }
    }
    return overrides;
  } catch (err: any) {
    throw new Error(Failed to read workspace persona overrides: );
  }
}

export function writeOverrides(overrides: Overrides) {
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const text = JSON.stringify(overrides, null, 2);
  writeFileSync(CONFIG_PATH, text, "utf-8");
}
