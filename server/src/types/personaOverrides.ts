/**
 * Persona Configuration Overrides
 * Allows customization of personas at runtime with validation
 */

export interface PersonaOverride {
  enabled: boolean;
  customSoul?: string;
  customFocus?: string[];
  customConstraints?: string[];
}

export interface PersonaOverridesFile {
  version: "1.0";
  lastModified: string;
  overrides: Record<string, PersonaOverride>;
}

/**
 * Validates a persona override configuration
 * Ensures character limits and structure compliance
 */
export function validatePersonaOverride(personaId: string, override: PersonaOverride): string[] {
  const errors: string[] = [];

  // Validate enabled is boolean
  if (typeof override.enabled !== "boolean") {
    errors.push(`${personaId}: 'enabled' must be a boolean`);
  }

  // Validate customSoul length
  if (override.customSoul !== undefined) {
    if (typeof override.customSoul !== "string") {
      errors.push(`${personaId}: 'customSoul' must be a string`);
    } else if (override.customSoul.length > 500) {
      errors.push(`${personaId}: 'customSoul' exceeds 500 character limit (${override.customSoul.length} chars)`);
    }
  }

  // Validate customFocus items
  if (override.customFocus !== undefined) {
    if (!Array.isArray(override.customFocus)) {
      errors.push(`${personaId}: 'customFocus' must be an array`);
    } else {
      override.customFocus.forEach((focus, index) => {
        if (typeof focus !== "string") {
          errors.push(`${personaId}: 'customFocus[${index}]' must be a string`);
        } else if (focus.length > 100) {
          errors.push(`${personaId}: 'customFocus[${index}]' exceeds 100 character limit (${focus.length} chars)`);
        }
      });
    }
  }

  // Validate customConstraints items
  if (override.customConstraints !== undefined) {
    if (!Array.isArray(override.customConstraints)) {
      errors.push(`${personaId}: 'customConstraints' must be an array`);
    } else {
      override.customConstraints.forEach((constraint, index) => {
        if (typeof constraint !== "string") {
          errors.push(`${personaId}: 'customConstraints[${index}]' must be a string`);
        } else if (constraint.length > 200) {
          errors.push(`${personaId}: 'customConstraints[${index}]' exceeds 200 character limit (${constraint.length} chars)`);
        }
      });
    }
  }

  return errors;
}

/**
 * Validates entire overrides file structure
 */
export function validatePersonaOverridesFile(file: PersonaOverridesFile): string[] {
  const errors: string[] = [];

  if (file.version !== "1.0") {
    errors.push(`Invalid version: '${file.version}' (expected '1.0')`);
  }

  if (typeof file.lastModified !== "string") {
    errors.push("'lastModified' must be a string (ISO 8601 timestamp)");
  } else {
    try {
      new Date(file.lastModified).toISOString();
    } catch {
      errors.push(`Invalid 'lastModified' timestamp: '${file.lastModified}'`);
    }
  }

  if (typeof file.overrides !== "object" || Array.isArray(file.overrides)) {
    errors.push("'overrides' must be an object");
  } else {
    Object.entries(file.overrides).forEach(([personaId, override]) => {
      const overrideErrors = validatePersonaOverride(personaId, override as PersonaOverride);
      errors.push(...overrideErrors);
    });
  }

  return errors;
}
