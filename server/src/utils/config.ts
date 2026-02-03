import fs from "fs";
import path from "path";
import os from "os";
import { getRootLogger, type AppLogger } from "./logger.js";

export type AppConfig = {
  httpEnabled: boolean;
  httpsEnabled: boolean;
  httpPort: number;
  httpsPort: number;
  logLevel: "debug" | "info" | "warn" | "error";
  logFormat: "json" | "text";
  workspaceDir: string;
  certDir: string;
  authEnabled: boolean;
  authToken?: string;
  secretsDir: string;
  interactiveModeEnabled: boolean;
  debateCycleLimit: number;
  extendedDebateCycleLimit: number;
};

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (typeof value === "undefined") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return defaultValue;
}

function parsePort(value: string | undefined, defaultValue: number): number {
  if (typeof value === "undefined" || value === "") return defaultValue;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid port: ${value}`);
  }
  return parsed;
}

function parsePositiveInt(value: string | undefined, defaultValue: number): number {
  if (typeof value === "undefined" || value === "") return defaultValue;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer: ${value}`);
  }
  return parsed;
}

function parseLogLevel(value: string | undefined): AppConfig["logLevel"] {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "debug" || normalized === "warn" || normalized === "error") return normalized;
  return "info";
}

function parseLogFormat(value: string | undefined): AppConfig["logFormat"] {
  return (value ?? "").toLowerCase() === "text" ? "text" : "json";
}

function ensureDirectoryExists(dir: string, name: string, errors: string[]) {
  try {
    if (!fs.existsSync(dir)) {
      // Try to create the directory if it doesn't exist
      fs.mkdirSync(dir, { recursive: true });
    } else if (!fs.statSync(dir).isDirectory()) {
      errors.push(`${name} is not a directory: ${dir}`);
    }
  } catch (err) {
    errors.push(`${name} directory cannot be created or accessed: ${dir} (${err instanceof Error ? err.message : String(err)})`);
  }
}

/**
 * Load secrets from Docker Secrets directory (/run/secrets).
 * Supports AUTH_TOKEN and future auth-related secrets.
 */
function loadDockerSecrets(secretsDir: string): Record<string, string> {
  const secrets: Record<string, string> = {};

  if (!fs.existsSync(secretsDir)) {
    return secrets; // No secrets directory (not running in Docker Swarm or K8s)
  }

  try {
    const files = fs.readdirSync(secretsDir);
    for (const file of files) {
      try {
        const filePath = path.join(secretsDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          const content = fs.readFileSync(filePath, "utf-8").trim();
          secrets[file] = content;
        }
      } catch {
        // Skip files that can't be read
      }
    }
  } catch {
    // Directory not readable (permissions issue)
  }

  return secrets;
}

