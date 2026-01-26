import fs from "fs";
import path from "path";
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

function parseLogLevel(value: string | undefined): AppConfig["logLevel"] {
  const normalized = (value ?? "").toLowerCase();
  if (normalized === "debug" || normalized === "warn" || normalized === "error") return normalized;
  return "info";
}

function parseLogFormat(value: string | undefined): AppConfig["logFormat"] {
  return (value ?? "").toLowerCase() === "text" ? "text" : "json";
}

function ensureDirectoryExists(dir: string, name: string, errors: string[]) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    errors.push(`${name} directory does not exist: ${dir}`);
  }
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

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
}

export function loadConfig(options: { exitOnError?: boolean; logger?: AppLogger } = {}): AppConfig {
  const logger = options.logger ?? getRootLogger();
  const exitOnError = options.exitOnError !== false;

  try {
    const config: AppConfig = {
      httpEnabled: parseBoolean(process.env.HTTP_ENABLED, true),
      httpsEnabled: parseBoolean(process.env.HTTPS_ENABLED, true),
      httpPort: parsePort(process.env.HTTP_PORT, 8080),
      httpsPort: parsePort(process.env.HTTPS_PORT, 8000),
      logLevel: parseLogLevel(process.env.LOG_LEVEL),
      logFormat: parseLogFormat(process.env.LOG_FORMAT),
      workspaceDir: process.env.WORKSPACE_DIR || "/.council",
      certDir: process.env.CERT_DIR || "/certs",
      authEnabled: parseBoolean(process.env.AUTH_ENABLED, false),
      authToken: process.env.AUTH_TOKEN
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
        authEnabled: config.authEnabled
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
