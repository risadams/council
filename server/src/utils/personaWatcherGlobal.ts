import { PersonaConfigWatcher } from "./fileWatcher.js";

/**
 * Global reference to the persona config watcher
 * Used by tools to access and save persona overrides
 */
let globalWatcher: PersonaConfigWatcher | null = null;

/**
 * Set the global persona watcher instance
 */
export function setGlobalPersonaWatcher(watcher: PersonaConfigWatcher): void {
  globalWatcher = watcher;
}

/**
 * Get the global persona watcher instance
 * Throws if watcher not initialized (should only be called after startup)
 */
export function getGlobalPersonaWatcher(): PersonaConfigWatcher {
  if (!globalWatcher) {
    throw new Error("Persona watcher not initialized");
  }
  return globalWatcher;
}
