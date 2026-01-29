import http from "http";
import https from "https";
import os from "os";
import fs from "fs";
import path from "path";
import { HealthCheckResult } from "../types/docker.js";
import { getRootLogger } from "./logger.js";

/**
 * Health checker for Docker Desktop MCP integration.
 * Tests HTTP/HTTPS availability, MCP protocol compliance, schemas, and system resources.
 */
export class HealthChecker {
  private readonly logger = getRootLogger().child({ component: "healthCheck" });
  private readonly containerStartTime = Date.now();

  constructor(
    private readonly httpPort?: number,
    private readonly httpsPort?: number,
    private readonly workspaceDir: string = "/.council"
  ) {}

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const uptime_seconds = Math.floor((Date.now() - this.containerStartTime) / 1000);
      const memory_usage_mb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const disk_space_free_mb = await this.getDiskSpaceFree();

      const http_endpoint_ok = this.httpPort ? await this.testHttpEndpoint(this.httpPort) : true;
      if (!http_endpoint_ok && this.httpPort) errors.push("HTTP endpoint not responding");

      const https_endpoint_ok = this.httpsPort ? await this.testHttpsEndpoint(this.httpsPort) : true;
      if (!https_endpoint_ok && this.httpsPort) errors.push("HTTPS endpoint not responding");

      const mcp_protocol_ok = await this.testMcpProtocol();
      if (!mcp_protocol_ok) errors.push("MCP protocol test failed");

      const schema_validation_ok = this.validateSchemasLoaded();
      if (!schema_validation_ok) errors.push("Tool schemas not loaded");

      const status = errors.length === 0 ? "healthy" : "unhealthy";

      const result: HealthCheckResult = {
        status,
        timestamp: new Date().toISOString(),
        uptime_seconds,
        http_endpoint_ok,
        https_endpoint_ok,
        mcp_protocol_ok,
        schema_validation_ok,
        disk_space_free_mb,
        memory_usage_mb,
        error_message: errors.length > 0 ? errors.join("; ") : undefined
      };

      const duration = Date.now() - startTime;
      this.logger.debug(
        {
          event: "health_check.complete",
          status: result.status,
          duration_ms: duration,
          memory_usage_mb,
          disk_space_free_mb
        },
        `Health check completed (${duration}ms): ${result.status}`
      );

      return result;
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          event: "health_check.error",
          duration_ms: duration,
          error: err?.message
        },
        "Health check failed"
      );

      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor((Date.now() - this.containerStartTime) / 1000),
        http_endpoint_ok: false,
        https_endpoint_ok: false,
        mcp_protocol_ok: false,
        schema_validation_ok: false,
        disk_space_free_mb: 0,
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        error_message: err?.message
      };
    }
  }

  private testHttpEndpoint(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}/`, { timeout: 2000 }, (res) => {
        resolve(res.statusCode! >= 200 && res.statusCode! < 500);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  private testHttpsEndpoint(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = https.get(`https://localhost:${port}/`, { rejectUnauthorized: false, timeout: 2000 }, (res) => {
        resolve(res.statusCode! >= 200 && res.statusCode! < 500);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  private async testMcpProtocol(): Promise<boolean> {
    try {
      const port = this.httpsPort || this.httpPort || 8080;
      const protocol = this.httpsPort ? "https" : "http";
      const testPayload = JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        id: 1
      });

      return await new Promise((resolve) => {
        const makeRequest = protocol === "https" ? https.request : http.request;
        const options = {
          hostname: "localhost",
          port,
          path: "/",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": testPayload.length
          },
          timeout: 2000,
          rejectUnauthorized: false
        };

        const req = makeRequest(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              const response = JSON.parse(data);
              resolve(!response.error && response.result?.tools);
            } catch {
              resolve(false);
            }
          });
        });

        req.on("error", () => resolve(false));
        req.on("timeout", () => {
          req.destroy();
          resolve(false);
        });

        req.write(testPayload);
        req.end();
      });
    } catch {
      return false;
    }
  }

  private validateSchemasLoaded(): boolean {
    try {
      const schemasPath = path.join(process.cwd(), "dist", "schemas");
      if (!fs.existsSync(schemasPath)) return false;

      const requiredSchemas = [
        "council.consult.input.schema.json",
        "council.consult.output.schema.json",
        "persona.consult.input.schema.json",
        "persona.consult.output.schema.json",
        "council.define_personas.input.schema.json",
        "council.define_personas.output.schema.json"
      ];

      return requiredSchemas.every((schema) => fs.existsSync(path.join(schemasPath, schema)));
    } catch {
      return false;
    }
  }

  private async getDiskSpaceFree(): Promise<number> {
    try {
      const dir = this.workspaceDir || "/.council";
      if (!fs.existsSync(dir)) return 0;

      // Simple approximation: statvfs not available cross-platform
      // For production, consider os.statfs or df command
      const stats = fs.statfsSync(dir);
      const freeMb = Math.floor((stats.bavail * stats.bsize) / 1024 / 1024);
      return freeMb;
    } catch {
      return 0;
    }
  }
}
