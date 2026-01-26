import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { loadConfig, validateConfig, type AppConfig } from "../../server/src/utils/config.js";

const ORIGINAL_ENV = { ...process.env };

function makeTempDir(prefix: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return dir;
}

describe("config loader", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("loads valid configuration with defaults", () => {
    const workspaceDir = makeTempDir("workspace-");
    const certDir = makeTempDir("certs-");
    fs.writeFileSync(path.join(certDir, "cert.pem"), "dummy-cert");
    fs.writeFileSync(path.join(certDir, "key.pem"), "dummy-key");

    process.env.WORKSPACE_DIR = workspaceDir;
    process.env.CERT_DIR = certDir;
    process.env.HTTP_PORT = "8081";
    process.env.HTTPS_PORT = "8443";
    process.env.LOG_FORMAT = "text";
    process.env.LOG_LEVEL = "debug";

    const config = loadConfig({ exitOnError: false });
    expect(config.httpEnabled).toBe(true);
    expect(config.httpsEnabled).toBe(true);
    expect(config.httpPort).toBe(8081);
    expect(config.httpsPort).toBe(8443);
    expect(config.logFormat).toBe("text");
    expect(config.logLevel).toBe("debug");
    expect(config.workspaceDir).toBe(workspaceDir);
    expect(config.certDir).toBe(certDir);
  });

  it("rejects invalid HTTP port", () => {
    const config: AppConfig = {
      httpEnabled: true,
      httpsEnabled: false,
      httpPort: 1000,
      httpsPort: 8443,
      logLevel: "info",
      logFormat: "json",
      workspaceDir: makeTempDir("workspace-"),
      certDir: makeTempDir("certs-"),
      authEnabled: false
    };

    expect(() => validateConfig(config)).toThrow(/HTTP_PORT/);
  });

  it("rejects port conflicts when both protocols enabled", () => {
    const workspaceDir = makeTempDir("workspace-");
    const certDir = makeTempDir("certs-");
    fs.writeFileSync(path.join(certDir, "cert.pem"), "dummy-cert");
    fs.writeFileSync(path.join(certDir, "key.pem"), "dummy-key");

    const config: AppConfig = {
      httpEnabled: true,
      httpsEnabled: true,
      httpPort: 8080,
      httpsPort: 8080,
      logLevel: "info",
      logFormat: "json",
      workspaceDir,
      certDir,
      authEnabled: false
    };

    expect(() => validateConfig(config)).toThrow(/must differ/);
  });

  it("rejects missing certificates when HTTPS is enabled", () => {
    const workspaceDir = makeTempDir("workspace-");
    const certDir = makeTempDir("certs-");

    const config: AppConfig = {
      httpEnabled: false,
      httpsEnabled: true,
      httpPort: 8080,
      httpsPort: 8443,
      logLevel: "info",
      logFormat: "json",
      workspaceDir,
      certDir,
      authEnabled: false
    };

    expect(() => validateConfig(config)).toThrow(/certificates|cert.pem|key.pem/i);
  });
});
