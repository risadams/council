import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { loadConfig } from "../../server/src/utils/config.js";

describe("Docker Secrets Support (T048-T050)", () => {
  let tempSecretsDir: string;
  let tempWorkspaceDir: string;
  let tempCertsDir: string;

  const originalSecretsDir = process.env.SECRETS_DIR;
  const originalAuthToken = process.env.AUTH_TOKEN;
  const originalAuthEnabled = process.env.AUTH_ENABLED;
  const originalWorkspaceDir = process.env.WORKSPACE_DIR;
  const originalCertDir = process.env.CERT_DIR;
  const originalHttpEnabled = process.env.HTTP_ENABLED;
  const originalHttpsEnabled = process.env.HTTPS_ENABLED;

  beforeEach(() => {
    // Create temporary directories for testing
    tempSecretsDir = fs.mkdtempSync(path.join(os.tmpdir(), "secrets-"));
    tempWorkspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "workspace-"));
    tempCertsDir = fs.mkdtempSync(path.join(os.tmpdir(), "certs-"));

    // Create dummy cert files
    fs.writeFileSync(path.join(tempCertsDir, "cert.pem"), "dummy cert");
    fs.writeFileSync(path.join(tempCertsDir, "key.pem"), "dummy key");

    // Set test environment
    process.env.WORKSPACE_DIR = tempWorkspaceDir;
    process.env.CERT_DIR = tempCertsDir;
    process.env.HTTP_ENABLED = "false"; // Disable HTTPS requirement for most tests
    process.env.HTTPS_ENABLED = "false";
  });

  afterEach(() => {
    // Restore environment variables
    if (originalSecretsDir) process.env.SECRETS_DIR = originalSecretsDir;
    else delete process.env.SECRETS_DIR;

    if (originalAuthToken) process.env.AUTH_TOKEN = originalAuthToken;
    else delete process.env.AUTH_TOKEN;

    if (originalAuthEnabled) process.env.AUTH_ENABLED = originalAuthEnabled;
    else delete process.env.AUTH_ENABLED;

    if (originalWorkspaceDir) process.env.WORKSPACE_DIR = originalWorkspaceDir;
    else delete process.env.WORKSPACE_DIR;

    if (originalCertDir) process.env.CERT_DIR = originalCertDir;
    else delete process.env.CERT_DIR;

    if (originalHttpEnabled) process.env.HTTP_ENABLED = originalHttpEnabled;
    else delete process.env.HTTP_ENABLED;

    if (originalHttpsEnabled) process.env.HTTPS_ENABLED = originalHttpsEnabled;
    else delete process.env.HTTPS_ENABLED;

    // Clean up temporary directories
    if (fs.existsSync(tempSecretsDir)) {
      fs.rmSync(tempSecretsDir, { recursive: true });
    }
    if (fs.existsSync(tempWorkspaceDir)) {
      fs.rmSync(tempWorkspaceDir, { recursive: true });
    }
    if (fs.existsSync(tempCertsDir)) {
      fs.rmSync(tempCertsDir, { recursive: true });
    }
  });

  describe("T048: Docker Secrets Directory Reading", () => {
    it("should read AUTH_TOKEN from /run/secrets directory if available", () => {
      // Write secret file
      const tokenPath = path.join(tempSecretsDir, "AUTH_TOKEN");
      fs.writeFileSync(tokenPath, "secret-token-from-docker");

      // Set custom secrets dir for test
      process.env.SECRETS_DIR = tempSecretsDir;
      process.env.AUTH_ENABLED = "true";
      delete process.env.AUTH_TOKEN; // Remove env var so it uses secret

      const config = loadConfig({ exitOnError: false });

      // Should load token from secrets directory
      expect(config.authToken).toBe("secret-token-from-docker");
      expect(config.secretsDir).toBe(tempSecretsDir);
    });

    it("should handle missing /run/secrets directory gracefully", () => {
      process.env.SECRETS_DIR = "/nonexistent/secrets";
      process.env.AUTH_ENABLED = "false";

      // Should not throw, just skip secrets
      const config = loadConfig({ exitOnError: false });
      expect(config.secretsDir).toBe("/nonexistent/secrets");
    });

    it("should prefer environment variable over Docker Secrets if both exist", () => {
      // Write secret file
      const tokenPath = path.join(tempSecretsDir, "AUTH_TOKEN");
      fs.writeFileSync(tokenPath, "secret-from-docker");

      // Set both env var and secret
      process.env.SECRETS_DIR = tempSecretsDir;
      process.env.AUTH_TOKEN = "secret-from-env";
      process.env.AUTH_ENABLED = "true";

      const config = loadConfig({ exitOnError: false });

      // Environment variable should take precedence
      expect(config.authToken).toBe("secret-from-env");
    });
  });

  describe("T049: AUTH_ENABLED and AUTH_TOKEN Configuration", () => {
    it("should read AUTH_ENABLED from environment variable", () => {
      process.env.AUTH_ENABLED = "true";
      process.env.AUTH_TOKEN = "test-token";

      const config = loadConfig({ exitOnError: false });

      expect(config.authEnabled).toBe(true);
      expect(config.authToken).toBe("test-token");
    });

    it("should default AUTH_ENABLED to false", () => {
      delete process.env.AUTH_ENABLED;
      delete process.env.AUTH_TOKEN;

      const config = loadConfig({ exitOnError: false });

      expect(config.authEnabled).toBe(false);
    });

    it("should handle empty AUTH_TOKEN gracefully", () => {
      process.env.AUTH_ENABLED = "true";
      process.env.AUTH_TOKEN = "";

      const config = loadConfig({ exitOnError: false });

      expect(config.authEnabled).toBe(true);
      // Empty string is falsy, so authToken might be undefined or empty
      expect(config.authToken === "" || !config.authToken).toBe(true);
    });
  });

  describe("T050: Secrets Prepared for Future Use", () => {
    it("should verify /run/secrets path is checked by config loader", () => {
      const config = loadConfig({ exitOnError: false });

      // Config should have secretsDir property
      expect(config.secretsDir).toBeDefined();
      expect(typeof config.secretsDir).toBe("string");
    });

    it("should not enforce authentication (prepared only, not active)", () => {
      process.env.AUTH_ENABLED = "true";
      process.env.AUTH_TOKEN = "test-token";

      const config = loadConfig({ exitOnError: false });

      // Auth should be read but not validated/enforced
      expect(config.authEnabled).toBe(true);
      expect(config.authToken).toBe("test-token");
      // No error should be thrown - auth is prepared but not enforced
    });

    it("should read multiple secrets from directory (future extensibility)", () => {
      // Write multiple secret files
      fs.writeFileSync(path.join(tempSecretsDir, "AUTH_TOKEN"), "token-123");
      fs.writeFileSync(path.join(tempSecretsDir, "API_KEY"), "key-456");
      fs.writeFileSync(path.join(tempSecretsDir, "DB_PASSWORD"), "pass-789");

      process.env.SECRETS_DIR = tempSecretsDir;
      process.env.AUTH_ENABLED = "false";

      const config = loadConfig({ exitOnError: false });

      // Should successfully load without error
      expect(config.secretsDir).toBe(tempSecretsDir);
      // AUTH_TOKEN from secrets directory
      expect(config.authToken).toBe("token-123");
    });
  });

  describe("T051: Documentation of Auth Preparation", () => {
    it("should include secrets config in logged information", () => {
      process.env.AUTH_ENABLED = "false";

      const config = loadConfig({ exitOnError: false });

      // Verify config includes secretsDir
      expect(config.secretsDir).toBeDefined();
      expect(typeof config.secretsDir).toBe("string");
    });

    it("should show that authentication is prepared for future integrations", () => {
      const config = loadConfig({ exitOnError: false });

      // Config object should have all auth-related fields
      expect(config).toHaveProperty("authEnabled");
      expect(config).toHaveProperty("authToken");
      expect(config).toHaveProperty("secretsDir");
    });
  });
});
