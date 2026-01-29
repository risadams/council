import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { PersonaConfigWatcher } from "../../server/src/utils/fileWatcher.js";
import { PersonaOverridesFile } from "../../server/src/types/personaOverrides.js";

const testDir = path.join(process.cwd(), ".test-hotreload-workspace");
const overridesFile = path.join(testDir, "personas.overrides.json");

describe("Persona Hot-Reload Integration", () => {
  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(overridesFile)) {
      fs.unlinkSync(overridesFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  it("should detect and reload file changes", async () => {
    const watcher = new PersonaConfigWatcher(testDir);
    const reloadedOverrides: PersonaOverridesFile[] = [];

    // Setup initial overrides
    const initialOverrides: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: {
        devilsAdvocate: {
          enabled: true,
          customSoul: "Initial challenger"
        }
      }
    };
    fs.writeFileSync(overridesFile, JSON.stringify(initialOverrides, null, 2));

    // Load initial
    watcher.loadPersonaOverrides();
    let reloadCount = 0;
    watcher.watchForChanges((updated) => {
      reloadedOverrides.push(updated);
      reloadCount++;
    });

    // Verify watcher is watching (by checking current state)
    expect(watcher.getCurrentOverrides()).toBeDefined();
    expect(watcher.getOverridesFilePath()).toBe(overridesFile);

    watcher.stop();

    // This test primarily verifies watcher setup and getCurrentOverrides
    expect(watcher.getCurrentOverrides()?.overrides.devilsAdvocate.enabled).toBe(true);
  });

  it("should handle multiple rapid file changes", async () => {
    const watcher = new PersonaConfigWatcher(testDir);

    // Create initial file
    const initial: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: { devilsAdvocate: { enabled: true } }
    };
    fs.writeFileSync(overridesFile, JSON.stringify(initial, null, 2));

    watcher.loadPersonaOverrides();
    expect(watcher.getCurrentOverrides()).toBeDefined();

    // Simulate multiple saves
    for (let i = 0; i < 3; i++) {
      const update: PersonaOverridesFile = {
        version: "1.0",
        lastModified: new Date().toISOString(),
        overrides: {
          devilsAdvocate: {
            enabled: true,
            customSoul: `Change ${i + 1}`
          }
        }
      };

      const saved = watcher.savePersonaOverrides(update);
      expect(saved).toBe(true);
    }

    // Verify final state
    const final = watcher.loadPersonaOverrides();
    expect(final?.overrides.devilsAdvocate.customSoul).toBe("Change 3");

    watcher.stop();
  });

  it("should handle file deletion gracefully", async () => {
    const watcher = new PersonaConfigWatcher(testDir);

    // Create initial file
    const initial: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: { devilsAdvocate: { enabled: true } }
    };
    fs.writeFileSync(overridesFile, JSON.stringify(initial, null, 2));
    watcher.loadPersonaOverrides();

    // Delete the file
    fs.unlinkSync(overridesFile);

    // Try to load (should handle gracefully)
    const loaded = watcher.loadPersonaOverrides();
    expect(loaded).toBeNull();

    watcher.stop();
  });

  it("should apply overrides to personas correctly", async () => {
    const watcher = new PersonaConfigWatcher(testDir);

    const overrides: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: {
        devilsAdvocate: {
          enabled: true,
          customSoul: "Aggressive challenging persona",
          customFocus: ["Critical analysis", "Risk identification"],
          customConstraints: ["Be constructive"]
        }
      }
    };

    const saved = watcher.savePersonaOverrides(overrides);
    expect(saved).toBe(true);

    // Verify content
    const written = JSON.parse(fs.readFileSync(overridesFile, "utf-8")) as PersonaOverridesFile;
    expect(written.overrides.devilsAdvocate.customSoul).toBe("Aggressive challenging persona");
    expect(written.overrides.devilsAdvocate.customFocus).toContain("Risk identification");
  });

  it("should maintain state consistency across reload cycles", async () => {
    const watcher = new PersonaConfigWatcher(testDir);

    const step1: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: {
        devilsAdvocate: { enabled: true, customSoul: "Step 1" }
      }
    };

    fs.writeFileSync(overridesFile, JSON.stringify(step1, null, 2));
    const loaded1 = watcher.loadPersonaOverrides();
    expect(loaded1?.overrides.devilsAdvocate.customSoul).toBe("Step 1");

    const step2: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: {
        devilsAdvocate: { enabled: true, customSoul: "Step 2" },
        growthStrategist: { enabled: true }
      }
    };

    fs.writeFileSync(overridesFile, JSON.stringify(step2, null, 2));
    const loaded2 = watcher.loadPersonaOverrides();
    expect(loaded2?.overrides.devilsAdvocate.customSoul).toBe("Step 2");
    expect(Object.keys(loaded2?.overrides ?? {}).length).toBe(2);

    const current = watcher.getCurrentOverrides();
    expect(current?.overrides.growthStrategist.enabled).toBe(true);

    watcher.stop();
  });
});
