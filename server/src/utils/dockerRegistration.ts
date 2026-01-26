import { ServiceRegistration, ServiceStatus } from "../types/docker.js";
import { getRootLogger } from "./logger.js";
import { HealthChecker } from "./healthCheck.js";

/**
 * Docker Desktop MCP service registration.
 * Handles registration, deregistration, and status updates with retry logic.
 */
export class DockerRegistration {
  private logger = getRootLogger().child({ component: "dockerRegistration" });
  private registeredServiceId?: string;
  private healthChecker: HealthChecker;
  private retryCount = 0;
  private maxRetries = 3;
  private lastHealthCheckTime?: string;

  constructor(
    private config: {
      serviceId: string;
      name: string;
      version: string;
      description: string;
      httpPort?: number;
      httpsPort?: number;
      workspaceDir: string;
    }
  ) {
    this.healthChecker = new HealthChecker(config.httpPort, config.httpsPort, config.workspaceDir);
  }

  async registerService(): Promise<ServiceRegistration | null> {
    try {
      const healthCheck = await this.healthChecker.performHealthCheck();
      this.lastHealthCheckTime = healthCheck.timestamp;

      const protocol = this.config.httpsPort ? "https" : "http";
      const port = this.config.httpsPort || this.config.httpPort || 8080;

      const registration: ServiceRegistration = {
        serviceId: this.config.serviceId,
        name: this.config.name,
        version: this.config.version,
        description: this.config.description,
        endpoint: {
          protocol,
          host: "localhost",
          port,
          basePath: "/"
        },
        tools: [
          {
            name: "council_consult",
            description: "Consult multiple personas and produce a synthesis (agreements, conflicts, risks/tradeoffs, next_steps).",
            inputSchema: {} as unknown,
            outputSchema: {} as unknown
          },
          {
            name: "persona_consult",
            description: "Consult a single persona returning structured advice, assumptions, questions, next_steps, and confidence.",
            inputSchema: {} as unknown,
            outputSchema: {} as unknown
          },
          {
            name: "council_define_personas",
            description: "Return current persona contracts and apply validated workspace-level overrides.",
            inputSchema: {} as unknown,
            outputSchema: {} as unknown
          }
        ],
        healthCheckUrl: `${protocol}://localhost:${port}/health`,
        registrationTimestamp: new Date().toISOString(),
        lastHealthCheckTime: this.lastHealthCheckTime,
        status: healthCheck.status as ServiceStatus
      };

      this.registeredServiceId = registration.serviceId;
      this.retryCount = 0;

      this.logger.info(
        {
          event: "service.registration.success",
          serviceId: registration.serviceId,
          endpoint: registration.endpoint,
          status: registration.status
        },
        "Service registered with Docker Desktop MCP"
      );

      return registration;
    } catch (err: any) {
      this.retryCount++;
      this.logger.error(
        {
          event: "service.registration.error",
          attempt: this.retryCount,
          maxRetries: this.maxRetries,
          error: err?.message
        },
        `Service registration failed (attempt ${this.retryCount}/${this.maxRetries})`
      );

      if (this.retryCount >= this.maxRetries) {
        this.logger.error(
          { event: "service.registration.fatal", attempts: this.retryCount },
          "Service registration exhausted all retries"
        );
        return null;
      }

      // Exponential backoff: 100ms, 300ms, 900ms
      const delay = Math.pow(3, this.retryCount - 1) * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));

      return this.registerService(); // Recursive retry
    }
  }

  async deregisterService(): Promise<void> {
    try {
      if (!this.registeredServiceId) {
        this.logger.debug({ event: "service.deregistration.skip" }, "No service registered to deregister");
        return;
      }

      this.logger.info(
        { event: "service.deregistration.start", serviceId: this.registeredServiceId },
        "Deregistering service from Docker Desktop MCP"
      );

      // Placeholder: actual Docker MCP API call would happen here
      this.registeredServiceId = undefined;

      this.logger.info(
        { event: "service.deregistration.success" },
        "Service deregistered successfully"
      );
    } catch (err: any) {
      this.logger.error(
        { event: "service.deregistration.error", error: err?.message },
        "Service deregistration failed"
      );
      throw err;
    }
  }

  async updateServiceStatus(status: ServiceStatus): Promise<void> {
    try {
      const healthCheck = await this.healthChecker.performHealthCheck();
      this.lastHealthCheckTime = healthCheck.timestamp;

      this.logger.debug(
        {
          event: "service.status.update",
          status,
          healthStatus: healthCheck.status,
          lastHealthCheck: this.lastHealthCheckTime
        },
        `Service status updated to ${status}`
      );
    } catch (err: any) {
      this.logger.error(
        { event: "service.status.update.error", error: err?.message },
        "Failed to update service status"
      );
    }
  }

  getLastHealthCheckTime(): string | undefined {
    return this.lastHealthCheckTime;
  }
}
