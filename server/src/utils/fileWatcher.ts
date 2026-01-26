import path from "path";
import { PersonaOverrides } from "../types/docker.js";
import { getRootLogger } from "./logger.js";

const EMPTY_OVERRIDES: PersonaOverrides = {
  version: "1.0",
  lastModified: new Date(0).toISOString(),
  overrides: {}
};

/**
 * Stub persona configuration watcher. Real implementation will watch
 * `personas.overrides.json` for changes and apply them live.
 */
export class PersonaConfigWatcher {
  private readonly logger = getRootLogger().child({ component: "personaWatcher" });

  constructor(
    private readonly workspaceDir: string,
    private readonly onUpdate: (overrides: PersonaOverrides) => void = () => {}
  ) {}

  loadPersonaOverrides(): PersonaOverrides {
    this.logger.info({ event: "persona_overrides.stub", workspaceDir: this.workspaceDir }, "Persona overrides loader not yet implemented");
    return { ...EMPTY_OVERRIDES, lastModified: new Date().toISOString() };
  }

  watchForChanges(): void {
    const overridesPath = path.join(this.workspaceDir, "personas.overrides.json");
    this.logger.warn({ event: "persona_watcher.stub", overridesPath }, "File watcher not yet implemented");
  }

  applyOverrides(overrides: PersonaOverrides): void {
    this.logger.info({ event: "persona_overrides.apply.stub", count: Object.keys(overrides.overrides).length }, "Apply overrides not yet implemented");
    this.onUpdate(overrides);
  }
}
