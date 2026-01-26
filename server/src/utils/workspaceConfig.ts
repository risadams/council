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
      throw new Error(`Invalid persona override: ${name}`);
    }
    const keys = Object.keys(override ?? {});
    const invalidKey = keys.find((k) => !["soul", "focus", "constraints"].includes(k));
    if (invalidKey) {
      throw new Error(`Invalid override field for ${name}: ${invalidKey}`);
    }
  }
}

export function readOverrides(): Overrides {
  if (!existsSync(CONFIG_PATH)) return {};
  const text = readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(text);
}

export function writeOverrides(overrides: Overrides) {
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(overrides, null, 2), "utf-8");
}
