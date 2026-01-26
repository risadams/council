import { HealthCheckResult } from "../types/docker.js";
import { createLogger } from "./logger.js";

/**
 * Stub health checker. Real implementation will probe HTTP/HTTPS endpoints,
 * MCP tool invocation, schema validation, disk and memory metrics.
 */
export class HealthChecker {
  private readonly logger = createLogger();

  async performHealthCheck(): Promise<HealthCheckResult> {
    this.logger.warn({ event: "health_check.stub" }, "Health check not yet implemented");
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime_seconds: 0,
      http_endpoint_ok: false,
      https_endpoint_ok: false,
      mcp_protocol_ok: false,
      schema_validation_ok: false,
      disk_space_free_mb: 0,
      memory_usage_mb: 0,
      error_message: "Health checks not implemented"
    };
  }
}
