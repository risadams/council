import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { normalizePath } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    include: [normalizePath(resolve(__dirname, "../tests/**/*.spec.ts"))],
    globals: true,
    environment: "node"
  }
});
