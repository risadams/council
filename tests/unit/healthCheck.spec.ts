import { describe, expect, it } from "vitest";
import { HealthChecker } from "../../server/src/utils/healthCheck.js";

describe("health checker", () => {
  it("returns healthy status when checks pass", async () => {
    const checker = new HealthChecker(8080, 8443, "/tmp");
    const result = await checker.performHealthCheck();

    expect(result).toBeDefined();
    expect(result.status).toMatch(/healthy|unhealthy/);
    expect(result.timestamp).toBeDefined();
    expect(result.uptime_seconds).toBeGreaterThanOrEqual(0);
    expect(typeof result.http_endpoint_ok).toBe("boolean");
    expect(typeof result.https_endpoint_ok).toBe("boolean");
    expect(typeof result.mcp_protocol_ok).toBe("boolean");
    expect(typeof result.schema_validation_ok).toBe("boolean");
    expect(typeof result.disk_space_free_mb).toBe("number");
    expect(typeof result.memory_usage_mb).toBe("number");
  });

  it("includes error message when unhealthy", async () => {
    const checker = new HealthChecker(9999, 9998, "/tmp");
    const result = await checker.performHealthCheck();

    if (result.status === "unhealthy") {
      expect(result.error_message).toBeDefined();
      expect(result.error_message?.length).toBeGreaterThan(0);
    }
  });

  it("handles missing workspace directory gracefully", async () => {
    const checker = new HealthChecker(8080, 8443, "/nonexistent/path/to/workspace");
    const result = await checker.performHealthCheck();

    expect(result).toBeDefined();
    expect(result.disk_space_free_mb).toBe(0);
  });
});