export function validateConfig(config: AppConfig): void {
  const errors: string[] = [];

  if (config.httpEnabled) {
    if (config.httpPort < 1024 || config.httpPort > 65535) {
      errors.push("HTTP_PORT must be between 1024 and 65535");
    }
  }

  if (config.httpsEnabled) {
    if (config.httpsPort < 1024 || config.httpsPort > 65535) {
      errors.push("HTTPS_PORT must be between 1024 and 65535");
    }
    ensureDirectoryExists(config.certDir, "CERT_DIR", errors);
    if (fs.existsSync(config.certDir)) {
      const certPath = path.join(config.certDir, "cert.pem");
      const keyPath = path.join(config.certDir, "key.pem");
      if (!fs.existsSync(certPath)) errors.push(`Missing TLS certificate file: ${certPath}`);
      if (!fs.existsSync(keyPath)) errors.push(`Missing TLS key file: ${keyPath}`);
    }
  }

  if (config.httpEnabled && config.httpsEnabled && config.httpPort === config.httpsPort) {
    errors.push("HTTP_PORT and HTTPS_PORT must differ when both protocols are enabled");
  }

  ensureDirectoryExists(config.workspaceDir, "WORKSPACE_DIR", errors);

  if (config.debateCycleLimit <= 0) {
    errors.push("COUNCIL_DEBATE_CYCLE_LIMIT must be greater than 0");
  }

  if (config.extendedDebateCycleLimit < config.debateCycleLimit) {
    errors.push("COUNCIL_EXTENDED_DEBATE_CYCLE_LIMIT must be >= COUNCIL_DEBATE_CYCLE_LIMIT");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}

export function loadConfig(options: { exitOnError?: boolean; logger?: AppLogger } = {}): AppConfig {
  const logger = options.logger ?? getRootLogger();
  const exitOnError = options.exitOnError !== false;

  try {
    const secretsDir = process.env.SECRETS_DIR || "/run/secrets";
    const secrets = loadDockerSecrets(secretsDir);

    // Use AUTH_TOKEN from environment or Docker Secrets
    let authToken = process.env.AUTH_TOKEN || secrets.AUTH_TOKEN;

    // Determine default workspace directory based on environment
    // In Docker: /.council
    // Locally on Windows: %TEMP%\.council or AppData
    // Locally on Unix: ~/.council
    const defaultWorkspaceDir = process.env.WORKSPACE_DIR || (() => {
      if (process.platform === "win32") {
        // Windows: use temp directory
        return path.join(os.tmpdir(), ".council");
      }
      // Unix-like: use home directory or /tmp
      return process.env.HOME ? path.join(process.env.HOME, ".council") : "/.council";
    })();

    // Determine default cert directory
    // In Docker: /certs (mounted from host)
    // Locally: Look in parent/certs (for development), then current certs, then Docker default
    const defaultCertDir = process.env.CERT_DIR || (() => {
      const candidates = [
        path.join(process.cwd(), "..", "certs"),  // Parent directory (for server/ subdirectory)
        path.join(process.cwd(), "certs"),        // Current directory
        "/certs"                                   // Docker default
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
      // Return the first candidate even if it doesn't exist (will be validated later)
      return candidates[0];
    })();

    const config: AppConfig = {
      httpEnabled: parseBoolean(process.env.HTTP_ENABLED, true),
      httpsEnabled: parseBoolean(process.env.HTTPS_ENABLED, true),
      httpPort: parsePort(process.env.HTTP_PORT, 8080),
      httpsPort: parsePort(process.env.HTTPS_PORT, 8000),
      logLevel: parseLogLevel(process.env.LOG_LEVEL),
      logFormat: parseLogFormat(process.env.LOG_FORMAT),
      workspaceDir: defaultWorkspaceDir,
      certDir: defaultCertDir,
      authEnabled: parseBoolean(process.env.AUTH_ENABLED, false),
      authToken,
      secretsDir,
      interactiveModeEnabled: parseBoolean(process.env.COUNCIL_INTERACTIVE_ENABLED, true),
      debateCycleLimit: parsePositiveInt(process.env.COUNCIL_DEBATE_CYCLE_LIMIT, 10),
      extendedDebateCycleLimit: parsePositiveInt(process.env.COUNCIL_EXTENDED_DEBATE_CYCLE_LIMIT, 20)
    };

    validateConfig(config);

    logger.info(
      {
        event: "config.loaded",
        httpEnabled: config.httpEnabled,
        httpsEnabled: config.httpsEnabled,
        httpPort: config.httpPort,
        httpsPort: config.httpsPort,
        logLevel: config.logLevel,
        logFormat: config.logFormat,
        workspaceDir: config.workspaceDir,
        certDir: config.certDir,
        authEnabled: config.authEnabled,
        secretsDir: config.secretsDir,
        interactiveModeEnabled: config.interactiveModeEnabled,
        debateCycleLimit: config.debateCycleLimit,
        extendedDebateCycleLimit: config.extendedDebateCycleLimit
      },
      "Configuration loaded"
    );

    return config;
  } catch (err: any) {
    logger.error({ event: "config.invalid", error: err?.message }, "Configuration validation failed");
    if (exitOnError) {
      process.exitCode = 1;
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
    throw err;
  }
}
