import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMA_DIR = join(__dirname, "..", "schemas");

export function loadSchema(name: string) {
  const schemaPath = join(SCHEMA_DIR, name);
  const text = readFileSync(schemaPath, "utf-8");
  return JSON.parse(text);
}
