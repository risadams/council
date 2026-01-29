import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { PersonaConfigWatcher } from "../../server/src/utils/fileWatcher.js";
import { PersonaOverridesFile } from "../../server/src/types/personaOverrides.js";

// Test workspace directory (temporary)
const testDir = path.join(process.cwd(), ".test-workspace");
const overridesFile = path.join(testDir, "personas.overrides.json");

describe("PersonaConfigWatcher", () => {
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(overridesFile)) {
      fs.unlinkSync(overridesFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  it("should load valid overrides from file", () => {
    const watcher = new PersonaConfigWatcher(testDir);

    const validOverrides: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: {
        devilsAdvocate: {
          enabled: true,
          customSoul: "Aggressive challenger of all assumptions"
        },
        growthStrategist: {
          enabled: false
        }
      }
    };

    fs.writeFileSync(overridesFile, JSON.stringify(validOverrides, null, 2));

    const loaded = watcher.loadPersonaOverrides();
    expect(loaded).toBeDefined();
    expect(loaded?.overrides.devilsAdvocate.enabled).toBe(true);
    expect(loaded?.overrides.devilsAdvocate.customSoul).toBe("Aggressive challenger of all assumptions");
    expect(loaded?.overrides.growthStrategist.enabled).toBe(false);
  });

  it("should return null when file does not exist", () => {
    const watcher = new PersonaConfigWatcher(testDir);
    const loaded = watcher.loadPersonaOverrides();
    expect(loaded).toBeNull();
  });

  it("should reject malformed JSON file", () => {
    const watcher = new PersonaConfigWatcher(testDir);

    // Write invalid JSON
    fs.writeFileSync(overridesFile, "{ invalid json }");

    const loaded = watcher.loadPersonaOverrides();
    expect(loaded).toBeNull();
  });

  it("should reject file with validation errors", () => {
    const watcher = new PersonaConfigWatcher(testDir);

    // Write file with invalid structure (missing version)
    const invalidOverrides = {
      lastModified: new Date().toISOString(),
      overrides: {}
    };
    fs.writeFileSync(overridesFile, JSON.stringify(invalidOverrides, null, 2));

    const loaded = watcher.loadPersonaOverrides();
    expect(loaded).toBeNull();
  });

  it("should save overrides atomically", () => {
    const watcher = new PersonaConfigWatcher(testDir);

    const overrides: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: {
        devilsAdvocate: {
          enabled: true,
          customSoul: "Persistent challenger"
        }
      }
    };

    const success = watcher.savePersonaOverrides(overrides);
    expect(success).toBe(true);

    // Verify file was written
    expect(fs.existsSync(overridesFile)).toBe(true);

    const written = JSON.parse(fs.readFileSync(overridesFile, "utf-8")) as PersonaOverridesFile;
    expect(written.overrides.devilsAdvocate.customSoul).toBe("Persistent challenger");
  });

  it("should reject saving invalid overrides", () => {
    const watcher = new PersonaConfigWatcher(testDir);

    const invalidOverrides = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: {
        devilsAdvocate: {
          enabled: "true" as any // Should be boolean
        }
      }
    };

    const success = watcher.savePersonaOverrides(invalidOverrides as any);
    expect(success).toBe(false);

    // File should not be created
    expect(fs.existsSync(overridesFile)).toBe(false);
  });

  it("should provide current overrides via getter", () => {
    const watcher = new PersonaConfigWatcher(testDir);

    const initialOverrides = watcher.getCurrentOverrides();
    expect(initialOverrides).toBeNull();

    // Load some overrides
    const overrides: PersonaOverridesFile = {
      version: "1.0",
      lastModified: new Date().toISOString(),
      overrides: {
        devilsAdvocate: {
          enabled: true
        }
      }
    };
    fs.writeFileSync(overridesFile, JSON.stringify(overrides, null, 2));

    watcher.loadPersonaOverrides();
    const currentOverrides = watcher.getCurrentOverrides();
    expect(currentOverrides).toBeDefined();
    expect(currentOverrides?.overrides.devilsAdvocate.enabled).toBe(true);
  });

  it("should return correct overrides file path", () => {
    const watcher = new PersonaConfigWatcher(testDir);
    const filePath = watcher.getOverridesFilePath();
    expect(filePath).toBe(overridesFile);
  });

  it("should stop watching without errors", () => {
    const watcher = new PersonaConfigWatcher(testDir);
    // Start watching with a no-op callback
    watcher.watchForChanges(() => {});

    // Should not throw
    expect(() => watcher.stop()).not.toThrow();
  });
});
