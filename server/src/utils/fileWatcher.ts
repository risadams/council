import fs from "fs";
import path from "path";
import { getRootLogger, type AppLogger } from "./logger.js";
import { PersonaOverridesFile, validatePersonaOverridesFile } from "../types/personaOverrides.js";

/**
 * Watches and manages persona configuration overrides file
 * Automatically reloads when file changes
 */
export class PersonaConfigWatcher {
  private logger: AppLogger;
  private overridesFilePath: string;
  private currentOverrides: PersonaOverridesFile | null = null;
  private watcher: fs.FSWatcher | null = null;
  private reloadCallbacks: Array<(overrides: PersonaOverridesFile) => void> = [];
  private isReloading = false;

  constructor(workspaceDir: string, logger?: AppLogger) {
    this.logger = logger ?? getRootLogger().child({ component: "personaConfigWatcher" });
    this.overridesFilePath = path.join(workspaceDir, "personas.overrides.json");
  }

  /**
   * Load persona overrides from file
   */
  loadPersonaOverrides(): PersonaOverridesFile | null {
    try {
      if (!fs.existsSync(this.overridesFilePath)) {
        this.logger.debug(
          { event: "override.load.skip", filePath: this.overridesFilePath },
          "Overrides file does not exist (using defaults)"
        );
        return null;
      }

      const fileContent = fs.readFileSync(this.overridesFilePath, "utf-8");
      const overrides = JSON.parse(fileContent) as PersonaOverridesFile;

      // Validate structure
      const errors = validatePersonaOverridesFile(overrides);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join("; ")}`);
      }

      this.currentOverrides = overrides;
      this.logger.info(
        {
          event: "override.load.success",
          filePath: this.overridesFilePath,
          personaCount: Object.keys(overrides.overrides).length,
          lastModified: overrides.lastModified
        },
        `Loaded persona overrides for ${Object.keys(overrides.overrides).length} personas`
      );

      return overrides;
    } catch (err: any) {
      this.logger.error(
        {
          event: "override.load.error",
          filePath: this.overridesFilePath,
          error: err?.message
        },
        "Failed to load persona overrides"
      );
      return null;
    }
  }

  /**
   * Start watching for file changes
   */
  watchForChanges(callback: (overrides: PersonaOverridesFile) => void): void {
    if (this.watcher) {
      this.logger.debug({ event: "watcher.skip" }, "Watcher already active");
      return;
    }

    // Register callback
    this.reloadCallbacks.push(callback);

    // Watch the workspace directory (not just the file, for better reliability)
    const watchDir = path.dirname(this.overridesFilePath);

    try {
      this.watcher = fs.watch(watchDir, { persistent: false }, (eventType, filename) => {
        // Only react to changes on our overrides file
        if (filename && path.basename(filename) === "personas.overrides.json") {
          this.reloadOnChange();
        }
      });

      // Allow process to exit despite active watcher
      if (this.watcher.unref) {
        this.watcher.unref();
      }

      this.logger.info(
        { event: "watcher.start", filePath: this.overridesFilePath },
        `Watching for persona override changes: ${this.overridesFilePath}`
      );
    } catch (err: any) {
      this.logger.error(
        {
          event: "watcher.error",
          error: err?.message
        },
        "Failed to start file watcher"
      );
    }
  }

  /**
   * Reload overrides when file changes
   */
  private async reloadOnChange(): Promise<void> {
    if (this.isReloading) {
      return; // Prevent concurrent reloads
    }

    this.isReloading = true;

    try {
      // Small delay to ensure file is fully written
      await new Promise((resolve) => setTimeout(resolve, 100));

      const newOverrides = this.loadPersonaOverrides();
      if (newOverrides && this.currentOverrides !== newOverrides) {
        const affectedPersonas = Object.keys(newOverrides.overrides);

        this.logger.info(
          {
            event: "override.reload.success",
            affectedPersonas: affectedPersonas.length,
            personaIds: affectedPersonas,
            timestamp: new Date().toISOString()
          },
          `Reloaded ${affectedPersonas.length} persona overrides`
        );

        // Call all registered callbacks
        this.reloadCallbacks.forEach((callback) => {
          try {
            callback(newOverrides);
          } catch (err: any) {
            this.logger.error(
              {
                event: "override.reload.callback.error",
                error: err?.message
              },
              "Error in override reload callback"
            );
          }
        });
      }
    } catch (err: any) {
      this.logger.error(
        {
          event: "override.reload.error",
          error: err?.message
        },
        "Failed to reload persona overrides"
      );
    } finally {
      this.isReloading = false;
    }
  }

  /**
   * Save overrides atomically (write to temp, then rename)
   */
  savePersonaOverrides(overrides: PersonaOverridesFile): boolean {
    try {
      // Validate before writing
      const errors = validatePersonaOverridesFile(overrides);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join("; ")}`);
      }

      // Write to temporary file first
      const tempPath = `${this.overridesFilePath}.tmp`;
      const jsonContent = JSON.stringify(overrides, null, 2);
      fs.writeFileSync(tempPath, jsonContent, "utf-8");

      // Atomic rename
      fs.renameSync(tempPath, this.overridesFilePath);

      this.logger.info(
        {
          event: "override.save.success",
          filePath: this.overridesFilePath,
          personaCount: Object.keys(overrides.overrides).length
        },
        `Saved persona overrides for ${Object.keys(overrides.overrides).length} personas`
      );

      return true;
    } catch (err: any) {
      this.logger.error(
        {
          event: "override.save.error",
          filePath: this.overridesFilePath,
          error: err?.message
        },
        "Failed to save persona overrides"
      );
      return false;
    }
  }

  /**
   * Stop watching for changes
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.logger.info({ event: "watcher.stop" }, "Stopped watching for persona override changes");
    }
  }

  /**
   * Get current overrides
   */
  getCurrentOverrides(): PersonaOverridesFile | null {
    return this.currentOverrides;
  }

  /**
   * Get overrides file path
   */
  getOverridesFilePath(): string {
    return this.overridesFilePath;
  }

  /**
   * Apply overrides to persona definitions (for backward compatibility)
   * This method merges overrides with defaults
   */
  applyOverrides(overrides: PersonaOverridesFile | null): void {
    if (!overrides) {
      this.logger.debug({ event: "override.apply.skip" }, "No overrides to apply");
      return;
    }

    this.currentOverrides = overrides;
    this.logger.info(
      {
        event: "override.apply.success",
        personaCount: Object.keys(overrides.overrides).length,
        timestamp: overrides.lastModified
      },
      `Applied overrides for ${Object.keys(overrides.overrides).length} personas`
    );
  }
}
